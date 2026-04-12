import { Request, Response } from "express";
import cloudinary from "../config/cloudinary";

import { User } from "../models/User";
import { Book } from "../models/Book";
import { Author } from "../models/Author";

import { logger } from "../utils/logger";

import { promises as fs } from "fs";
import path from "path";
import {
  bookQuerySchema,
  createBookSchema,
  updateBookSchema,
} from "../validators/book.validator";
import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import {
  extractEpubPreview,
  removeEpubPreview,
  resolveEpubPreviewPath,
} from "../services/epub-preview.service";

// Set up DOMPurify on the server using a fake DOM from jsdom
const window = new JSDOM("").window;
const purify = DOMPurify(window as any);

// These categories are too broad to be useful for "similar books" matching.
const IGNORED_SIMILARITY_CATEGORIES = new Set([
  "fiction",
  "non-fiction",
  "general",
]);

// This helper makes category comparison case-insensitive and whitespace-safe.
const normalizeCategory = (category: string) => category.trim().toLowerCase();

// This helper escapes regex characters so title searches stay literal.
const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// HELPER: Upload buffer to Cloudinary
const uploadToCloudinary = (
  buffer: Buffer,
  folder: string,
  resourceType: "image" | "raw" = "image",
): Promise<{ url: string; publicId: string }> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("Cloudinary upload failed"));
        } else {
          resolve({ url: result.secure_url, publicId: result.public_id });
        }
      },
    );
    stream.end(buffer);
  });
};

// HELPER: Delete file from Cloudinary
const deleteFromCloudinary = async (
  publicId: string,
  resourceType: "image" | "raw" = "image",
) => {
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  } catch (error) {
    // Log but don't crash — a failed delete shouldn't block the main operation
    logger.warn("Failed to delete from Cloudinary", { publicId, error });
  }
};

const buildAbsoluteUrl = (req: Request, pathname: string) =>
  `${req.protocol}://${req.get("host")}${pathname}`;

const getEpubPreviewUrl = (req: Request, bookId: string, packagePath: string) =>
  buildAbsoluteUrl(
    req,
    `/api/books/${bookId}/preview/epub/${packagePath
      .split("/")
      .map(encodeURIComponent)
      .join("/")}`,
  );

const EPUB_CONTENT_TYPES: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".htm": "text/html; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "application/javascript; charset=utf-8",
  ".ncx": "application/x-dtbncx+xml; charset=utf-8",
  ".opf": "application/oebps-package+xml; charset=utf-8",
  ".otf": "font/otf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".xhtml": "application/xhtml+xml; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

const OPTIONAL_EPUB_ASSETS = new Map<
  string,
  { body: string; contentType: string }
>([
  [
    "META-INF/com.apple.ibooks.display-options.xml",
    {
      body: `<?xml version="1.0" encoding="UTF-8"?><display_options><platform name="*"><option name="specified-fonts">false</option></platform></display_options>`,
      contentType: "application/xml; charset=utf-8",
    },
  ],
]);

const stripEmbeddedFontFaces = (css: string) =>
  css.replace(/@font-face\s*{[^}]*}/gims, "");

const ensureStoredEpubPreview = async (book: {
  _id: unknown;
  fileUrl?: string | null;
  epubPreviewDir?: string | null;
  epubPackagePath?: string | null;
}) => {
  if (book.epubPreviewDir && book.epubPackagePath) {
    return {
      previewDir: book.epubPreviewDir,
      packagePath: book.epubPackagePath,
    };
  }

  if (!book.fileUrl) {
    throw new Error("EPUB source file is not available");
  }

  const response = await fetch(book.fileUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch EPUB source: ${response.status}`);
  }

  const epubBuffer = Buffer.from(await response.arrayBuffer());
  const preview = await extractEpubPreview(epubBuffer);

  try {
    await Book.findByIdAndUpdate(book._id, {
      epubPreviewDir: preview.previewDir,
      epubPackagePath: preview.packagePath,
    });
    return preview;
  } catch (error) {
    await removeEpubPreview(preview.previewDir);
    throw error;
  }
};

// GET /api/books — paginated, filtered, sorted catalog
export const getBooks = async (req: Request, res: Response) => {
  try {
    const query = bookQuerySchema.parse(req.query);
    const filter: any = { isActive: true };

    if (query.search) {
      // This makes the search text safe to use inside a regex.
      const safeSearch = escapeRegex(query.search.trim());

      // This keeps catalog search behavior consistent with autocomplete.
      filter.$or = [
        { title: { $regex: safeSearch, $options: "i" } },
        { authorName: { $regex: safeSearch, $options: "i" } },
      ];
    }
    if (query.category) filter.category = query.category;
    if (query.author) filter.author = query.author; // Filter by Author ObjectId

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      filter.price = {};
      if (query.minPrice !== undefined) filter.price.$gte = query.minPrice;
      if (query.maxPrice !== undefined) filter.price.$lte = query.maxPrice;
    }

    if (query.fileType) filter.fileType = query.fileType;

    const sort: any = {
      [query.sortBy]: query.sortOrder === "asc" ? 1 : -1,
    };

    const skip = (query.page - 1) * query.limit;

    const [books, total] = await Promise.all([
      Book.find(filter)
        .populate("author", "name avatar specialty") // Join author info
        .sort(sort)
        .skip(skip)
        .limit(query.limit),
      Book.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / query.limit);

    res.json({
      books,
      total,
      currentPage: query.page,
      totalPages,
      hasNextPage: query.page < totalPages,
      hasPreviousPage: query.page > 1,
    });
  } catch (error) {
    logger.error("getBooks error", { error });
    res.status(500).json({ error: "Failed to fetch books" });
  }
};

// GET /api/books/featured
// Public. Returns up to 5 books scored by a combination of signals:
//   purchaseCount * 10  — primary driver (real market signal)
//   isNewRelease * 5    — bonus for books published within the last 60 days
//   rating * 2          — tiebreaker on quality
// Fallback when everything scores 0: newest publishedDate wins.
export const getFeatured = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  // Fetch all active books — we score in-memory since the catalog is small
  // and MongoDB's $addFields aggregation for this formula would be harder to read
  const allBooks = await Book.find({ isActive: true })
    .populate("author", "name avatar specialty")
    .lean();

  // Determine the cutoff date for "new release" — anything published in the last 60 days
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  // Score every book using our three signals
  const scored = allBooks.map((book) => {
    // Signal 1: purchase count — the strongest signal, weighted highest
    const purchaseScore = (book.purchaseCount ?? 0) * 10;

    // Signal 2: new release bonus — recently published books get a visibility boost
    // Uses publishedDate (the real publication date) not createdAt (when admin added it)
    const isNewRelease =
      book.publishedDate && new Date(book.publishedDate) >= sixtyDaysAgo;
    const newReleaseScore = isNewRelease ? 5 : 0;

    // Signal 3: rating tiebreaker — between equally purchased books, better rated wins
    const ratingScore = (book.rating ?? 0) * 2;

    // Final score — sum of all three signals
    const score = purchaseScore + newReleaseScore + ratingScore;

    return { ...book, score };
  });

  // Sort by score descending — highest scoring books first
  // Secondary sort by publishedDate descending handles the all-zero fallback:
  // when no one has bought anything and all scores are 0, newest published books show first
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // Tiebreaker: newer publication date wins
    const dateA = a.publishedDate ? new Date(a.publishedDate).getTime() : 0;
    const dateB = b.publishedDate ? new Date(b.publishedDate).getTime() : 0;
    return dateB - dateA;
  });

  // Take only the top 5 — hero carousel is always capped at 5
  const books = scored.slice(0, 5);

  logger.info("Featured books served", {
    count: books.length,
    topScore: books[0]?.score ?? 0,
  });

  res.status(200).json({ books });
};

// GET /api/books/search/autocomplete — search suggestions
export const searchAutocomplete = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== "string" || q.trim().length < 2) {
      return res.json({ suggestions: [] });
    }

    const suggestions = await Book.find({
      isActive: true,
      $or: [
        { title: { $regex: q.trim(), $options: "i" } },
        { authorName: { $regex: q.trim(), $options: "i" } }, // Search denormalized name
      ],
    })
      .select("title authorName coverImage price")
      .limit(6);

    res.json({ suggestions });
  } catch (error) {
    logger.error("searchAutocomplete error", { error });
    res.status(500).json({ error: "Search failed" });
  }
};

// GET /api/books/category/:category — books by category
export const getBooksByCategory = async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const skip = (page - 1) * limit;

    const [books, total] = await Promise.all([
      Book.find({ isActive: true, category })
        .populate("author", "name avatar")
        .skip(skip)
        .limit(limit),
      Book.countDocuments({ isActive: true, category }),
    ]);

    res.json({
      books,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    logger.error("getBooksByCategory error", { error });
    res.status(500).json({ error: "Failed to fetch books by category" });
  }
};

// GET /api/books/:id/similar — related books based on shared meaningful categories
export const getSimilarBooks = async (req: Request, res: Response) => {
  try {
    // This keeps the route param as a plain string for Mongo queries.
    const bookId = String(req.params.id);

    // We only need the current book's categories to build similarity rules.
    const currentBook = await Book.findOne({
      _id: bookId,
      isActive: true,
    })
      .select("category")
      .lean();

    // If the current book does not exist, we stop early.
    if (!currentBook) {
      return res.status(404).json({ error: "Book not found" });
    }

    // This keeps only valid category strings from the current book.
    const rawCategories = Array.isArray(currentBook.category)
      ? currentBook.category.filter(
          (category): category is string =>
            typeof category === "string" && category.trim().length > 0,
        )
      : [];

    // This removes broad categories like "Non-Fiction" from matching.
    const meaningfulCategories = rawCategories.filter(
      (category) =>
        !IGNORED_SIMILARITY_CATEGORIES.has(normalizeCategory(category)),
    );

    // If every category is broad, we fall back to the original category list.
    const categoriesToMatch =
      meaningfulCategories.length > 0 ? meaningfulCategories : rawCategories;

    // No categories means there is nothing useful to compare against.
    if (categoriesToMatch.length === 0) {
      return res.json({ books: [] });
    }

    // We fetch candidate books that share at least one chosen category.
    const candidateBooks = await Book.find({
      _id: { $ne: bookId },
      isActive: true,
      category: { $in: categoriesToMatch },
    })
      .populate("author", "name avatar")
      .lean();

    // This stores the normalized category set for faster overlap checks.
    const normalizedMatchSet = new Set(
      categoriesToMatch.map((category) => normalizeCategory(category)),
    );

    // This scores each candidate by how many meaningful categories it shares.
    const rankedBooks = candidateBooks
      .map((book) => {
        // This normalizes the candidate's categories before comparing them.
        const normalizedCandidateCategories = Array.isArray(book.category)
          ? book.category
              .filter(
                (category): category is string =>
                  typeof category === "string" && category.trim().length > 0,
              )
              .map((category) => normalizeCategory(category))
          : [];

        // This counts how many categories overlap with the current book.
        const overlapCount = normalizedCandidateCategories.filter((category) =>
          normalizedMatchSet.has(category),
        ).length;

        return { book, overlapCount };
      })
      // This keeps only books with at least one real category match.
      .filter(({ overlapCount }) => overlapCount > 0)
      // This puts the strongest matches first.
      .sort((a, b) => b.overlapCount - a.overlapCount)
      // This keeps the sidebar short and focused.
      .slice(0, 4)
      // This returns the plain book objects expected by the client.
      .map(({ book }) => book);

    res.json({ books: rankedBooks });
  } catch (error) {
    logger.error("getSimilarBooks error", { error });
    res.status(500).json({ error: "Failed to fetch similar books" });
  }
};

// GET /api/books/:id — single book detail
export const getBookById = async (req: Request, res: Response) => {
  try {
    const book = await Book.findOne({
      _id: req.params.id,
      isActive: true,
    }).populate("author", "name avatar specialty bio website socialLinks");
    // Populate full author info on the detail page — we need bio + social links

    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    res.json({ book });
  } catch (error) {
    logger.error("getBookById error", { error });
    res.status(500).json({ error: "Failed to fetch book" });
  }
};

// GET /api/books/categories — returns every distinct category that exists
// across all active books — used by the BookFilters category buttons
export const getCategories = async (req: Request, res: Response) => {
  try {
    // MongoDB distinct() returns a flat array of unique values for a field
    // We only look at active books so soft-deleted books don't pollute the list
    const categories = await Book.distinct("category", { isActive: true });

    // Sort alphabetically so the filter buttons are easy to scan
    categories.sort();

    res.json({ categories });
  } catch (error) {
    logger.error("getCategories error", { error });
    res.status(500).json({ error: "Failed to fetch categories" });
  }
};

// GET /api/books/:id/preview
// Generates a short-lived signed Cloudinary URL for the book's file.
// Only returns the URL + previewPages count — the frontend enforces the page limit.
// This endpoint is PUBLIC — no auth required (it's a teaser for non-purchasers).
export const getBookPreview = async (req: Request, res: Response) => {
  try {
    // Cast the id param to string so TypeScript is happy
    const bookId = req.params.id as string;

    // Find the book and only select the fields we need for the preview
    // filePublicId is the Cloudinary identifier, previewPages tells us the limit
    const book = await Book.findById(bookId)
      .select(
        "title filePublicId fileType fileUrl previewPages isActive epubPreviewDir epubPackagePath",
      ) // Only fetch what we need
      .lean(); // .lean() returns a plain JS object — faster than a full Mongoose doc

    // If no book found or it has been soft-deleted, return 404
    if (!book || !book.isActive) {
      res.status(404).json({ error: "Book not found" }); // Inform the client cleanly
      return; // Stop execution here
    }

    // If this book has no file uploaded yet, we can't generate a preview
    if (!book.filePublicId) {
      res
        .status(400)
        .json({ error: "This book does not have a preview available" }); // Clear message
      return; // Stop execution here
    }

    // If the admin never set previewPages, default to 5 so something is shown
    const previewPages = book.previewPages ?? 5; // Nullish coalescing — only triggers on null/undefined

    // Generate a Cloudinary signed URL that expires in 15 minutes (900 seconds)
    // We use a shorter expiry than downloads (1hr) because previews are low-value access
    const expiresAt = Math.floor(Date.now() / 1000) + 900; // Current Unix timestamp + 15 min

    let previewUrl: string;

    if (book.fileType === "epub") {
      const preview = await ensureStoredEpubPreview(book);
      previewUrl = getEpubPreviewUrl(req, bookId, preview.packagePath);
    } else {
      // Build the signed URL using the Cloudinary SDK
      // resource_type: 'raw' is required for PDFs and ePubs — they are non-image files
      // sign_url: true adds a cryptographic signature so the URL can't be guessed or tampered with
      previewUrl = cloudinary.url(book.filePublicId, {
        sign_url: true, // Enable URL signing — required for secure delivery
        expires_at: expiresAt, // URL becomes invalid after 15 minutes
        resource_type: "raw", // Must be 'raw' for PDF/ePub files
        type: "upload", // The file was uploaded (not fetched from a remote URL)
      });
    }

    // Log that a preview was generated — useful for analytics without storing the URL
    logger.info("Book preview URL generated", {
      bookId,
      title: book.title,
      previewPages,
    }); // Safe log — no URL

    // Return the signed URL and the page limit to the frontend
    // The frontend is responsible for only rendering up to previewPages
    res.json({
      previewUrl, // The signed Cloudinary URL — valid for 15 minutes
      previewPages, // How many pages the frontend is allowed to render
    });
  } catch (error) {
    // Log the full error internally but never send stack traces to the client
    logger.error("Error generating book preview", { error }); // Internal log for debugging
    res.status(500).json({ error: "Failed to generate book preview" }); // Safe client message
  }
};

// GET /api/books/:id/preview/epub/* — serves extracted EPUB assets for the reader
export const getEpubPreviewAsset = async (req: Request, res: Response) => {
  const rawAssetPath = req.params.assetPath;
  const assetPath = Array.isArray(rawAssetPath)
    ? rawAssetPath.join("/")
    : rawAssetPath;

  try {
    const bookId = String(req.params.id);

    if (!assetPath) {
      res.status(400).json({ error: "Preview asset path is required" });
      return;
    }

    const book = await Book.findById(bookId)
      .select("isActive fileType epubPreviewDir")
      .lean();

    if (!book || !book.isActive) {
      res.status(404).json({ error: "Book not found" });
      return;
    }

    if (book.fileType !== "epub" || !book.epubPreviewDir) {
      res.status(404).json({ error: "EPUB preview not found" });
      return;
    }

    const absoluteAssetPath = resolveEpubPreviewPath(
      book.epubPreviewDir,
      assetPath,
    );

    const extension = path.extname(absoluteAssetPath).toLowerCase();
    const contentType = EPUB_CONTENT_TYPES[extension];
    if (contentType) {
      res.type(contentType);
    }

    // epubjs renders chapter documents in sandboxed iframes (about:srcdoc),
    // so preview assets must opt out of Helmet's default same-origin resource
    // policy or the browser will block CSS/images as NotSameOrigin.
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Access-Control-Allow-Origin", "*");

    if (
      extension === ".otf" ||
      extension === ".ttf" ||
      extension === ".woff" ||
      extension === ".woff2"
    ) {
      res.status(204).end();
      return;
    }

    if (extension === ".css") {
      const css = await fs.readFile(absoluteAssetPath, "utf8");
      res.send(stripEmbeddedFontFaces(css));
      return;
    }

    await fs.access(absoluteAssetPath);
    res.sendFile(absoluteAssetPath);
  } catch (error: any) {
    if (error?.code === "ENOENT") {
      const fallbackAsset = OPTIONAL_EPUB_ASSETS.get(assetPath);
      if (fallbackAsset) {
        res.type(fallbackAsset.contentType);
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.send(fallbackAsset.body);
        return;
      }
    }

    if (error?.code === "ENOENT") {
      res.status(404).json({ error: "Preview asset not found" });
      return;
    }

    logger.error("Error serving EPUB preview asset", { error });
    res.status(500).json({ error: "Failed to serve EPUB preview asset" });
  }
};

// POST /api/books — admin creates a new book
export const createBook = async (req: Request, res: Response) => {
  let createdEpubPreviewDir: string | null = null;

  try {
    const data = createBookSchema.parse(req.body);
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (!files?.file?.[0] || !files?.coverImage?.[0]) {
      return res.status(400).json({
        error: "Both book file and cover image are required",
      });
    }

    // Verify the author ObjectId actually exists in our Author collection
    const authorExists = await Author.findById(data.author);
    if (!authorExists) {
      return res.status(400).json({ error: "Author not found" });
    }

    const sanitizedDescription = purify.sanitize(data.description);
    const bookFile = files.file[0];
    const nextFileType = data.fileType;
    const epubPreview =
      nextFileType === "epub"
        ? await extractEpubPreview(bookFile.buffer)
        : null;
    createdEpubPreviewDir = epubPreview?.previewDir ?? null;

    // Upload both files to Cloudinary in parallel
    const [fileUpload, coverUpload] = await Promise.all([
      uploadToCloudinary(bookFile.buffer, "kun-bookshop/books", "raw"),
      uploadToCloudinary(
        files.coverImage[0].buffer,
        "kun-bookshop/covers",
        "image",
      ),
    ]);

    const category = JSON.parse(data.category) as string[];
    const tags = data.tags ? (JSON.parse(data.tags) as string[]) : [];

    const book = await Book.create({
      ...data,
      authorName: authorExists.name,
      description: sanitizedDescription,
      category,
      tags,
      fileUrl: fileUpload.url,
      filePublicId: fileUpload.publicId, // Store for later deletion
      epubPreviewDir: epubPreview?.previewDir ?? null,
      epubPackagePath: epubPreview?.packagePath ?? null,
      coverImage: coverUpload.url,
      coverPublicId: coverUpload.publicId, // Store for later deletion
      fileSize: bookFile.size,
    });

    logger.info("Book created", { bookId: book._id, title: book.title });

    res.status(201).json({ book });
  } catch (error: any) {
    if (createdEpubPreviewDir) {
      await removeEpubPreview(createdEpubPreviewDir);
    }

    if (error.name === "ZodError") {
      return res.status(400).json({ error: error.errors[0].message });
    }
    logger.error("createBook error", { error });
    res.status(500).json({ error: "Failed to create book" });
  }
};

// PUT /api/books/:id — admin updates a book
export const updateBook = async (req: Request, res: Response) => {
  let createdEpubPreviewDir: string | null = null;

  try {
    const data = updateBookSchema.parse(req.body);
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const updates: any = { ...data };

    // If author is being changed, verify the new author exists
    if (data.author) {
      const authorExists = await Author.findById(data.author);
      if (!authorExists) {
        return res.status(400).json({ error: "Author not found" });
      }
      updates.authorName = authorExists.name;
    }

    if (data.description) {
      updates.description = purify.sanitize(data.description);
    }

    if (files?.file?.[0]) {
      const nextFileType = (data.fileType ?? book.fileType) as "pdf" | "epub";
      const nextEpubPreview =
        nextFileType === "epub"
          ? await extractEpubPreview(files.file[0].buffer)
          : null;
      createdEpubPreviewDir = nextEpubPreview?.previewDir ?? null;

      const fileUpload = await uploadToCloudinary(
        files.file[0].buffer,
        "kun-bookshop/books",
        "raw",
      );

      if (book.filePublicId) {
        await deleteFromCloudinary(book.filePublicId, "raw");
      }

      if (book.epubPreviewDir) {
        await removeEpubPreview(book.epubPreviewDir);
      }

      updates.fileUrl = fileUpload.url;
      updates.filePublicId = fileUpload.publicId;
      updates.fileSize = files.file[0].size;
      updates.epubPreviewDir = nextEpubPreview?.previewDir ?? null;
      updates.epubPackagePath = nextEpubPreview?.packagePath ?? null;
    }

    // Delete old cover from Cloudinary before uploading new one
    if (files?.coverImage?.[0]) {
      if (book.coverPublicId)
        await deleteFromCloudinary(book.coverPublicId, "image");
      const coverUpload = await uploadToCloudinary(
        files.coverImage[0].buffer,
        "kun-bookshop/covers",
        "image",
      );
      updates.coverImage = coverUpload.url;
      updates.coverPublicId = coverUpload.publicId;
    }

    if (data.category) updates.category = JSON.parse(data.category);
    if (data.tags) updates.tags = JSON.parse(data.tags);

    const updatedBook = await Book.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate("author", "name avatar specialty");

    logger.info("Book updated", { bookId: req.params.id });

    res.json({ book: updatedBook });
  } catch (error: any) {
    if (createdEpubPreviewDir) {
      await removeEpubPreview(createdEpubPreviewDir);
    }

    if (error.name === "ZodError") {
      return res.status(400).json({ error: error.errors[0].message });
    }
    logger.error("updateBook error", { error });
    res.status(500).json({ error: "Failed to update book" });
  }
};

// GET /api/books/recommendations
// Public. Returns fallback discovery books for guests and personalised results
// for authenticated users when enough signal exists.
// Algorithm:
//   1. Exclude books already showing in the hero — no overlap between sections
//   2. If a valid user exists, collect categories from library + wishlist
//   3. Personalise only when enough user signal exists
//   4. Score remaining books: purchaseCount * 10 + rating * 2, plus category relevance
//   5. If personalised results don't fill 10, pad with top-scored books not in result set
// Fallback (guest or new user): top-scored books overall
export const getRecommendations = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const userId = req.user?.userId;

  // Fetch the user's library and wishlist when we have a valid authenticated user.
  const user = userId
    ? await User.findById(userId).select("library wishlist").lean()
    : null;

  // Fetch the current hero books so we can exclude them from recommendations
  // This prevents the same book appearing in both sections
  const heroBooks = await Book.find({ isActive: true })
    .select("purchaseCount publishedDate rating")
    .lean();

  // Re-run the same hero scoring logic to know which 5 are currently in the hero
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const heroScored = heroBooks.map((book) => ({
    ...book,
    score:
      (book.purchaseCount ?? 0) * 10 +
      (book.publishedDate && new Date(book.publishedDate) >= sixtyDaysAgo
        ? 5
        : 0) +
      (book.rating ?? 0) * 2,
  }));
  heroScored.sort((a, b) => b.score - a.score);

  // The IDs of the top 5 hero books — these are excluded from recommendations
  const heroIds = heroScored.slice(0, 5).map((b) => b._id.toString());

  // Build the full exclusion list:
  // - books the user already owns (library)
  // - books currently in the hero
  // We deliberately keep wishlist books INCLUDABLE — recommending something they wishlisted
  // is a useful nudge toward purchase
  const libraryIds = (user?.library ?? []).map((id) => id.toString());
  const excludeIds = [...new Set([...libraryIds, ...heroIds])];

  // Determine whether we have enough signal for personalisation
  const hasLibrary = libraryIds.length > 0;
  const hasWishlist = (user?.wishlist ?? []).length > 0;
  const isPersonalised = !!userId && (hasLibrary || hasWishlist);

  let books;

  if (isPersonalised) {
    // PERSONALISED PATH

    // Step 1: Collect categories from library purchases
    const libraryBooks = hasLibrary
      ? await Book.find({ _id: { $in: user!.library }, isActive: true })
          .select("category")
          .lean()
      : [];

    // Step 2: Collect categories from wishlist items
    const wishlistBooks = hasWishlist
      ? await Book.find({ _id: { $in: user!.wishlist }, isActive: true })
          .select("category")
          .lean()
      : [];

    // Step 3: Build a weighted category frequency map
    // Wishlist categories count double — user is actively interested but hasn't bought yet
    const categoryWeight: Record<string, number> = {};

    for (const book of libraryBooks) {
      for (const cat of book.category) {
        categoryWeight[cat] = (categoryWeight[cat] ?? 0) + 1; // Each purchase = 1 point
      }
    }
    for (const book of wishlistBooks) {
      for (const cat of book.category) {
        categoryWeight[cat] = (categoryWeight[cat] ?? 0) + 2; // Each wishlist = 2 points (weighted higher)
      }
    }

    // Step 4: Get all unique categories the user cares about
    const interestedCategories = Object.keys(categoryWeight);

    // Step 5: Find candidate books — match at least one interested category, not excluded
    const candidates = await Book.find({
      isActive: true,
      category: { $in: interestedCategories },
      _id: { $nin: excludeIds }, // Exclude owned + hero books
    })
      .select(
        "title authorName coverImage price discountPrice rating reviewCount purchaseCount category",
      )
      .lean();

    // Step 6: Score candidates — purchaseCount drives rank, category weight personalises it,
    // rating breaks ties
    const scored = candidates.map((book) => {
      // Sum the category weights for every category this book shares with the user's interests
      const categoryScore = book.category.reduce(
        (sum, cat) => sum + (categoryWeight[cat] ?? 0),
        0,
      );
      const score =
        (book.purchaseCount ?? 0) * 10 + // Popularity
        categoryScore * 3 + // Personal relevance (category weight)
        (book.rating ?? 0) * 2; // Quality tiebreaker

      return { ...book, score };
    });

    scored.sort((a, b) => b.score - a.score);
    books = scored.slice(0, 10);

    // Step 7: If personalised results don't fill 10, pad with top-scored books
    // This handles the case where the user's taste is very niche
    if (books.length < 10) {
      const alreadyInResults = books.map((b) => b._id.toString());
      const padExclude = [...excludeIds, ...alreadyInResults];

      const padCandidates = await Book.find({
        isActive: true,
        _id: { $nin: padExclude }, // Don't repeat anything already in the list
      })
        .select(
          "title authorName coverImage price discountPrice rating reviewCount purchaseCount category",
        )
        .lean();

      const padScored = padCandidates
        .map((book) => ({
          ...book,
          score: (book.purchaseCount ?? 0) * 10 + (book.rating ?? 0) * 2,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 10 - books.length); // Only take as many as we need to reach 10

      books = [...books, ...padScored];
    }
  } else {
    // FALLBACK PATH (brand new user — no library, no wishlist)
    // Show the top-scored books overall, excluding only hero books
    const candidates = await Book.find({
      isActive: true,
      _id: { $nin: excludeIds }, // Still exclude hero books so sections don't overlap
    })
      .select(
        "title authorName coverImage price discountPrice rating reviewCount purchaseCount category",
      )
      .lean();

    const scored = candidates
      .map((book) => ({
        ...book,
        score: (book.purchaseCount ?? 0) * 10 + (book.rating ?? 0) * 2,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    books = scored;
  }

  logger.info("Recommendations served", {
    userId: userId ?? null,
    personalised: isPersonalised,
    count: books.length,
  });

  res.status(200).json({ books, personalised: isPersonalised });
};

// DELETE /api/books/:id — admin soft deletes a book
export const deleteBook = async (req: Request, res: Response) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    // Soft delete — set isActive to false
    book.isActive = false;
    await book.save();

    logger.info("Book soft-deleted", { bookId: req.params.id });

    res.json({ message: "Book deleted successfully" });
  } catch (error) {
    logger.error("deleteBook error", { error });
    res.status(500).json({ error: "Failed to delete book" });
  }
};

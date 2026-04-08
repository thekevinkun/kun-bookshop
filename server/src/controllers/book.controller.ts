import { Request, Response } from "express";
import { Book } from "../models/Book";
import { Author } from "../models/Author";
import cloudinary from "../config/cloudinary";
import { logger } from "../utils/logger";
import {
  bookQuerySchema,
  createBookSchema,
  updateBookSchema,
} from "../validators/book.validator";
import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";

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

// --- HELPER: Upload buffer to Cloudinary ---
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

// --- HELPER: Delete file from Cloudinary ---
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

// GET /api/books — paginated, filtered, sorted catalog
export const getBooks = async (req: Request, res: Response) => {
  try {
    const query = bookQuerySchema.parse(req.query);
    const filter: any = { isActive: true };

    if (query.search) filter.$text = { $search: query.search };
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

// GET /api/books/featured — homepage carousel
export const getFeatured = async (req: Request, res: Response) => {
  try {
    const books = await Book.find({ isActive: true, isFeatured: true })
      .populate("author", "name avatar specialty")
      .limit(8);
    res.json({ books });
  } catch (error) {
    logger.error("getFeatured error", { error });
    res.status(500).json({ error: "Failed to fetch featured books" });
  }
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

// GET /api/books/:id/preview — free preview for non-buyers
export const getPreview = async (req: Request, res: Response) => {
  try {
    const book = await Book.findOne({ _id: req.params.id, isActive: true });

    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    if (!book.previewPages) {
      return res
        .status(404)
        .json({ error: "No preview available for this book" });
    }

    res.json({
      previewPages: book.previewPages,
      fileType: book.fileType,
      previewAvailable: true,
    });
  } catch (error) {
    logger.error("getPreview error", { error });
    res.status(500).json({ error: "Failed to fetch preview" });
  }
};

// POST /api/books — admin creates a new book
export const createBook = async (req: Request, res: Response) => {
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

    // Upload both files to Cloudinary in parallel
    const [fileUpload, coverUpload] = await Promise.all([
      uploadToCloudinary(files.file[0].buffer, "kun-bookshop/books", "raw"),
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
      coverImage: coverUpload.url,
      coverPublicId: coverUpload.publicId, // Store for later deletion
      fileSize: files.file[0].size,
    });

    logger.info("Book created", { bookId: book._id, title: book.title });

    res.status(201).json({ book });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: error.errors[0].message });
    }
    logger.error("createBook error", { error });
    res.status(500).json({ error: "Failed to create book" });
  }
};

// PUT /api/books/:id — admin updates a book
export const updateBook = async (req: Request, res: Response) => {
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

    // Delete old book file from Cloudinary before uploading new one
    if (files?.file?.[0]) {
      if (book.filePublicId)
        await deleteFromCloudinary(book.filePublicId, "raw");
      const fileUpload = await uploadToCloudinary(
        files.file[0].buffer,
        "kun-bookshop/books",
        "raw",
      );
      updates.fileUrl = fileUpload.url;
      updates.filePublicId = fileUpload.publicId;
      updates.fileSize = files.file[0].size;
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
    if (error.name === "ZodError") {
      return res.status(400).json({ error: error.errors[0].message });
    }
    logger.error("updateBook error", { error });
    res.status(500).json({ error: "Failed to update book" });
  }
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

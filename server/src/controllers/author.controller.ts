// Import Express types for request and response objects
import { Request, Response } from "express";

// Import the Author model to query the authors collection
import { Author } from "../models/Author";

// Import the Book model — we need it to check if an author has books before deleting
import { Book } from "../models/Book";

// Import Cloudinary so we can upload and delete author avatar images
import cloudinary from "../config/cloudinary";

// Import our logger for server-side error logging
import { logger } from "../utils/logger";

// Import Zod validators for author creation and update
import {
  createAuthorSchema,
  updateAuthorSchema,
} from "../validators/book.validator";

// Import DOMPurify + jsdom to sanitize the author bio HTML on the server
import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";

// Import audit logger so we can record admin actions
import { logAuditEvent } from "../services/audit.service";

// Set up DOMPurify in Node.js — it normally runs in browsers so we simulate a DOM
const window = new JSDOM("").window;
const purify = DOMPurify(window as any);

// HELPER: Upload buffer to Cloudinary
// Reuses the same pattern as book.controller.ts — uploads from memory to Cloudinary
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
const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  } catch (error) {
    // Log but don't crash — a failed delete shouldn't block the main operation
    logger.warn("Failed to delete avatar from Cloudinary", { publicId, error });
  }
};

// 1. getAuthors — GET /api/authors
// Returns all active authors. Supports optional ?search= param.
// Public — no auth required.

export const getAuthors = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const search = req.query.search as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    // Build filter — text search on name if provided, otherwise return all active authors
    const filter: Record<string, any> = { isActive: true };
    if (search) {
      filter.$text = { $search: search }; // Uses the text index on Author.name
    }

    const authors = await Author.find(filter)
      .sort({ name: 1 }) // Alphabetical order — easiest to scan in a dropdown
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const total = await Author.countDocuments(filter);

    res.json({
      authors,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    logger.error("getAuthors error", { error });
    res.status(500).json({ error: "Failed to fetch authors" });
  }
};

// 2. getAuthorById — GET /api/authors/:id
// Returns a single author with their books.
// Public — used by the book detail page Author tab.
export const getAuthorById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const author = await Author.findOne({
      _id: req.params.id,
      isActive: true,
    }).lean();

    if (!author) {
      res.status(404).json({ error: "Author not found" });
      return;
    }

    // Also fetch this author's active books for the author profile page
    const books = await Book.find({ author: req.params.id, isActive: true })
      .select("title authorName coverImage price rating purchaseCount")
      .limit(12)
      .lean();

    res.json({ author, books });
  } catch (error) {
    logger.error("getAuthorById error", { error });
    res.status(500).json({ error: "Failed to fetch author" });
  }
};

// 3. createAuthor — POST /api/authors
// Admin only. Creates a new author with avatar upload.
export const createAuthor = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // Validate the request body against our Zod schema
    const data = createAuthorSchema.parse(req.body);

    // Avatar is required when creating an author
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (!files?.avatar?.[0]) {
      res.status(400).json({ error: "Author avatar image is required" });
      return;
    }

    // Upload the avatar to Cloudinary
    const avatarUpload = await uploadToCloudinary(
      files.avatar[0].buffer,
      "kun-bookshop/authors",
      "image",
    );

    // Sanitize the bio HTML to prevent XSS — same as book description
    const sanitizedBio = purify.sanitize(data.bio);

    // Parse specialty from JSON string to array — e.g. '["JavaScript","Node.js"]' → array
    let specialty: string[] = [];
    if (data.specialty) {
      try {
        specialty = JSON.parse(data.specialty) as string[];
      } catch {
        res.status(400).json({ error: "Specialties must be a valid list" });
        return;
      }
    }

    // Build the social links object from the flat validator fields
    const socialLinks = {
      twitter: data.twitter ?? undefined,
      linkedin: data.linkedin ?? undefined,
      github: data.github ?? undefined,
      goodreads: data.goodreads ?? undefined,
    };

    const author = await Author.create({
      name: data.name,
      bio: sanitizedBio,
      avatar: avatarUpload.url,
      avatarPublicId: avatarUpload.publicId, // Store so we can delete it on update
      specialty,
      nationality: data.nationality ?? undefined,
      website: data.website ?? undefined,
      socialLinks,
    });

    // Log the creation to the audit trail
    await logAuditEvent({
      userId: req.user!.userId,
      action: "CREATE_AUTHOR",
      resourceType: "Author",
      resourceId: author._id.toString(),
      metadata: { after: { name: author.name } },
      ipAddress: req.ip,
    });

    logger.info("Author created", { authorId: author._id, name: author.name });

    res.status(201).json({ author });
  } catch (error: any) {
    // Handle Zod validation errors with a clean message
    if (error.name === "ZodError") {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    logger.error("createAuthor error", { error });
    res.status(500).json({ error: "Failed to create author" });
  }
};

// 4. updateAuthor — PUT /api/authors/:id
// Admin only. Updates author fields. Avatar upload is optional.
export const updateAuthor = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // Validate with the partial schema — all fields optional on update
    const data = updateAuthorSchema.parse(req.body);

    const author = await Author.findById(req.params.id);
    if (!author) {
      res.status(404).json({ error: "Author not found" });
      return;
    }

    // Build the updates object — only include fields that were sent
    const updates: Record<string, any> = {};

    if (data.name) updates.name = data.name;
    if (data.nationality) updates.nationality = data.nationality;
    if (data.website) updates.website = data.website;
    if (data.bio) updates.bio = purify.sanitize(data.bio);

    // Parse specialty if it was sent
    if (data.specialty) {
      try {
        updates.specialty = JSON.parse(data.specialty) as string[];
      } catch {
        res.status(400).json({ error: "Specialties must be a valid list" });
        return;
      }
    }

    // Rebuild social links if any were sent
    if (data.twitter || data.linkedin || data.github || data.goodreads) {
      updates.socialLinks = {
        twitter: data.twitter ?? author.socialLinks?.twitter ?? null,
        linkedin: data.linkedin ?? author.socialLinks?.linkedin ?? null,
        github: data.github ?? author.socialLinks?.github ?? null,
        goodreads: data.goodreads ?? author.socialLinks?.goodreads ?? null,
      };
    }

    // Handle avatar upload — only if a new file was sent
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (files?.avatar?.[0]) {
      // Delete the old avatar from Cloudinary before uploading the new one
      if (author.avatarPublicId) {
        await deleteFromCloudinary(author.avatarPublicId);
      }
      // Upload the new avatar
      const avatarUpload = await uploadToCloudinary(
        files.avatar[0].buffer,
        "kun-bookshop/authors",
        "image",
      );
      updates.avatar = avatarUpload.url;
      updates.avatarPublicId = avatarUpload.publicId;
    }

    const updatedAuthor = await Author.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }, // Return the updated document
    ).lean();

    // Log the update to the audit trail
    await logAuditEvent({
      userId: req.user!.userId,
      action: "UPDATE_AUTHOR",
      resourceType: "Author",
      resourceId: req.params.id as string,
      metadata: { after: updates },
      ipAddress: req.ip,
    });

    logger.info("Author updated", { authorId: req.params.id });

    res.json({ author: updatedAuthor });
  } catch (error: any) {
    if (error.name === "ZodError") {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    logger.error("updateAuthor error", { error });
    res.status(500).json({ error: "Failed to update author" });
  }
};

// 5. deleteAuthor — DELETE /api/authors/:id
// Admin only. Soft deletes — sets isActive: false.
// Blocks deletion if the author still has active books.
export const deleteAuthor = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const author = await Author.findById(req.params.id);
    if (!author) {
      res.status(404).json({ error: "Author not found" });
      return;
    }

    // Block deletion if this author still has active books
    // Admin must reassign or delete those books first
    const activeBookCount = await Book.countDocuments({
      author: req.params.id,
      isActive: true,
    });

    if (activeBookCount > 0) {
      res.status(400).json({
        error: `Cannot delete author — they still have ${activeBookCount} active book(s). Remove or reassign those books first.`,
      });
      return;
    }

    // Soft delete — keep the data, just hide from public view
    author.isActive = false;
    await author.save();

    // Log the deletion
    await logAuditEvent({
      userId: req.user!.userId,
      action: "DELETE_AUTHOR",
      resourceType: "Author",
      resourceId: req.params.id as string,
      metadata: { before: { name: author.name } },
      ipAddress: req.ip,
    });

    logger.info("Author soft-deleted", { authorId: req.params.id });

    res.json({ message: "Author deleted successfully" });
  } catch (error) {
    logger.error("deleteAuthor error", { error });
    res.status(500).json({ error: "Failed to delete author" });
  }
};

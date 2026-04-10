import mongoose, { Schema, Document } from "mongoose";

// Import our TypeScript interface so the model knows the exact shape
import { IBook } from "../types/book";

// Extend Document so Mongoose methods like .save() are available on IBook
interface IBookDocument extends Omit<IBook, "_id">, Document {}

const BookSchema = new Schema<IBookDocument>(
  {
    // The book's display title — required, trimmed of whitespace
    title: { type: String, required: true, trim: true },

    // Reference to the Author document — allows .populate('author') for full author info
    // We keep a denormalized authorName string too so book listings don't need a join
    author: {
      type: Schema.Types.ObjectId,
      ref: "Author", // Allows .populate('author') in queries
      required: true,
    },

    // Denormalized author name — stored directly on the book for fast list queries
    // Without this, every book card would need to populate the full author doc
    authorName: {
      type: String,
      required: true,
      trim: true,
    },

    // Long-form description — will be sanitized before saving (Security rule §6)
    description: { type: String, required: true },

    // Price in dollars (e.g. 9.99) — must be a positive number
    price: { type: Number, required: true, min: 0 },

    // Optional sale price — if set, this is what customers pay
    discountPrice: { type: Number, min: 0, default: null },

    // Cloudinary URL for the book cover image
    coverImage: { type: String, required: true },

    // Cloudinary URL for the actual PDF/ePub file (never exposed to non-buyers)
    fileUrl: { type: String, required: true },

    // Which format the file is — only these two are allowed
    fileType: { type: String, enum: ["pdf", "epub"], required: true },

    // File size in bytes — set automatically after upload
    fileSize: { type: Number, required: true },

    // Optional ISBN — useful for real book data
    isbn: { type: String, default: null },

    // Optional publisher name — stored as plain text for now
    publisher: { type: String, default: null, trim: true },

    // Array of category strings — e.g. ['Fiction', 'Mystery']
    category: [{ type: String }],

    // Freeform tags for filtering — e.g. ['new', 'bestseller']
    tags: [{ type: String }],

    // Average star rating across all reviews — recalculated on each new review
    rating: { type: Number, default: 0, min: 0, max: 5 },

    // Total number of reviews submitted for this book
    reviewCount: { type: Number, default: 0 },

    // How many times this book has been purchased — used for "bestseller" sorting
    purchaseCount: { type: Number, default: 0 },

    // If true, this book shows up in the homepage featured carousel
    isFeatured: { type: Boolean, default: false },

    // Soft delete — set to false instead of actually deleting from DB
    isActive: { type: Boolean, default: true },

    // When the book was originally published (not when we added it to the shop)
    publishedDate: { type: Date, default: null },

    // How many pages a non-buyer can preview — null means no preview
    previewPages: { type: Number, default: null },

    // YouTube embed URL for the book trailer — e.g. https://www.youtube.com/embed/xxxxx
    // Optional — not every book will have a trailer
    videoUrl: { type: String, default: null },

    // Cloudinary public ID for the book file — needed to delete the old file when updated
    // Stored separately from fileUrl so we can call cloudinary.uploader.destroy()
    filePublicId: { type: String, default: null },

    // Local extracted EPUB preview directory identifier
    epubPreviewDir: { type: String, default: null },

    // Relative path to the package.opf inside the extracted EPUB preview
    epubPackagePath: { type: String, default: null },

    // Cloudinary public ID for the cover image — same reason as above
    coverPublicId: { type: String, default: null },
  },
  {
    // Automatically adds createdAt and updatedAt fields
    timestamps: true,
  },
);

// INDEXES
// Text index on title and author so MongoDB can do full-text search
BookSchema.index({ title: "text", author: "text" });

// Index on category for fast filtering by category
BookSchema.index({ category: 1 });

// Index on rating for fast "top rated" sorting
BookSchema.index({ rating: -1 });

// Index on purchaseCount for fast "bestseller" sorting
BookSchema.index({ purchaseCount: -1 });

// Index on isFeatured so the homepage featured query is instant
BookSchema.index({ isFeatured: 1 });

// Index on isActive so soft-delete filtering doesn't slow things down
BookSchema.index({ isActive: 1 });

export const Book = mongoose.model<IBookDocument>("Book", BookSchema);

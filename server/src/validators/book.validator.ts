import { z } from "zod";

// Reuse the same requiredString helper — Zod v4 compatible
const requiredString = (field: string) =>
  z.string().min(1, `${field} is required`);

// CREATE BOOK SCHEMA
export const createBookSchema = z.object({
  // Title must exist and not be blank
  title: requiredString("Title"),

  // author is now a MongoDB ObjectId string referencing the Author collection
  author: requiredString("Author"),

  // Description must be at least 20 characters
  description: z.string().min(20, "Description must be at least 20 characters"),

  // Price comes in as a string from FormData — coerce to number
  price: z.coerce.number().positive("Price must be a positive number"),

  // Optional sale price
  discountPrice: z.coerce.number().positive().optional(),

  // Only pdf or epub allowed
  fileType: z.enum(["pdf", "epub"], {
    error: "File type must be pdf or epub",
  }),

  // Optional ISBN
  isbn: z.string().optional(),

  // Optional publisher name
  publisher: z.string().optional(),

  // Category comes in as a JSON string from FormData
  category: z.string().min(1, "At least one category is required"),

  // Tags are optional — also JSON string from FormData
  tags: z.string().optional(),

  // Whether this book appears on the homepage carousel
  isFeatured: z.coerce.boolean().optional().default(false),

  // How many pages non-buyers can preview
  previewPages: z.coerce.number().int().positive().optional(),

  // When the book was originally published
  publishedDate: z.string().optional(),

  // YouTube embed URL for the book trailer
  // Must be a valid URL if provided — admin pastes this from YouTube
  videoUrl: z.string().url("Must be a valid URL").optional(),
});

// UPDATE BOOK SCHEMA
// All fields optional — only send what changed
export const updateBookSchema = createBookSchema.partial();

// BOOK QUERY SCHEMA
// Validates query string params when browsing/filtering the catalog
export const bookQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  fileType: z.enum(["pdf", "epub"]).optional(),

  // Author ID filter — lets us show all books by one author
  author: z.string().optional(),

  sortBy: z
    .enum(["createdAt", "price", "rating", "purchaseCount"])
    .optional()
    .default("createdAt"),

  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),

  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(50).optional().default(12),
});

// REVIEW SCHEMAS
// Used in Phase 5 — defined here so validators are centralized

export const createReviewSchema = z.object({
  // Rating must be a whole number 1–5
  rating: z.coerce.number().int().min(1).max(5),

  // Comment must be meaningful — not just "good"
  comment: z
    .string()
    .min(10, "Review must be at least 10 characters")
    .max(2000, "Review cannot exceed 2000 characters"),
});

export const updateReviewSchema = createReviewSchema.partial();

// AUTHOR SCHEMAS
// Used in Phase 7 admin dashboard — defined here so validators are centralized

export const createAuthorSchema = z.object({
  name: requiredString("Name"),

  bio: z.string().min(20, "Bio must be at least 20 characters"),

  // specialty comes in as JSON string from FormData
  specialty: z.string().min(1, "At least one specialty is required"),

  nationality: z.string().optional(),

  website: z.string().url("Website must be a valid URL").optional(),

  // Social links — all optional URLs
  twitter: z.string().url("Twitter link must be a valid URL").optional(),
  linkedin: z.string().url("LinkedIn link must be a valid URL").optional(),
  facebook: z.string().url("Facebook link must be a valid URL").optional(),
  instagram: z.string().url("Instagram link must be a valid URL").optional(),
});

export const updateAuthorSchema = createAuthorSchema.partial();

// EXPORTED TYPES
export type CreateBookInput = z.infer<typeof createBookSchema>;
export type UpdateBookInput = z.infer<typeof updateBookSchema>;
export type BookQueryInput = z.infer<typeof bookQuerySchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type CreateAuthorInput = z.infer<typeof createAuthorSchema>;
export type UpdateAuthorInput = z.infer<typeof updateAuthorSchema>;

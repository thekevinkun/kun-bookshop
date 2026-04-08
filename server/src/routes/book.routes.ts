import { Router } from "express";
import {
  getBooks,
  getFeatured,
  getBookById,
  getBooksByCategory,
  getSimilarBooks,
  getCategories,
  searchAutocomplete,
  getBookPreview,
  createBook,
  updateBook,
  deleteBook,
} from "../controllers/book.controller";
import { authenticate } from "../middleware/auth.middleware";
import { isAdmin } from "../middleware/admin.middleware";
import {
  uploadBookFiles,
  verifyFileTypes,
} from "../middleware/upload.middleware";

const router = Router();

// --- PUBLIC ROUTES ---
// Anyone can browse the catalog — no login required

// GET /api/books — paginated catalog with filters
router.get("/", getBooks);

// GET /api/books/featured — homepage carousel
// NOTE: this must be defined BEFORE /:id so Express doesn't treat "featured" as an id
router.get("/featured", getFeatured);

// GET /api/books/search/autocomplete — search suggestions as user types
router.get("/search/autocomplete", searchAutocomplete);

// GET /api/books/categories — public, no auth needed
router.get("/categories", getCategories);

// GET /api/books/category/:category — books by category
router.get("/category/:category", getBooksByCategory);

// GET /api/books/:id/preview — free preview for non-buyers
router.get("/:id/preview", getBookPreview);

// GET /api/books/:id/similar — related books based on shared categories
router.get("/:id/similar", getSimilarBooks);

// GET /api/books/:id — single book detail
router.get("/:id", getBookById);

// --- ADMIN ONLY ROUTES ---
// authenticate verifies the JWT, isAdmin checks the role
// uploadBookFiles handles multer, verifyFileTypes checks magic bytes

// POST /api/books — create a new book with file uploads
router.post(
  "/",
  authenticate,
  isAdmin,
  uploadBookFiles,
  verifyFileTypes,
  createBook,
);

// PUT /api/books/:id — update an existing book
router.put(
  "/:id",
  authenticate,
  isAdmin,
  uploadBookFiles,
  verifyFileTypes,
  updateBook,
);

// DELETE /api/books/:id — soft delete a book
router.delete("/:id", authenticate, isAdmin, deleteBook);

export default router;

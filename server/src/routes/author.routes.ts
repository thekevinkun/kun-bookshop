// Import Express Router to define route handlers
import { Router } from "express";

// Import authenticate — required for all write operations
import { authenticate } from "../middleware/auth.middleware";

// Import isAdmin — all write operations are admin only
import { isAdmin } from "../middleware/admin.middleware";

// Import the upload middleware — same one used for books, handles avatar field
import {
  uploadAuthorFiles,
  verifyFileTypes,
} from "../middleware/upload.middleware";

// Import all controller functions
import {
  getAuthors,
  getAuthorById,
  createAuthor,
  updateAuthor,
  deleteAuthor,
} from "../controllers/author.controller";

const router = Router();

// Public routes — no auth needed

// GET /api/authors — returns all active authors (used by book form dropdown)
router.get("/", getAuthors);

// GET /api/authors/:id — single author with their books (used by author profile)
router.get("/:id", getAuthorById);

// Admin-only routes — authenticate + isAdmin required

// POST /api/authors — create a new author with avatar upload
router.post(
  "/",
  authenticate,
  isAdmin,
  uploadAuthorFiles, // Handles the 'avatar' file field in FormData
  verifyFileTypes, // Magic byte check on the uploaded image
  createAuthor,
);

// PUT /api/authors/:id — update an author (avatar optional)
router.put(
  "/:id",
  authenticate,
  isAdmin,
  uploadAuthorFiles,
  verifyFileTypes,
  updateAuthor,
);

// DELETE /api/authors/:id — soft delete
router.delete("/:id", authenticate, isAdmin, deleteAuthor);

export default router;

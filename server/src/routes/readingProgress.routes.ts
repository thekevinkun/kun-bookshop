import { Router } from "express";
import {
  getReadingProgress,
  saveReadingProgress,
} from "../controllers/readingProgress.controller";
import { authenticate } from "../middleware/auth.middleware";

// All reading progress routes require authentication —
// only logged-in users can save or retrieve their position
const router = Router();

// GET /api/reading-progress/:bookId — fetch saved position for a book
router.get("/:bookId", authenticate, getReadingProgress);

// PUT /api/reading-progress/:bookId — upsert position (called on every page change)
router.put("/:bookId", authenticate, saveReadingProgress);

export default router;

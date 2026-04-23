import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  getRecentlyViewed,
  addRecentlyViewed,
} from "../controllers/recentlyViewed.controller";

// Create a new router instance
const router = Router();

// All recently-viewed routes require authentication — guests use localStorage instead
// Apply authenticate to every route in this router
router.use(authenticate);

// GET /api/recently-viewed — fetch user's recently viewed books
router.get("/", getRecentlyViewed);

// POST /api/recently-viewed/:bookId — add a book to history
router.post("/:bookId", addRecentlyViewed);

// Export for registration in server.ts
export default router;

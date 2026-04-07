// Import Express Router to define route handlers
import { Router } from "express";

// Import the authenticate middleware — required for write operations
import { authenticate } from "../middleware/auth.middleware";

// Import all the controller functions
import {
  getBookReviews,
  createReview,
  updateReview,
  deleteReview,
  markHelpful,
} from "../controllers/review.controller";

// Create a new Express router for all review routes
const router = Router();

// GET /api/reviews/:bookId — public, no auth needed to read reviews
router.get("/:bookId", getBookReviews);

// POST /api/reviews/:bookId — auth required, must be logged in to write a review
router.post("/:bookId", authenticate, createReview);

// PUT /api/reviews/:reviewId — auth required, only the review author can edit
router.put("/:reviewId", authenticate, updateReview);

// DELETE /api/reviews/:reviewId — auth required, owner or admin can delete
router.delete("/:reviewId", authenticate, deleteReview);

// POST /api/reviews/:reviewId/helpful — auth required, toggle helpful vote
router.post("/:reviewId/helpful", authenticate, markHelpful);

export default router;

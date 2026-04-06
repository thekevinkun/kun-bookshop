// Import the Express router so we can define our download routes
import { Router } from "express";

// Import the authenticate middleware — ensures the user is logged in before anything else
import { authenticate } from "../middleware/auth.middleware";

// Import the ownership middleware — verifies the user actually purchased the book
import { verifyBookOwnership } from "../middleware/ownership.middleware";

// Import the download rate limiter — max 10 downloads per hour per IP
// This is already defined in our rateLimiter.middleware.ts from Phase 2
import { downloadLimiter } from "../middleware/rateLimiter.middleware";

// Import our two controller functions
import {
  generateDownloadUrl,
  getDownloadHistory,
} from "../controllers/downloads.controller";

// Create a new Express router instance for download routes
const router = Router();

// POST /api/downloads/book/:bookId
// Route order matters — three middlewares run in sequence before the controller:
// 1. authenticate    → are you logged in?
// 2. verifyBookOwnership → did you BUY this book? (checks user.library)
// 3. downloadLimiter → haven't hit the 10/hour limit?
// Only if all three pass does generateDownloadUrl run
router.post(
  "/book/:bookId",
  authenticate, // Step 1: valid JWT required
  verifyBookOwnership, // Step 2: must own the book
  downloadLimiter, // Step 3: rate limit check
  generateDownloadUrl, // Step 4: generate and return the signed URL
);

// GET /api/downloads/history
// Returns the logged-in user's full download history
// Only authenticate is needed here — no ownership check because
// we're fetching THEIR OWN history, filtered by userId in the controller
router.get(
  "/history",
  authenticate, // Must be logged in to see your own history
  getDownloadHistory, // Fetch and return the download records
);

// Export the router so server.ts can register it
export default router;

// Import the Express router to define our user-related routes
import { Router } from "express";

// Import the authenticate middleware — all user routes require a logged-in user
import { authenticate } from "../middleware/auth.middleware";

// Import all four controller functions for library and wishlist
import {
  getLibrary,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from "../controllers/users.controller";

// Create a new Express router instance
const router = Router();

// GET /api/users/library
// Returns the logged-in user's purchased books
// authenticate ensures only the owner can see their own library
router.get("/library", authenticate, getLibrary);

// GET /api/users/wishlist
// Returns the logged-in user's wishlisted books
router.get("/wishlist", authenticate, getWishlist);

// POST /api/users/wishlist/:bookId
// Adds a specific book to the wishlist
router.post("/wishlist/:bookId", authenticate, addToWishlist);

// DELETE /api/users/wishlist/:bookId
// Removes a specific book from the wishlist
router.delete("/wishlist/:bookId", authenticate, removeFromWishlist);

// Export the router so server.ts can register it
export default router;

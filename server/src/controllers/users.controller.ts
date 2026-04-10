// Import Request and Response types from Express for type safety
import { Request, Response } from "express";

// Import the User model so we can query and update the user's library and wishlist
import { User } from "../models/User";

// Import the Book model so we can populate full book details for library and wishlist
import { Book } from "../models/Book";

// Import our Winston logger for error logging
import { logger } from "../utils/logger";

// getLibrary
// GET /api/users/library
// Returns the full list of books the logged-in user has purchased
export const getLibrary = async (
  req: Request,
  res: Response,
): Promise<void> => {
  // Get the logged-in user's ID from the JWT payload
  const userId = req.user!.userId;

  try {
    // Find the user and populate their library array with full book details
    // We only select the fields the library page needs — keeps the response lean
    const user = await User.findById(userId)
      .select("library")
      .populate({
        path: "library", // The field to populate
        model: "Book", // Which collection to pull from
        select: "title authorName coverImage price fileType", // Only these fields — authorName is denormalized
        match: { isActive: true }, // Only return books that are still active (not soft-deleted)
      })
      .lean(); // Plain JS object — faster than full Mongoose documents

    // If the user doesn't exist somehow, return an empty library
    if (!user) {
      res.json({ library: [] });
      return;
    }

    // Send the populated library array back to the frontend
    res.json({ library: user.library });
  } catch (error) {
    // Log the full error internally for debugging
    logger.error("Failed to fetch library", { error, userId });

    // Return a clean error to the client — no stack traces
    res
      .status(500)
      .json({ error: "Failed to fetch your library. Please try again." });
  }
};

// getWishlist
// GET /api/users/wishlist
// Returns the full list of books the logged-in user has wishlisted
export const getWishlist = async (
  req: Request,
  res: Response,
): Promise<void> => {
  // Get the logged-in user's ID from the JWT payload
  const userId = req.user!.userId;

  try {
    // Find the user and populate their wishlist array with book details
    const user = await User.findById(userId)
      .select("wishlist")
      .populate({
        path: "wishlist", // The wishlist field
        model: "Book", // Pull from Book collection
        select:
          "title authorName coverImage price discountPrice rating isActive", // Fields needed for book cards
        match: { isActive: true }, // Skip soft-deleted books
      })
      .lean();

    // If user not found, return empty wishlist
    if (!user) {
      res.json({ wishlist: [] });
      return;
    }

    // Send the populated wishlist back to the frontend
    res.json({ wishlist: user.wishlist });
  } catch (error) {
    logger.error("Failed to fetch wishlist", { error, userId });
    res
      .status(500)
      .json({ error: "Failed to fetch your wishlist. Please try again." });
  }
};

// addToWishlist
// POST /api/users/wishlist/:bookId
// Adds a book to the logged-in user's wishlist
export const addToWishlist = async (
  req: Request,
  res: Response,
): Promise<void> => {
  // Get the logged-in user's ID from the JWT payload
  const userId = req.user!.userId;

  // Get the book ID from the URL parameter
  const bookId = req.params.bookId as string;

  try {
    // Verify the book actually exists and is active before adding it
    // No point wishlisting a book that doesn't exist
    const book = await Book.findOne({ _id: bookId, isActive: true }).select(
      "_id",
    );

    if (!book) {
      res.status(404).json({ error: "Book not found" });
      return;
    }

    // Add the book to the wishlist using $addToSet
    // $addToSet is like $push but ignores duplicates — safe to call multiple times
    await User.findByIdAndUpdate(userId, {
      $addToSet: { wishlist: bookId }, // Only adds if not already in the array
    });

    // Confirm success to the frontend
    res.json({ message: "Book added to wishlist" });
  } catch (error) {
    logger.error("Failed to add to wishlist", { error, userId, bookId });
    res
      .status(500)
      .json({ error: "Failed to add book to wishlist. Please try again." });
  }
};

// removeFromWishlist
// DELETE /api/users/wishlist/:bookId
// Removes a book from the logged-in user's wishlist
export const removeFromWishlist = async (
  req: Request,
  res: Response,
): Promise<void> => {
  // Get the logged-in user's ID from the JWT payload
  const userId = req.user!.userId;

  // Get the book ID from the URL parameter
  const bookId = req.params.bookId as string;

  try {
    // Remove the book ID from the wishlist array using $pull
    // $pull removes all matching values from the array
    await User.findByIdAndUpdate(userId, {
      $pull: { wishlist: bookId }, // Remove this specific book ID from the array
    });

    // Confirm success — we return 200 even if the book wasn't in the wishlist
    // (removing something that isn't there is still a successful "it's gone" state)
    res.json({ message: "Book removed from wishlist" });
  } catch (error) {
    logger.error("Failed to remove from wishlist", { error, userId, bookId });
    res.status(500).json({
      error: "Failed to remove book from wishlist. Please try again.",
    });
  }
};

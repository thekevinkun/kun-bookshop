// Import the Request, Response, NextFunction types from Express for type safety
import { Request, Response, NextFunction } from "express";

// Import the User model so we can check the user's library array
import { User } from "../models/User";

// --- verifyBookOwnership ---
// This middleware sits between 'authenticate' and the download handler
// It checks that the logged-in user actually OWNS (purchased) the book they're trying to download
// This is our BOLA (Broken Object Level Authorization) guard for downloads
export const verifyBookOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  // Get the book ID from the URL parameter — e.g. /api/downloads/book/abc123 → 'abc123'
  const bookId = req.params.bookId as string;

  // Get the logged-in user's ID from the JWT payload (set by authenticate middleware)
  const userId = req.user!.userId;

  // Fetch the user from the database, but only select the 'library' field
  // We don't need the whole user document — just their list of purchased book IDs
  const user = await User.findById(userId).select("library");

  // If the user doesn't exist (rare but possible), deny access
  if (!user) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  // Check if the book ID appears in the user's library array
  // We call .toString() on each ObjectId so we can compare it to the string bookId from the URL
  const ownsBook = user.library.map((id) => id.toString()).includes(bookId);

  // If the book is NOT in their library, they haven't purchased it — block the request
  if (!ownsBook) {
    // 403 = Forbidden (they're logged in, but not allowed to access this resource)
    res.status(403).json({ error: "You do not own this book" });
    return;
  }

  // Ownership confirmed — pass control to the next middleware or controller
  next();
};

import { Request, Response } from "express";
import { logger } from "../utils/logger";
import { User } from "../models/User";
import { ReadingProgress } from "../models/ReadingProgress";

// PUT /api/reading-progress/:bookId
// Upserts the user's reading position for a specific book.
// Called automatically by the frontend every time the user changes page/location.
export const saveReadingProgress = async (req: Request, res: Response) => {
  try {
    // The authenticated user's ID — injected by the authenticate middleware
    const userId = req.user!.userId;

    // The book whose progress we're saving
    const { bookId } = req.params;

    // Destructure the payload — only accept the fields we expect
    const { currentPage, totalPages } = req.body as {
      currentPage?: number; // PDF: current page (1-indexed)
      totalPages?: number; // PDF: total pages in document
    };

    // Verify the user actually owns this book before saving progress.
    // This is a server-side ownership check — never trust the client.
    const user = await User.findById(userId).select("library").lean();
    const ownsBook = user?.library?.some((id) => id.toString() === bookId);

    if (!ownsBook) {
      // Non-owners shouldn't be calling this endpoint at all
      res.status(403).json({ error: "You do not own this book" });
      return;
    }

    // findOneAndUpdate with upsert:true — creates a new record if none exists,
    // updates the existing one if it does. The compound index on userId+bookId
    // guarantees there is never more than one record per user+book pair.
    const progress = await ReadingProgress.findOneAndUpdate(
      { userId, bookId }, // Filter — match this user+book pair
      {
        $set: {
          // Only update fields that were actually sent in the request
          ...(currentPage !== undefined && { currentPage }),
          ...(totalPages !== undefined && { totalPages }),
          lastReadAt: new Date(), // Always update the timestamp on every save
        },
      },
      {
        upsert: true, // Create a new document if no match found
        new: true, // Return the updated document, not the original
        setDefaultsOnInsert: true, // Apply schema defaults when inserting
      },
    );

    res.json({ progress });
  } catch (error) {
    logger.error("saveReadingProgress error", { error });
    res.status(500).json({ error: "Failed to save reading progress" });
  }
};

// GET /api/reading-progress/:bookId
// Returns the user's saved position for a specific book.
// Called when the reader opens — used to restore the user's last position.
export const getReadingProgress = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { bookId } = req.params;

    // Look up the single progress record for this user+book pair
    const progress = await ReadingProgress.findOne({ userId, bookId }).lean();

    // Return null progress if none found — frontend treats this as "start from beginning"
    res.json({ progress: progress ?? null });
  } catch (error) {
    logger.error("getReadingProgress error", { error });
    res.status(500).json({ error: "Failed to fetch reading progress" });
  }
};

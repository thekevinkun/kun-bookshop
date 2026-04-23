import { Request, Response } from "express";
import mongoose from "mongoose";
import { Book } from "../models/Book";
import { RecentlyViewed } from "../models/RecentlyViewed";

// getRecentlyViewed — GET /api/recently-viewed
// Returns the user's recently viewed books, fully populated, newest first.
export const getRecentlyViewed = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.userId; // Authenticated user from JWT

    // Find this user's recently viewed document
    const record = await RecentlyViewed.findOne({ userId });

    if (!record || record.bookIds.length === 0) {
      res.json({ books: [] }); // No history yet — return empty array
      return;
    }

    // Fetch full book data for all bookIds in the list
    // We fetch them all at once (no N+1 problem) then re-sort to match original order
    const books = await Book.find({
      _id: { $in: record.bookIds }, // Only fetch books in this user's list
      isActive: true, // Skip any books that have been deactivated
    })
      .populate("author", "name avatar specialty") // Populate author for BookCard rendering
      .lean(); // Return plain objects — faster, no Mongoose overhead

    // Re-sort books to match the order in bookIds (newest first)
    // Book.find doesn't guarantee order, so we sort manually
    const bookMap = new Map(books.map((b) => [b._id.toString(), b])); // Build a fast lookup map
    const orderedBooks = record.bookIds
      .map((id) => bookMap.get(id.toString())) // Map each id to its book object
      .filter(Boolean); // Remove any undefined (deactivated books not in results)

    res.json({ books: orderedBooks }); // Return ordered populated books
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch recently viewed books" });
  }
};

// addRecentlyViewed — POST /api/recently-viewed/:bookId
// Adds a book to the front of the user's recently viewed list.
// Deduplicates and caps at 10 items automatically.
export const addRecentlyViewed = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const bookId = req.params.bookId as string;

    const bookObjectId = new mongoose.Types.ObjectId(bookId);

    await RecentlyViewed.updateOne(
      { userId },
      { $setOnInsert: { userId, bookIds: [] } },
      { upsert: true },
    );

    await RecentlyViewed.updateOne(
      { userId },
      [
        {
          $set: {
            bookIds: {
              $slice: [
                {
                  $concatArrays: [
                    [bookObjectId],
                    {
                      $filter: {
                        input: "$bookIds",
                        as: "id",
                        cond: { $ne: ["$$id", bookObjectId] },
                      },
                    },
                  ],
                },
                10,
              ],
            },
          },
        },
      ],
      { updatePipeline: true }, // Required by Mongoose when update is an aggregation pipeline array
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("addRecentlyViewed error:", err); // Log the real error
    res.status(500).json({ error: "Failed to record recently viewed book" });
  }
};

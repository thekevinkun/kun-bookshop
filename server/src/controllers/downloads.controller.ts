// Import Request and Response types from Express for type safety on our handler functions
import { Request, Response } from "express";

// Import the Download model so we can create and query download records
import { Download } from "../models/Download";

// Import our download service that handles the Cloudinary signed URL generation
import { generateSignedUrl } from "../services/download.service";

// Import the audit logger so we can record every download as a business event
import { logAuditEvent } from "../services/audit.service";

// Import our Winston logger for error logging
import { logger } from "../utils/logger";

// --- generateDownloadUrl ---
// POST /api/downloads/book/:bookId
// Called when the user clicks "Download" on their library page
// Verifyownership is already confirmed by verifyBookOwnership middleware before this runs
export const generateDownloadUrl = async (
  req: Request,
  res: Response,
): Promise<void> => {
  // Get the book ID from the URL — e.g. /api/downloads/book/abc123
  const bookId = req.params.bookId as string;

  // Get the logged-in user's ID from the JWT payload (attached by authenticate middleware)
  const userId = req.user!.userId;

  try {
    // Generate a signed Cloudinary URL that expires in 1 hour
    // This is the secure, time-limited link the user will actually download from
    const signedUrl = await generateSignedUrl(bookId);

    // Record this download in the Download collection for analytics and abuse tracking
    // We do this AFTER generating the URL so a DB failure doesn't block the download
    await Download.create({
      userId, // Who downloaded
      bookId, // What they downloaded
      ipAddress: req.ip ?? "unknown", // Their IP address — fallback if req.ip is undefined
      downloadedAt: new Date(), // Exact time of download
    });

    // Write an audit log entry — downloads are business events we want to track
    await logAuditEvent({
      userId,
      action: "BOOK_DOWNLOADED", // SCREAMING_SNAKE_CASE as per our audit convention
      resourceType: "Book",
      resourceId: bookId,
      ipAddress: req.ip ?? "unknown",
    });

    // Send the signed URL back to the frontend
    // The frontend will use this URL to trigger the actual file download
    res.json({ url: signedUrl });
  } catch (error) {
    // Log the full error internally so we can debug it
    logger.error("Failed to generate download URL", { error, bookId, userId });

    // Send a clean error message to the client — no stack traces in production
    res
      .status(500)
      .json({ error: "Failed to generate download link. Please try again." });
  }
};

// --- getDownloadHistory ---
// GET /api/downloads/history
// Returns a list of all books this user has ever downloaded, with timestamps
// Used on the library/profile page to show download activity
export const getDownloadHistory = async (
  req: Request,
  res: Response,
): Promise<void> => {
  // Get the logged-in user's ID from the JWT payload
  const userId = req.user!.userId;

  try {
    // Find all download records belonging to this user
    // Sort by most recent first so the latest downloads appear at the top
    // Populate bookId with selected book fields so the frontend has what it needs to display
    const history = await Download.find({ userId })
      .sort({ downloadedAt: -1 }) // Newest downloads first
      .populate("bookId", "title authorName coverImage") // Pull in book details (authorName is denormalized)
      .lean(); // .lean() returns plain JS objects — faster than full Mongoose docs

    // Send the download history array back to the frontend
    res.json({ downloads: history });
  } catch (error) {
    // Log the error for debugging
    logger.error("Failed to fetch download history", { error, userId });

    // Return a clean error to the client
    res
      .status(500)
      .json({ error: "Failed to fetch download history. Please try again." });
  }
};

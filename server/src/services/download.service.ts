// Import the Cloudinary v2 SDK so we can generate signed URLs for secure file access
import { v2 as cloudinary } from "cloudinary";

// Import the Book model so we can look up the book's file details from the database
import { Book } from "../models/Book";

// Import our Winston logger so we can log errors without crashing the app
import { logger } from "../utils/logger";

// generateSignedUrl — the core of our download security
// Instead of giving users a permanent public URL to the book file,
// we generate a temporary URL that expires in 1 hour
// After expiry, the link is dead — even if someone shares it
export const generateSignedUrl = async (bookId: string): Promise<string> => {
  // Find the book in the database by its ID
  // We need the filePublicId — the Cloudinary identifier for the actual book file
  const book = await Book.findById(bookId).select("filePublicId title");

  // If the book doesn't exist in the DB, we can't generate a URL — throw a clean error
  if (!book) {
    throw new Error("Book not found");
  }

  // filePublicId must exist — without it we have no file to point to
  if (!book.filePublicId) {
    throw new Error("Book file is not available for download");
  }

  // Generate a signed Cloudinary URL that expires in 1 hour (3600 seconds)
  // 'sign_url: true' means Cloudinary will cryptographically sign the URL
  // Anyone who tries to tamper with the URL (e.g. change the expiry) will get rejected by Cloudinary
  const signedUrl = cloudinary.url(book.filePublicId, {
    sign_url: true, // Cryptographically sign the URL — tamper-proof
    expires_at: Math.floor(Date.now() / 1000) + 3600, // Unix timestamp 1 hour from now
    resource_type: "raw", // 'raw' = non-image files like PDFs and ePubs
    type: "upload", // The file was uploaded (not fetched from a remote URL)
  });

  // Log that a signed URL was generated — useful for audit trail without logging the URL itself
  logger.info("Signed download URL generated", { bookId, title: book.title });

  // Return the signed URL — the controller will send this back to the frontend
  return signedUrl;
};

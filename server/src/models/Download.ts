// Import mongoose and the tools we need to define a schema and TypeScript interface
import mongoose, { Schema } from "mongoose";

// Import the TypeScript interface for a Download document
import type { IDownload } from "../types/order";

// Define the Mongoose schema — this is the actual DB structure
const DownloadSchema = new Schema<IDownload>({
  // Reference to the User who downloaded — lets us look up their history
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User", // Tells Mongoose this links to the User collection
    required: true, // Every download must belong to a user
    index: true, // Index this so we can quickly find all downloads by a user
  },

  // Reference to the Book that was downloaded
  bookId: {
    type: Schema.Types.ObjectId,
    ref: "Book", // Links to the Book collection
    required: true, // Every download must be for a specific book
    index: true, // Index so we can quickly count downloads per book
  },

  // The user's IP address at the time of download
  // Useful for detecting abuse (e.g., same book downloaded 10x from one IP)
  ipAddress: {
    type: String,
    required: true,
  },

  // Exact timestamp of when this download record was created
  downloadedAt: {
    type: Date,
    default: Date.now, // Auto-set to current time if not provided
  },
});

// Compound index: lets us quickly query "all downloads by user X for book Y"
// Useful for download history and abuse checking
DownloadSchema.index({ userId: 1, bookId: 1 });

// Export the model so controllers and services can use it
export const Download = mongoose.model<IDownload>("Download", DownloadSchema);

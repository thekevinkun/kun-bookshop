import mongoose, { Schema } from "mongoose";
import type { IReadingProgress } from "../types/book";

const ReadingProgressSchema = new Schema<IReadingProgress>(
  {
    // Reference to the user — used to scope progress to the right person
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Reference to the book — used to look up progress when opening the reader
    bookId: {
      type: Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },

    // For PDF files: the page number the user was on (1-indexed)
    // Defaults to 1 so a fresh record always starts at the beginning
    currentPage: {
      type: Number,
      default: 1,
    },

    // For PDF files: total page count — stored so frontend can show "Page X of Y"
    totalPages: {
      type: Number,
      default: 0,
    },

    // Timestamp of the last save — lets us show "last read X days ago" in future
    lastReadAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  },
);

// Compound unique index — one progress record per user per book
// This is what makes upsert work correctly without creating duplicates
ReadingProgressSchema.index({ userId: 1, bookId: 1 }, { unique: true });

export const ReadingProgress = mongoose.model<IReadingProgress>(
  "ReadingProgress",
  ReadingProgressSchema,
);

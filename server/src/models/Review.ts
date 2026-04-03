import mongoose, { Schema, Document } from "mongoose";
import type { IReview } from "../types/book";

const ReviewSchema = new Schema<IReview>(
  {
    // Reference to the Book being reviewed
    bookId: {
      type: Schema.Types.ObjectId,
      ref: "Book", // Allows .populate('bookId') in queries
      required: true,
    },

    // Reference to the User who wrote the review
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User", // Allows .populate('userId') in queries
      required: true,
    },

    // Star rating — must be a whole number between 1 and 5
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    // The actual review text — will be sanitized with DOMPurify before saving
    comment: {
      type: String,
      required: true,
      trim: true,
      minlength: 10, // Forces real content, not just "good"
      maxlength: 2000, // Prevents essays
    },

    // True only if the reviewer actually purchased this book
    // Set automatically by the controller — never trusted from the client
    isPurchaseVerified: {
      type: Boolean,
      default: false,
    },

    // How many people found this review helpful — incremented via a separate endpoint
    helpfulCount: {
      type: Number,
      default: 0,
    },

    // Tracks which users have already voted helpful — prevents double voting
    helpfulVoters: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Soft delete — admin can hide reviews without losing the data
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    // Automatically adds createdAt and updatedAt
    timestamps: true,
  },
);

// --- INDEXES ---

// Compound index: one user can only review each book once
// The unique constraint is enforced at the DB level, not just app level
ReviewSchema.index({ bookId: 1, userId: 1 }, { unique: true });

// Index on bookId for fast "get all reviews for this book" queries
ReviewSchema.index({ bookId: 1, createdAt: -1 });

// Index on userId for fast "get all reviews by this user" queries
ReviewSchema.index({ userId: 1 });

// Index on rating for sorting reviews by star rating
ReviewSchema.index({ rating: -1 });

// Index on helpfulCount for sorting by most helpful
ReviewSchema.index({ helpfulCount: -1 });

export const Review = mongoose.model<IReview>("Review", ReviewSchema);

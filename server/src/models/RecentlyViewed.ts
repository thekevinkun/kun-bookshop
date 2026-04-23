import mongoose, { Schema } from "mongoose";

import type { IRecentlyViewed } from "../types/book";

// RecentlyViewedSchema defines the structure
const RecentlyViewedSchema = new Schema<IRecentlyViewed>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    }, // One record per user
    bookIds: [{ type: Schema.Types.ObjectId, ref: "Book" }], // Array of book refs, max 10 enforced in controller
  },
  { timestamps: true }, // Adds createdAt and updatedAt automatically
);

// Export the model
export const RecentlyViewed = mongoose.model<IRecentlyViewed>(
  "RecentlyViewed",
  RecentlyViewedSchema,
);

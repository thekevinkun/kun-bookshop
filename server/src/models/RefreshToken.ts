// Import mongoose tools for schema definition
import mongoose, { Schema, Document } from "mongoose";

// Import the IRefreshToken interface we defined in our types — this ensures our schema matches our TypeScript definitions
import type { IRefreshToken } from "../types/auth";

const RefreshTokenSchema = new Schema<IRefreshToken>(
  {
    // We store the HASH of the token, not the token itself
    // If the database is ever compromised, attackers can't use hashed tokens
    token: {
      type: String,
      required: true,
      unique: true, // Each token hash must be unique in the collection
    },

    // The MongoDB _id of the user who owns this token
    // Indexed so we can quickly find all tokens for a given user (e.g. on logout)
    userId: {
      type: String,
      required: true,
      index: true,
    },

    // The exact date and time this token stops being valid
    expiresAt: {
      type: Date,
      required: true,
    },

    // When we rotate tokens (on refresh), we mark the old one as revoked
    // This prevents replay attacks if someone intercepts an old token
    isRevoked: {
      type: Boolean,
      default: false,
    },
  },
  {
    // Automatically adds createdAt and updatedAt
    timestamps: true,
  },
);

// --- TTL INDEX ---
// MongoDB will automatically DELETE documents where expiresAt is in the past
// This keeps the collection clean without us having to manually purge expired tokens
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken = mongoose.model<IRefreshToken>(
  "RefreshToken",
  RefreshTokenSchema,
);

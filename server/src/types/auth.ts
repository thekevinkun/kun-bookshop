// Import mongoose tools for schema definition
import mongoose, { Document } from "mongoose";

// Define the shape of a User document in TypeScript
// This tells TypeScript exactly what fields every user object will have
export interface IUser extends Document {
  email: string;
  password: string; // This will always be the bcrypt hash — never plain text
  firstName: string;
  lastName: string;
  role: "user" | "admin"; // Only two possible roles in our system
  avatar?: string; // Optional Cloudinary URL for profile picture
  library: mongoose.Types.ObjectId[]; // Books the user has purchased
  wishlist: mongoose.Types.ObjectId[]; // Books the user has wishlisted
  isVerified: boolean; // True after the user clicks the email verification link
  verificationToken?: string; // The token we email them to verify their account
  resetPasswordToken?: string; // The token we email them for password reset
  resetPasswordExpires?: Date; // When the reset token stops being valid
  failedLoginAttempts: number; // Counts wrong password attempts — for lockout logic
  lockUntil?: Date; // If set, account is locked until this time
  emailPreferences: {
    marketing: boolean; // Promotional emails (new books, deals)
    orderUpdates: boolean; // Order confirmation, shipping updates
    newReleases: boolean; // Notifications when new books are added
    priceDrops: boolean; // Alerts when a wishlisted book drops in price
  };
  lastLogin?: Date; // When the user last successfully logged in
  createdAt: Date;
  updatedAt: Date;
}

// Define the shape of a RefreshToken document
export interface IRefreshToken extends Document {
  token: string; // SHA-256 hash of the actual token — we never store the raw token
  userId: string; // Which user this token belongs to
  expiresAt: Date; // When this token expires (30 days from creation)
  isRevoked: boolean; // If true, this token is dead even if not expired yet
  createdAt: Date;
}
// Import mongoose and the tools we need to define a schema with TypeScript support
import mongoose, { Schema } from "mongoose";

// Import the IUser interface we defined in our types — this ensures our schema matches our TypeScript definitions
import type { IUser } from "../types/auth";

// Define the Mongoose schema — this is the actual database structure
const UserSchema = new Schema<IUser>(
  {
    // Email must be unique — we use it as the login identifier
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true, // MongoDB creates a unique index automatically
      lowercase: true, // Always store emails in lowercase to avoid duplicates
      trim: true, // Remove accidental leading/trailing spaces
    },

    // Password is stored as a bcrypt hash — never the plain text
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
    },

    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },

    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },

    // Role controls what the user can access — default is 'user', not 'admin'
    role: {
      type: String,
      enum: ["user", "admin"], // Only these two values are allowed
      default: "user", // New accounts start as regular users
    },

    // Cloudinary URL for profile picture — optional, can be null
    avatar: {
      type: String,
      default: null,
    },

    // Cloudinary public ID for the avatar — stored so we can delete the old one when uploading a new avatar
    // Without this, old avatars would pile up in Cloudinary and waste storage
    avatarPublicId: {
      type: String,
      default: null,
    },

    // Array of Book ObjectIds the user has bought — populated when viewing the library
    library: [
      {
        type: Schema.Types.ObjectId,
        ref: "Book", // Tells Mongoose this references the Book collection
      },
    ],

    // Array of Book ObjectIds the user has wishlisted
    wishlist: [
      {
        type: Schema.Types.ObjectId,
        ref: "Book",
      },
    ],

    // False until the user clicks the verification link in their welcome email
    isVerified: {
      type: Boolean,
      default: false,
    },

    // Random token we generate and email the user to verify their email address
    verificationToken: {
      type: String,
      default: null,
    },

    // Random token for password reset — we email this to them
    resetPasswordToken: {
      type: String,
      default: null,
    },

    // The reset token is only valid for a limited time (e.g. 1 hour)
    resetPasswordExpires: {
      type: Date,
      default: null,
    },

    // Counts how many times the user typed the wrong password in a row
    failedLoginAttempts: {
      type: Number,
      default: 0, // Starts at 0 — increments on each wrong password
    },

    // If set, the account is locked and login is rejected until this time passes
    lockUntil: {
      type: Date,
      default: null, // Null means the account is NOT locked
    },

    // User's email notification preferences — all on by default
    emailPreferences: {
      marketing: { type: Boolean, default: true },
      orderUpdates: { type: Boolean, default: true },
      newReleases: { type: Boolean, default: true },
      priceDrops: { type: Boolean, default: true },
    },

    // Updated every time the user successfully logs in
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    // Automatically adds createdAt and updatedAt fields to every document
    timestamps: true,
  },
);

// INDEXES
// Index on role so we can quickly query all admins
UserSchema.index({ role: 1 });

// Export the model so controllers can use it
export const User = mongoose.model<IUser>("User", UserSchema);

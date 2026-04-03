import mongoose, { Schema, Document } from "mongoose";
import type { IAuthor } from "../types/book";

const AuthorSchema = new Schema<IAuthor>(
  {
    // Full display name of the author
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Long-form biography — sanitized with DOMPurify before saving
    bio: {
      type: String,
      required: true,
      minlength: 20, // Forces real content
    },

    // Cloudinary URL for the author photo
    avatar: {
      type: String,
      required: true,
    },

    // Cloudinary public ID — stored so we can delete the old photo on update
    avatarPublicId: {
      type: String,
      default: null,
    },

    // Array of specialties — e.g. ["JavaScript", "Node.js"]
    specialty: [{ type: String, trim: true }],
    
    // Optional country of origin
    nationality: {
      type: String,
      default: null,
    },

    // Author's personal or publisher website
    website: {
      type: String,
      default: null,
    },

    // Social media links — all optional
    socialLinks: {
      twitter: { type: String, default: null },
      linkedin: { type: String, default: null },
      github: { type: String, default: null },
      goodreads: { type: String, default: null },
    },

    // Soft delete — keeps author data intact even if removed from public view
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

// Text index so admins can search authors by name in the dashboard
AuthorSchema.index({ name: "text" });

// Index on isActive for fast filtering of soft-deleted authors
AuthorSchema.index({ isActive: 1 });

export const Author = mongoose.model<IAuthor>("Author", AuthorSchema);

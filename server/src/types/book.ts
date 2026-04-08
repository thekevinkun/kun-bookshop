// This file defines the TypeScript shapes we use for books throughout the app
// Keeping types in one place means we only update them here if the schema changes

import mongoose, { Document } from "mongoose";

// The full Book object as it comes out of MongoDB
export interface IBook {
  _id: string;
  title: string;
  author:
    | string
    | {
        _id: string;
        name: string;
        avatar: string;
        specialty: string[];
        bio?: string;
        website?: string;
        socialLinks?: {
          twitter?: string | null;
          linkedin?: string | null;
          facebook?: string | null;
          instagram?: string | null;
        };
      };
  authorName: string; // Always a plain string — safe to display without populate
  description: string;
  price: number;
  discountPrice?: number; // Optional sale price
  coverImage: string; // Cloudinary URL
  fileUrl: string; // Cloudinary URL for the actual book file
  fileType: "pdf" | "epub"; // Only these two formats
  fileSize: number; // In bytes
  isbn?: string; // Optional ISBN number
  category: string[]; // e.g. ['Fiction', 'Thriller']
  tags: string[]; // e.g. ['bestseller', 'new']
  rating: number; // Average rating, default 0
  reviewCount: number; // Total number of reviews
  purchaseCount: number; // How many times bought
  isFeatured: boolean; // Show on homepage carousel
  isActive: boolean; // Soft delete flag
  publishedDate?: Date;
  previewPages?: number; // How many pages non-buyers can preview
  videoUrl?: string; // YouTube embed URL for the book trailer
  filePublicId?: string; // Cloudinary public ID for the book file
  coverPublicId?: string; // Cloudinary public ID for the cover image
  createdAt: Date;
  updatedAt: Date;
}

// What we accept when filtering/searching the book catalog
export interface BookFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  fileType?: "pdf" | "epub";
  search?: string; // Full-text search term
  sortBy?: "createdAt" | "price" | "rating" | "purchaseCount";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

// What the paginated list endpoint returns
export interface PaginatedBooks {
  books: IBook[];
  total: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// The shape of a single review document in MongoDB
export interface IReview extends Document {
  bookId: mongoose.Types.ObjectId; // Which book this review is for
  userId: mongoose.Types.ObjectId; // Who wrote the review
  rating: number; // 1–5 stars
  comment: string; // The review text
  isPurchaseVerified: boolean; // True only if userId has bought the book
  helpfulCount: number; // How many users marked this as helpful
  helpfulVoters: mongoose.Types.ObjectId[]; // Tracks who voted so no double votes
  isActive: boolean; // Soft delete — admin can remove without losing data
  createdAt: Date;
  updatedAt: Date;
}

// The shape of a single author document in MongoDB
export interface IAuthor extends Document {
  name: string; // Full name — e.g. "Robert C. Martin"
  bio: string; // Long-form biography
  avatar: string; // Cloudinary URL for the author photo
  avatarPublicId?: string; // Cloudinary public ID for deletion on update
  specialty: string[]; // Areas of expertise — e.g. ["Software Engineering", "Clean Code"]
  nationality?: string; // Optional — e.g. "American"
  website?: string; // Author's personal website
  socialLinks: {
    twitter?: string;
    linkedin?: string;
    facebook?: string;
    instagram?: string;
  };
  isActive: boolean; // Soft delete
  createdAt: Date;
  updatedAt: Date;
}

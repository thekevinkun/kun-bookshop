// Import Express types for request and response objects
import { Request, Response } from "express";

// Import SortOrder type from Mongoose for sorting reviews
import { SortOrder } from "mongoose";

// Import the Review model to query the reviews collection
import { Review } from "../models/Review";

// Import the Book model so we can update rating + reviewCount after changes
import { Book } from "../models/Book";

// Import the User model so we can check if the reviewer owns the book
import { User } from "../models/User";

// Import our logger for server-side error logging
import { logger } from "../utils/logger";

// Import Zod validators for review creation and update
import {
  createReviewSchema,
  updateReviewSchema,
} from "../validators/book.validator";

// Import DOMPurify + jsdom to sanitize review comment HTML on the server
import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";

// Set up DOMPurify in Node.js — it normally runs in browsers so we simulate a DOM
const window = new JSDOM("").window;
const purify = DOMPurify(window as any);

// HELPER: recalculate and save book rating
// Called after every create/update/delete so the book's rating stays accurate
const recalculateBookRating = async (bookId: string): Promise<void> => {
  // Aggregate all active reviews for this book to get the average rating
  const result = await Review.aggregate([
    {
      $match: {
        bookId: new (require("mongoose").Types.ObjectId)(bookId),
        isActive: true,
      },
    },
    {
      $group: { _id: null, avgRating: { $avg: "$rating" }, count: { $sum: 1 } },
    },
  ]);

  // If there are reviews, use the calculated values — otherwise reset to 0
  const avgRating = result[0]?.avgRating ?? 0;
  const reviewCount = result[0]?.count ?? 0;

  // Update the book document with the fresh rating and review count
  await Book.findByIdAndUpdate(bookId, {
    rating: Math.round(avgRating * 10) / 10, // Round to 1 decimal place
    reviewCount,
  });
};

// 1. getBookReviews — GET /api/reviews/:bookId
// Returns paginated reviews for a single book.
// Public — no auth required.
export const getBookReviews = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { bookId } = req.params;

    // Read pagination and sort params from the query string
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sortBy = (req.query.sortBy as string) || "createdAt"; // createdAt | helpful
    const order: Record<string, SortOrder> =
      sortBy === "helpful" ? { helpfulCount: -1 } : { createdAt: -1 };

    // Fetch only active reviews for this book
    const reviews = await Review.find({ bookId, isActive: true })
      .sort(order)
      .skip((page - 1) * limit)
      .limit(limit)
      // Populate the user's name and avatar so we can show who wrote the review
      .populate("userId", "firstName lastName avatar")
      .lean();

    const total = await Review.countDocuments({ bookId, isActive: true });

    res.json({
      reviews,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    logger.error("getBookReviews error", { error });
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
};

// 2. createReview — POST /api/reviews/:bookId
// Creates a new review. Auth required.
// Checks ownership — only users who purchased the book can review.
export const createReview = async (
  req: Request<{ bookId: string }>,
  res: Response,
): Promise<void> => {
  try {
    const bookId = req.params.bookId;
    const userId = req.user!.userId;

    // Validate the request body against our Zod schema
    const data = createReviewSchema.parse(req.body);

    // Check if the user has already reviewed this book
    // The DB has a unique compound index on (bookId, userId) — but we check early
    // to return a clean 400 instead of a cryptic MongoDB duplicate key error
    const existing = await Review.findOne({ bookId, userId });
    if (existing) {
      res.status(400).json({ error: "You have already reviewed this book" });
      return;
    }

    // Check if this user owns (has purchased) the book
    // We fetch only the library array — no need for the full user document
    const user = await User.findById(userId).select("library");
    const isPurchaseVerified =
      user?.library.map((id) => id.toString()).includes(bookId as string) ??
      false;
    // isPurchaseVerified is set by the server — never trusted from the client

    // Sanitize the comment HTML to prevent XSS attacks
    const sanitizedComment = purify.sanitize(data.comment);

    // Create the review document
    const review = await Review.create({
      bookId,
      userId,
      rating: data.rating,
      comment: sanitizedComment,
      isPurchaseVerified, // Set by server ownership check above
    });

    // Populate user info so the frontend can display it immediately without refetching
    await review.populate("userId", "firstName lastName avatar");

    // Recalculate the book's average rating now that a new review exists
    await recalculateBookRating(bookId as string);

    res.status(201).json({ review });
  } catch (error: any) {
    // Handle Zod validation errors cleanly
    if (error.name === "ZodError") {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    logger.error("createReview error", { error });
    res.status(500).json({ error: "Failed to create review" });
  }
};

// 3. updateReview — PUT /api/reviews/:reviewId
// Updates an existing review. Auth required.
// Only the original author can edit their own review.
export const updateReview = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.userId;

    // Validate the partial update body
    const data = updateReviewSchema.parse(req.body);

    // Find the review — we need it to check ownership
    const review = await Review.findById(req.params.reviewId);

    if (!review) {
      res.status(404).json({ error: "Review not found" });
      return;
    }

    // BOLA check — only the user who wrote the review can edit it
    // Admins can delete reviews (see deleteReview) but not edit them
    if (review.userId.toString() !== userId) {
      res.status(403).json({ error: "You can only edit your own reviews" });
      return;
    }

    // Apply updates — sanitize comment if it was changed
    if (data.rating) review.rating = data.rating;
    if (data.comment) review.comment = purify.sanitize(data.comment);

    await review.save();

    // Recalculate book rating in case the star rating changed
    await recalculateBookRating(review.bookId.toString());

    await review.populate("userId", "firstName lastName avatar");

    res.json({ review });
  } catch (error: any) {
    if (error.name === "ZodError") {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    logger.error("updateReview error", { error });
    res.status(500).json({ error: "Failed to update review" });
  }
};

// 4. deleteReview — DELETE /api/reviews/:reviewId
// Soft-deletes a review. Auth required.
// The review author OR an admin can delete.
export const deleteReview = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;

    const review = await Review.findById(req.params.reviewId);

    if (!review) {
      res.status(404).json({ error: "Review not found" });
      return;
    }

    // Allow deletion if: the user wrote it OR the user is an admin
    const isOwner = review.userId.toString() === userId;
    const isAdmin = role === "admin";

    if (!isOwner && !isAdmin) {
      res.status(403).json({ error: "You can only delete your own reviews" });
      return;
    }

    // Soft delete — keeps the data for analytics, just hides it from public view
    review.isActive = false;
    await review.save();

    // Recalculate book rating now that this review is excluded
    await recalculateBookRating(review.bookId.toString());

    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    logger.error("deleteReview error", { error });
    res.status(500).json({ error: "Failed to delete review" });
  }
};

// 5. markHelpful — POST /api/reviews/:reviewId/helpful
// Toggles a "helpful" vote on a review. Auth required.
// A user can only vote once — voting again removes their vote.
export const markHelpful = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const review = await Review.findById(req.params.reviewId);

    if (!review || !review.isActive) {
      res.status(404).json({ error: "Review not found" });
      return;
    }

    // Check if this user has already voted helpful on this review
    const alreadyVoted = review.helpfulVoters
      .map((id) => id.toString())
      .includes(userId);

    if (alreadyVoted) {
      // Toggle off — remove their vote and decrement the count
      review.helpfulVoters = review.helpfulVoters.filter(
        (id) => id.toString() !== userId,
      ) as typeof review.helpfulVoters;
      review.helpfulCount = Math.max(0, review.helpfulCount - 1); // Never go below 0
    } else {
      // Toggle on — add their vote and increment the count
      review.helpfulVoters.push(userId as any);
      review.helpfulCount += 1;
    }

    await review.save();

    res.json({ helpfulCount: review.helpfulCount, voted: !alreadyVoted });
  } catch (error) {
    logger.error("markHelpful error", { error });
    res.status(500).json({ error: "Failed to update helpful vote" });
  }
};

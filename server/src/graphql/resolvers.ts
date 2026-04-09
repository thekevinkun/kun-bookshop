import { Book } from "../models/Book";
import { Review } from "../models/Review";
import { User } from "../models/User";
import { logger } from "../utils/logger";

export const resolvers = {
  Query: {
    // Resolve the paginated book list with filters
    books: async (
      _: any,
      {
        page = 1,
        limit = 12,
        category,
        search,
        sortBy = "createdAt",
        sortOrder = "desc",
      }: {
        page?: number;
        limit?: number;
        category?: string;
        search?: string;
        sortBy?: string;
        sortOrder?: string;
      },
    ) => {
      try {
        // Always filter out soft-deleted books
        const filter: any = { isActive: true };

        // Full-text search using MongoDB text index
        if (search) filter.$text = { $search: search };

        // Category filter
        if (category) filter.category = category;

        // Build sort object — same logic as the REST controller
        const sort: any = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

        // Calculate pagination offset
        const skip = (page - 1) * limit;

        // Run query and count in parallel
        const [books, total] = await Promise.all([
          Book.find(filter).sort(sort).skip(skip).limit(limit),
          Book.countDocuments(filter),
        ]);

        const totalPages = Math.ceil(total / limit);

        return {
          books,
          total,
          currentPage: page,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        };
      } catch (error) {
        logger.error("GraphQL books query error", { error });
        throw new Error("Failed to fetch books");
      }
    },

    // Resolve a single book by ID
    book: async (_: any, { id }: { id: string }) => {
      try {
        const book = await Book.findOne({ _id: id, isActive: true });
        return book;
      } catch (error) {
        logger.error("GraphQL book query error", { error });
        throw new Error("Failed to fetch book");
      }
    },

    // Resolve the homepage featured books carousel
    featuredBooks: async () => {
      try {
        return await Book.find({ isActive: true, isFeatured: true }).limit(8);
      } catch (error) {
        logger.error("GraphQL featuredBooks query error", { error });
        throw new Error("Failed to fetch featured books");
      }
    },

    // Resolve autocomplete search suggestions
    searchBooks: async (
      _: any,
      { query, limit = 6 }: { query: string; limit?: number },
    ) => {
      try {
        // Partial match regex — same as the REST autocomplete endpoint
        return await Book.find({
          isActive: true,
          $or: [
            { title: { $regex: query, $options: "i" } },
            { author: { $regex: query, $options: "i" } },
          ],
        })
          .select("title author coverImage price")
          .limit(limit);
      } catch (error) {
        logger.error("GraphQL searchBooks query error", { error });
        throw new Error("Search failed");
      }
    },

    // Resolve books filtered by category
    booksByCategory: async (
      _: any,
      { category, limit = 12 }: { category: string; limit?: number },
    ) => {
      try {
        return await Book.find({ isActive: true, category }).limit(limit);
      } catch (error) {
        logger.error("GraphQL booksByCategory query error", { error });
        throw new Error("Failed to fetch books by category");
      }
    },

    // bookReviews — GET paginated reviews for a book
    // Mirrors the REST GET /api/reviews/:bookId endpoint but served over GraphQL.
    // The client can request a specific page, limit, and sort order.
    bookReviews: async (_: any, { bookId, page, limit, sortBy }: any) => {
      // Build the sort object based on the requested sort field
      // helpfulCount sorts by most helpful votes, others sort directly by field name
      const sortMap: Record<string, any> = {
        createdAt: { createdAt: -1 }, // Newest first
        rating: { rating: -1 }, // Highest rated first
        helpful: { helpfulCount: -1 }, // Most helpful first
      };
      const sort = sortMap[sortBy] ?? { createdAt: -1 }; // Default to newest if unknown sort

      // Only show active (non-deleted) reviews for this specific book
      const filter = { bookId, isActive: true }; // isActive: false means soft-deleted

      // Run count and paginated fetch in parallel for efficiency
      const [totalCount, reviews] = await Promise.all([
        Review.countDocuments(filter), // Total matching reviews — used for pagination UI
        Review.find(filter)
          .sort(sort) // Apply the requested sort
          .skip((page - 1) * limit) // Skip pages before the requested one
          .limit(limit) // Only fetch the requested page size
          .lean(), // Plain JS objects — faster than full Mongoose docs
      ]);

      // Calculate the average rating across ALL reviews for this book (not just this page)
      // We do this with a separate aggregate so pagination doesn't affect the average
      const ratingAgg = await Review.aggregate([
        { $match: filter }, // Only active reviews for this book
        { $group: { _id: null, avg: { $avg: "$rating" } } }, // Calculate average rating
      ]);
      const avgRating = ratingAgg[0]?.avg ?? 0; // Default to 0 if no reviews yet

      // Populate reviewer names — GraphQL resolvers do this manually (no .populate() on lean())
      // We batch-fetch all users at once instead of N+1 queries
      const userIds = reviews.map((r: any) => r.userId); // Collect all reviewer IDs
      const users = await User.find({ _id: { $in: userIds } })
        .select("firstName lastName")
        .lean();
      const userMap = Object.fromEntries(
        users.map((u: any) => [u._id.toString(), u]),
      ); // ID → user lookup

      // Shape each review to match the GraphQL Review type
      const shaped = reviews.map((r: any) => ({
        id: r._id.toString(), // Convert ObjectId to string for GraphQL ID
        bookId: r.bookId.toString(),
        userId: r.userId.toString(),
        authorName: (() => {
          // Build display name from User doc
          const u = userMap[r.userId.toString()];
          return u ? `${u.firstName} ${u.lastName}` : "Anonymous"; // Fallback if user was deleted
        })(),
        rating: r.rating,
        comment: r.comment,
        isPurchaseVerified: r.isPurchaseVerified,
        helpfulCount: r.helpfulCount ?? 0,
        isActive: r.isActive,
        createdAt: r.createdAt?.toISOString() ?? new Date().toISOString(),
      }));

      return { reviews: shaped, totalCount, avgRating }; // Return the ReviewConnection shape
    },

    // topReviews — convenience query returning up to 3 most helpful reviews
    // Useful for showing a "Top reviews" snippet without full pagination.
    topReviews: async (_: any, { bookId }: any) => {
      const reviews = await Review.find({ bookId, isActive: true })
        .sort({ helpfulCount: -1, rating: -1 }) // Most helpful first, then highest rated
        .limit(3) // Only top 3 — this is a showcase query
        .lean();

      // Populate names using the same batch pattern
      const userIds = reviews.map((r: any) => r.userId);
      const users = await User.find({ _id: { $in: userIds } })
        .select("firstName lastName")
        .lean();
      const userMap = Object.fromEntries(
        users.map((u: any) => [u._id.toString(), u]),
      );

      return reviews.map((r: any) => ({
        id: r._id.toString(),
        bookId: r.bookId.toString(),
        userId: r.userId.toString(),
        authorName: (() => {
          const u = userMap[r.userId.toString()];
          return u ? `${u.firstName} ${u.lastName}` : "Anonymous";
        })(),
        rating: r.rating,
        comment: r.comment,
        isPurchaseVerified: r.isPurchaseVerified,
        helpfulCount: r.helpfulCount ?? 0,
        isActive: r.isActive,
        createdAt: r.createdAt?.toISOString() ?? new Date().toISOString(),
      }));
    },
  },

  Mutation: {
    // Toggle isFeatured on/off — admin only (checked via context)
    toggleFeatured: async (_: any, { id }: { id: string }, context: any) => {
      // Context carries the authenticated user — reject if not admin
      if (context.user?.role !== "admin") {
        throw new Error("Unauthorized");
      }

      try {
        const book = await Book.findById(id);
        if (!book) throw new Error("Book not found");

        // Flip the featured flag
        book.isFeatured = !book.isFeatured;
        await book.save();

        logger.info("GraphQL toggleFeatured", {
          bookId: id,
          isFeatured: book.isFeatured,
        });

        return book;
      } catch (error) {
        logger.error("GraphQL toggleFeatured error", { error });
        throw new Error("Failed to toggle featured status");
      }
    },

    // Soft delete — admin only
    deleteBook: async (_: any, { id }: { id: string }, context: any) => {
      if (context.user?.role !== "admin") {
        throw new Error("Unauthorized");
      }

      try {
        await Book.findByIdAndUpdate(id, { isActive: false });
        logger.info("GraphQL deleteBook", { bookId: id });
        return true;
      } catch (error) {
        logger.error("GraphQL deleteBook error", { error });
        throw new Error("Failed to delete book");
      }
    },

    // createReview — GraphQL mutation (authenticated, purchase-verified)
    // Mirrors the REST POST /api/reviews/:bookId but exposed over GraphQL.
    // The context provides the authenticated user — same JWT verification as REST.
    createReview: async (
      _: any,
      { bookId, rating, comment }: any,
      context: any,
    ) => {
      // Must be logged in — GraphQL context provides user from JWT (see context.ts)
      if (!context.user) {
        throw new Error("You must be logged in to leave a review"); // GraphQL errors are thrown, not res.status()
      }

      // Validate rating range — GraphQL types don't enforce min/max on Int
      if (rating < 1 || rating > 5) {
        throw new Error("Rating must be between 1 and 5");
      }

      // Validate comment length — mirrors the REST validator (10-2000 chars)
      if (comment.trim().length < 10) {
        throw new Error("Review must be at least 10 characters");
      }

      const userId = context.user.userId; // Extracted from the verified JWT in context.ts

      // Check if the user owns the book — isPurchaseVerified is always set server-side
      const user = (await User.findById(userId)
        .select("library firstName lastName")
        .lean()) as any;
      if (!user) throw new Error("User not found");

      // Check if user's library contains this bookId
      const ownsBook = user.library?.some(
        (id: any) => id.toString() === bookId.toString(),
      );

      // Check if user already reviewed this book — one review per user per book
      const existing = await Review.findOne({ bookId, userId, isActive: true });
      if (existing) throw new Error("You have already reviewed this book");

      // Create the review — isPurchaseVerified is set by the server, never trusted from client
      const review = await Review.create({
        bookId,
        userId,
        rating,
        comment: comment.trim(), // Trim whitespace before saving
        isPurchaseVerified: ownsBook ?? false, // Server-determined — not client-provided
        helpfulCount: 0, // Starts at zero
        isActive: true, // Active by default
      });

      // Return the shaped review matching the GraphQL Review type
      return {
        id: review._id.toString(),
        bookId: review.bookId.toString(),
        userId: review.userId.toString(),
        authorName: `${user.firstName} ${user.lastName}`, // Build display name from user doc
        rating: review.rating,
        comment: review.comment,
        isPurchaseVerified: review.isPurchaseVerified,
        helpfulCount: 0,
        isActive: true,
        createdAt: review.createdAt?.toISOString() ?? new Date().toISOString(),
      };
    },
  },

  // Tell GraphQL how to map MongoDB's _id to the id field in the schema
  Book: {
    id: (parent: any) => parent._id.toString(),
  },
};

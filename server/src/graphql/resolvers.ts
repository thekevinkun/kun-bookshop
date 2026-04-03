import { Book } from "../models/Book";
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
  },

  // Tell GraphQL how to map MongoDB's _id to the id field in the schema
  Book: {
    id: (parent: any) => parent._id.toString(),
  },
};

// All tool function implementations for KUN Chatbot
// These are the real DB calls that execute when KUN calls a tool
// Public tools: no auth needed
// Auth-required tools: check req.user before executing — guests get requiresAuth

import mongoose from "mongoose"; // For ObjectId casting
import { Book } from "../models/Book"; // Book collection queries
import { Cart } from "../models/Cart"; // Cart collection queries
import { Order } from "../models/Order"; // Order collection queries
import { User } from "../models/User"; // User collection queries (library, wishlist)
import { Coupon } from "../models/Coupon"; // Coupon collection for validation
import { logger } from "../utils/logger"; // Winston logger — no console.log

// Standardized tool result shapes
// Every tool returns one of these three shapes — the LLM reads them to decide what to say

// Success — data contains whatever the tool fetched
const ok = (data: unknown) => ({ success: true, data });

// Failure — human-readable error message, no stack traces
const fail = (error: string) => ({ success: false, error });

// Auth required — special signal so LLM says "please log in first"
const requiresAuth = () => ({ success: false, requiresAuth: true });

// Already in cart — special signal so LLM says "it's already in your cart"
const alreadyInCart = () => ({ success: false, alreadyInCart: true });

// Already owned — special signal so LLM says "you already own this book"
const alreadyOwned = () => ({ success: false, alreadyOwned: true });

// PUBLIC TOOLS
// No auth required — guests and logged-in users can both call these

// searchBooks — full-text search on title, authorName, description
// query: the search term from the user
// limit: how many results to return (default 5, max 8)
export const searchBooks = async (query: string, limit = 5) => {
  try {
    const safeLimit = Math.min(Math.max(limit, 1), 8);

    // First try MongoDB full-text search on title index
    let books = await Book.find(
      { $text: { $search: query }, isActive: true },
      {
        title: 1,
        authorName: 1,
        price: 1,
        discountPrice: 1,
        rating: 1,
        category: 1,
        fileType: 1,
        description: 1,
      },
    )
      .limit(safeLimit)
      .lean();

    // If text search found nothing, fall back to regex search
    // This catches category names, authorName, and partial matches
    // that the text index doesn't cover
    if (books.length === 0) {
      const regex = new RegExp(query, "i"); // Case-insensitive regex
      books = await Book.find(
        {
          isActive: true,
          $or: [
            { title: regex }, // Match in title
            { authorName: regex }, // Match in denormalized author name
            { category: regex }, // Match in category array
            { description: regex }, // Match in description
            { tags: regex }, // Match in tags
          ],
        },
        {
          title: 1,
          authorName: 1,
          price: 1,
          discountPrice: 1,
          rating: 1,
          category: 1,
          fileType: 1,
          description: 1,
        },
      )
        .limit(safeLimit)
        .lean();
    }

    if (books.length === 0) {
      return fail("No books found matching that search.");
    }

    return ok(books);
  } catch (error) {
    logger.error("[Tool] searchBooks error:", error);
    return fail("Search is unavailable right now. Please try again.");
  }
};
// getBookDetails — fetch a single book's full details by its MongoDB _id
// bookId: the MongoDB ObjectId string of the book
export const getBookDetails = async (bookId: string) => {
  try {
    // Validate that bookId is a proper MongoDB ObjectId before querying
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return fail("Invalid book ID."); // Protect against garbage input
    }

    const book = await Book.findOne(
      { _id: bookId, isActive: true }, // Must be active — no soft-deleted books
      {
        // Only return fields that are safe and useful for conversation
        title: 1,
        authorName: 1,
        price: 1,
        discountPrice: 1,
        coverImage: 1,
        rating: 1,
        reviewCount: 1,
        category: 1,
        fileType: 1,
        fileSize: 1,
        description: 1,
        previewPages: 1,
        publishedDate: 1,
        publisher: 1,
      },
    ).lean(); // Plain JS object

    if (!book) return fail("Book not found.");

    return ok(book);
  } catch (error) {
    logger.error("[Tool] getBookDetails error:", error);
    return fail("Could not fetch book details right now.");
  }
};

// getFeaturedBooks — returns books marked isFeatured: true
// Used when user asks "what books do you recommend?" or "show me featured books"
export const getFeaturedBooks = async () => {
  try {
    // Fetch all active books — mirrors the real getFeatured controller algorithm
    const allBooks = await Book.find(
      { isActive: true },
      {
        title: 1,
        authorName: 1,
        price: 1,
        discountPrice: 1,
        rating: 1,
        category: 1,
        fileType: 1,
        purchaseCount: 1,
        publishedDate: 1,
      },
    ).lean();

    // Determine cutoff for "new release" bonus — same 60-day window as the controller
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // Score every book using the same three signals as getFeatured
    const scored = allBooks.map((book) => {
      const purchaseScore = (book.purchaseCount ?? 0) * 10; // Primary driver
      const isNewRelease =
        book.publishedDate && new Date(book.publishedDate) >= sixtyDaysAgo;
      const newReleaseScore = isNewRelease ? 5 : 0; // New release bonus
      const ratingScore = (book.rating ?? 0) * 2; // Quality tiebreaker
      const score = purchaseScore + newReleaseScore + ratingScore;
      return { ...book, score };
    });

    // Sort descending — highest score first, newest publishedDate as tiebreaker
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const dateA = a.publishedDate ? new Date(a.publishedDate).getTime() : 0;
      const dateB = b.publishedDate ? new Date(b.publishedDate).getTime() : 0;
      return dateB - dateA;
    });

    // Return top 5 — same cap as the homepage carousel
    const books = scored.slice(0, 5).map(({ score: _score, ...book }) => book); // Strip score field

    if (books.length === 0) return fail("No books available at the moment.");

    return ok(books);
  } catch (error) {
    logger.error("[Tool] getFeaturedBooks error:", error);
    return fail("Could not fetch featured books right now.");
  }
};

// getRecommendedBooks tool
// Triggered when the user asks for personalised recommendations based on their taste.
// Mirrors the exact same algorithm as GET /api/books/recommendations in book.controller.ts.
export const getRecommendedBooks = async (
  userId?: string, // The authenticated user's ID — undefined for guests
): Promise<{ success: boolean; data?: object; error?: string }> => {
  try {
    // Fetch the user's library and wishlist if we have a logged-in user
    const user = userId
      ? await User.findById(userId).select("library wishlist").lean()
      : null;

    // Fetch all active books to re-run the hero scoring and exclude those books
    // We exclude hero books so recommendations don't overlap with the hero carousel
    const heroBooks = await Book.find({ isActive: true })
      .select("purchaseCount publishedDate rating")
      .lean();

    // Re-run the same hero scoring used in getFeaturedBooks
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const heroScored = heroBooks.map((book) => ({
      ...book,
      score:
        (book.purchaseCount ?? 0) * 10 +
        (book.publishedDate && new Date(book.publishedDate) >= sixtyDaysAgo
          ? 5
          : 0) +
        (book.rating ?? 0) * 2,
    }));
    heroScored.sort((a, b) => b.score - a.score);

    // The top 5 hero book IDs — excluded from recommendations to avoid overlap
    const heroIds = heroScored.slice(0, 5).map((b) => b._id.toString());

    // Books the user already owns — no point recommending what they have
    const libraryIds = (user?.library ?? []).map((id) => id.toString());

    // Combined exclusion list: owned books + hero books
    // Wishlist books are intentionally KEPT — recommending a wishlisted book is a useful nudge
    const excludeIds = [...new Set([...libraryIds, ...heroIds])];

    // Determine whether we have enough signal to personalise
    const hasLibrary = libraryIds.length > 0;
    const hasWishlist = (user?.wishlist ?? []).length > 0;
    const isPersonalised = !!userId && (hasLibrary || hasWishlist);

    let books;

    if (isPersonalised) {
      // PERSONALISED PATH — user has library or wishlist history to work with

      // Collect categories from the user's purchased books
      const libraryBooks = hasLibrary
        ? await Book.find({ _id: { $in: user!.library }, isActive: true })
            .select("category")
            .lean()
        : [];

      // Collect categories from the user's wishlist
      const wishlistBooks = hasWishlist
        ? await Book.find({ _id: { $in: user!.wishlist }, isActive: true })
            .select("category")
            .lean()
        : [];

      // Build a weighted category frequency map
      // Wishlist categories count double — user is actively interested but hasn't bought yet
      const categoryWeight: Record<string, number> = {};

      for (const book of libraryBooks) {
        for (const cat of book.category) {
          // Each purchased book in this category adds 1 point of interest
          categoryWeight[cat] = (categoryWeight[cat] ?? 0) + 1;
        }
      }
      for (const book of wishlistBooks) {
        for (const cat of book.category) {
          // Wishlist counts double — stronger signal of active interest
          categoryWeight[cat] = (categoryWeight[cat] ?? 0) + 2;
        }
      }

      // All categories the user has shown interest in
      const interestedCategories = Object.keys(categoryWeight);

      // Find books that match at least one of the user's interested categories
      const candidates = await Book.find({
        isActive: true,
        category: { $in: interestedCategories },
        _id: { $nin: excludeIds }, // Skip owned and hero books
      })
        .select(
          "title authorName coverImage price discountPrice rating reviewCount purchaseCount category",
        )
        .lean();

      // Score each candidate: popularity + personal category relevance + quality
      const scored = candidates.map((book) => {
        const categoryScore = book.category.reduce(
          (sum: number, cat: string) => sum + (categoryWeight[cat] ?? 0),
          0,
        );
        const score =
          (book.purchaseCount ?? 0) * 10 + // Popularity weight
          categoryScore * 3 + // Personal relevance weight
          (book.rating ?? 0) * 2; // Quality tiebreaker

        return { ...book, score };
      });

      scored.sort((a, b) => b.score - a.score);
      books = scored.slice(0, 10);

      // If personalised results don't fill 10, pad with top general books
      // Handles niche tastes where few matching books exist
      if (books.length < 10) {
        const alreadyInResults = books.map((b) => b._id.toString());
        const padExclude = [...excludeIds, ...alreadyInResults];

        const padCandidates = await Book.find({
          isActive: true,
          _id: { $nin: padExclude },
        })
          .select(
            "title authorName coverImage price discountPrice rating reviewCount purchaseCount category",
          )
          .lean();

        const padScored = padCandidates
          .map((book) => ({
            ...book,
            score: (book.purchaseCount ?? 0) * 10 + (book.rating ?? 0) * 2,
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 10 - books.length); // Only pad up to 10 total

        books = [...books, ...padScored];
      }
    } else {
      // FALLBACK PATH — guest or brand new user with no history
      // Show top-scored books overall, still excluding hero books to avoid overlap
      const candidates = await Book.find({
        isActive: true,
        _id: { $nin: excludeIds },
      })
        .select(
          "title authorName coverImage price discountPrice rating reviewCount purchaseCount category",
        )
        .lean();

      const scored = candidates
        .map((book) => ({
          ...book,
          score: (book.purchaseCount ?? 0) * 10 + (book.rating ?? 0) * 2,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

      books = scored;
    }

    // Return the results along with whether they were personalised
    // The LLM uses the `personalised` flag to frame the response correctly
    return {
      success: true,
      data: {
        books: books.map((b) => ({
          // Only expose fields useful in a chat context — no Cloudinary internals
          id: b._id,
          title: b.title,
          authorName: b.authorName,
          price: b.price,
          discountPrice: b.discountPrice ?? null,
          rating: b.rating ?? null,
          reviewCount: b.reviewCount ?? 0,
          category: b.category,
        })),
        personalised: isPersonalised, // Let LLM know whether to say "based on your taste"
      },
    };
  } catch (error) {
    // Log the real error server-side, return a clean message to the LLM
    logger.error("getRecommendedBooks tool error", { error });
    return {
      success: false,
      error: "Could not fetch recommendations right now.",
    };
  }
};

// getCategories — returns all distinct category values across active books
// Used when user asks "what kinds of books do you sell?"
export const getCategories = async () => {
  try {
    // distinct() returns a flat array of unique values for the given field
    const categories = await Book.distinct("category", { isActive: true });

    if (categories.length === 0) return fail("No categories found.");

    return ok(categories); // e.g. ["Fiction", "Science", "Biography"]
  } catch (error) {
    logger.error("[Tool] getCategories error:", error);
    return fail("Could not fetch categories right now.");
  }
};

// validateCoupon — checks if a coupon code is valid and calculates discount
// code: the coupon code string e.g. "SAVE20"
// cartTotal: the current cart subtotal in dollars — needed to calculate discount amount
export const validateCoupon = async (code: string, cartTotal: number) => {
  try {
    // Find the coupon by code — case-insensitive by uppercasing both sides
    const coupon = await Coupon.findOne({
      code: code.toUpperCase().trim(), // Normalize the code
      isActive: true, // Must be active
    }).lean();

    if (!coupon)
      return fail("That coupon code doesn't exist or has been deactivated.");

    // Check if the coupon has expired
    const now = new Date();
    if (now < coupon.validFrom) return fail("That coupon isn't active yet.");
    if (now > coupon.validUntil) return fail("That coupon has expired.");

    // Check usage limit — if usedCount >= usageLimit, it's exhausted
    if (coupon.usedCount >= coupon.usageLimit) {
      return fail("That coupon has reached its usage limit.");
    }

    // Check minimum purchase requirement
    if (coupon.minPurchase && cartTotal < coupon.minPurchase) {
      return fail(
        `This coupon requires a minimum purchase of $${coupon.minPurchase.toFixed(2)}.`,
      );
    }

    // Calculate the discount amount based on coupon type
    let discountAmount = 0;

    if (coupon.discountType === "percentage") {
      // Percentage discount — e.g. 20% off $50 = $10 off
      discountAmount = (cartTotal * coupon.discountValue) / 100;

      // Apply maxDiscount cap if set — e.g. max $15 off even if 20% would be more
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      // Fixed discount — e.g. $5 off, but can't exceed the cart total
      discountAmount = Math.min(coupon.discountValue, cartTotal);
    }

    // Round to 2 decimal places to avoid floating point weirdness (e.g. $9.999999)
    discountAmount = Math.round(discountAmount * 100) / 100;
    const finalTotal = Math.round((cartTotal - discountAmount) * 100) / 100;

    return ok({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount, // How much they save
      finalTotal, // What they pay after discount
    });
  } catch (error) {
    logger.error("[Tool] validateCoupon error:", error);
    return fail("Could not validate that coupon right now.");
  }
};

// applyCoupon — validates a coupon and saves it directly to the user's cart
// Combines validation + persistence in one step
// userId: from req.user — null if guest
export const applyCoupon = async (code: string, userId: string | null) => {
  try {
    if (!userId) return requiresAuth(); // Auth boundary — guests have no cart

    // First fetch the user's cart to get the current subtotal
    const cart = await Cart.findOne({ userId }).lean();

    // If cart is empty or missing, nothing to apply a coupon to
    if (!cart || cart.items.length === 0) {
      return fail(
        "Your cart is empty. Add some books first before applying a coupon.",
      );
    }

    // Calculate the current cart subtotal from items
    const cartTotal = cart.items.reduce(
      (sum, item) => sum + item.price, // Add each item's price
      0,
    );

    // Validate the coupon using existing validateCoupon logic
    const validation = await validateCoupon(code, cartTotal);

    // If validation failed, return the failure reason directly
    if (!validation.success) return validation;

    // Coupon is valid — extract the computed discount data
    const couponData = (
      validation as {
        success: true;
        data: {
          code: string;
          discountType: string;
          discountValue: number;
          discountAmount: number;
          finalTotal: number;
        };
      }
    ).data;

    // Save the coupon into the cart document
    await Cart.findOneAndUpdate(
      { userId },
      {
        $set: {
          coupon: {
            code: couponData.code,
            discountType: couponData.discountType,
            discountValue: couponData.discountValue,
            discountAmount: couponData.discountAmount,
            finalTotal: couponData.finalTotal,
          },
        },
      },
      { new: true },
    );

    return ok({
      message: `Coupon "${couponData.code}" applied! You save $${couponData.discountAmount.toFixed(2)} — final total is $${couponData.finalTotal.toFixed(2)}.`,
      code: couponData.code,
      discountAmount: couponData.discountAmount,
      finalTotal: couponData.finalTotal,
    });
  } catch (error) {
    logger.error("[Tool] applyCoupon error:", error);
    return fail("Could not apply that coupon right now. Please try again.");
  }
};

// AUTH-REQUIRED TOOLS
// Every function below checks userId first — guests get requiresAuth()

// addToCart — adds a book to the user's cart
// bookId: MongoDB ObjectId of the book to add
// userId: from req.user — null if guest
export const addToCart = async (bookId: string, userId: string | null) => {
  try {
    // Auth boundary — guests cannot add to cart
    if (!userId) return requiresAuth();

    // Validate bookId format
    if (!mongoose.Types.ObjectId.isValid(bookId))
      return fail("Invalid book ID.");

    // Fetch the book to get its current details (title, price, etc.)
    const book = await Book.findOne(
      { _id: bookId, isActive: true },
      {
        title: 1,
        authorName: 1,
        price: 1,
        discountPrice: 1,
        coverImage: 1,
      },
    ).lean();

    if (!book)
      return fail("That book doesn't exist or is no longer available.");

    // Check if the user already owns this book — no point adding to cart
    const user = await User.findById(userId, { library: 1 }).lean();
    const ownsBook = user?.library?.some(
      (id) => id.toString() === bookId, // Compare ObjectId strings
    );
    if (ownsBook) return alreadyOwned();

    // Check if the book is already in the cart — findOne before updating
    const existingCart = await Cart.findOne({ userId }).lean();
    const alreadyInCartCheck = existingCart?.items?.some(
      (item) => item.bookId.toString() === bookId,
    );
    if (alreadyInCartCheck) return alreadyInCart();

    // Use the discountPrice if available, otherwise the regular price
    const effectivePrice = book.discountPrice ?? book.price;

    // Add the item to the cart — mirrors addItem in cart.controller.ts
    // $set: { coupon: null } clears any applied coupon (total has changed)
    await Cart.findOneAndUpdate(
      { userId, "items.bookId": { $ne: new mongoose.Types.ObjectId(bookId) } }, // Only if not already in cart
      {
        $push: {
          items: {
            bookId: new mongoose.Types.ObjectId(bookId),
            title: book.title,
            authorName: book.authorName, // Always denormalized string — never ObjectId
            price: effectivePrice,
            coverImage: book.coverImage,
          },
        },
        $set: { coupon: null }, // Wipe coupon — total has changed
      },
      { upsert: true, new: true }, // Create cart if doesn't exist
    );

    return ok({ message: `"${book.title}" has been added to your cart!` });
  } catch (error) {
    logger.error("[Tool] addToCart error:", error);
    return fail("Could not add that book to your cart right now.");
  }
};

// removeFromCart — removes a book from the user's cart by bookId
export const removeFromCart = async (bookId: string, userId: string | null) => {
  try {
    if (!userId) return requiresAuth(); // Auth boundary

    if (!mongoose.Types.ObjectId.isValid(bookId))
      return fail("Invalid book ID.");

    // Pull the item out and wipe the coupon (total has changed)
    const cart = await Cart.findOneAndUpdate(
      { userId },
      {
        $pull: { items: { bookId: new mongoose.Types.ObjectId(bookId) } }, // Remove item
        $set: { coupon: null }, // Coupon total is now stale — clear it
      },
      { new: true },
    ).lean();

    if (!cart) return fail("Your cart was not found.");

    return ok({
      message: "Book removed from your cart.",
      itemCount: cart.items.length,
    });
  } catch (error) {
    logger.error("[Tool] removeFromCart error:", error);
    return fail("Could not remove that book from your cart right now.");
  }
};

// getMyCart — returns the current user's cart contents
export const getMyCart = async (userId: string | null) => {
  try {
    if (!userId) return requiresAuth(); // Auth boundary

    // Fetch or create the cart — upsert so guests never get null
    const cart = await Cart.findOneAndUpdate(
      { userId },
      { $setOnInsert: { userId, items: [], coupon: null } }, // Only set on creation
      { upsert: true, new: true },
    ).lean();

    // Return only conversation-relevant fields — no internal IDs or Cloudinary URLs
    return ok({
      items: cart.items.map((item) => ({
        bookId: item.bookId.toString(),
        title: item.title,
        authorName: item.authorName,
        price: item.price,
      })),
      coupon: cart.coupon
        ? {
            code: cart.coupon.code,
            discountAmount: cart.coupon.discountAmount,
            finalTotal: cart.coupon.finalTotal,
          }
        : null,
      itemCount: cart.items.length,
    });
  } catch (error) {
    logger.error("[Tool] getMyCart error:", error);
    return fail("Could not fetch your cart right now.");
  }
};

// getMyLibrary — returns the user's purchased books
// Only returns title + authorName — never filePublicId or Cloudinary URLs
export const getMyLibrary = async (userId: string | null) => {
  try {
    if (!userId) return requiresAuth(); // Auth boundary

    // Populate the library array with book details — user.library is ObjectId[]
    const user = await User.findById(userId, { library: 1 })
      .populate<{
        library: {
          _id: mongoose.Types.ObjectId;
          title: string;
          authorName: string;
          fileType: string;
        }[];
      }>(
        "library", // Populate the library field
        "title authorName fileType", // Only fetch these fields — security rule: no fileUrl
      )
      .lean();

    if (!user) return fail("User not found.");

    // Map to a clean shape — only what the LLM needs to describe the library
    const books = user.library.map((book) => ({
      bookId: book._id.toString(),
      title: book.title,
      authorName: book.authorName,
      fileType: book.fileType, // pdf or epub — useful for answering "how do I read it?"
    }));

    if (books.length === 0)
      return ok({ books: [], message: "Your library is empty." });

    return ok({ books, totalOwned: books.length });
  } catch (error) {
    logger.error("[Tool] getMyLibrary error:", error);
    return fail("Could not fetch your library right now.");
  }
};

// getMyOrders — returns the user's order history
// Returns enough detail for KUN to summarize orders — no payment internals
export const getMyOrders = async (userId: string | null) => {
  try {
    if (!userId) return requiresAuth(); // Auth boundary

    const orders = await Order.find(
      { userId, paymentStatus: "completed" }, // Only completed orders — not pending/failed
      {
        orderNumber: 1, // Human-readable order ID e.g. ORD-20260403-ABC123
        items: 1, // The books purchased
        total: 1, // Final amount charged
        couponCode: 1, // Coupon used, if any
        completedAt: 1, // When payment was confirmed
        createdAt: 1, // When order was placed
      },
    )
      .sort({ createdAt: -1 }) // Newest first
      .limit(10) // Cap at 10 — enough history without overwhelming the chat
      .lean();

    if (orders.length === 0) {
      return ok({ orders: [], message: "You haven't placed any orders yet." });
    }

    // Map to a clean shape — strip internal IDs, keep what's useful for conversation
    const cleanOrders = orders.map((order) => ({
      orderNumber: order.orderNumber,
      total: order.total,
      couponCode: order.couponCode ?? null,
      completedAt: order.completedAt,
      itemCount: order.items.length,
      items: order.items.map((item) => ({
        title: item.title,
        author: item.author, // IOrderItem uses 'author' not 'authorName'
        price: item.price,
      })),
    }));

    return ok({ orders: cleanOrders, totalOrders: orders.length });
  } catch (error) {
    logger.error("[Tool] getMyOrders error:", error);
    return fail("Could not fetch your orders right now.");
  }
};

// addToWishlist — adds a book to the user's wishlist
export const addToWishlist = async (bookId: string, userId: string | null) => {
  try {
    if (!userId) return requiresAuth(); // Auth boundary

    if (!mongoose.Types.ObjectId.isValid(bookId))
      return fail("Invalid book ID.");

    // Verify the book exists and is active
    const book = await Book.findOne(
      { _id: bookId, isActive: true },
      { title: 1 },
    ).lean();
    if (!book)
      return fail("That book doesn't exist or is no longer available.");

    // Add to wishlist only if not already there — $addToSet prevents duplicates
    await User.findByIdAndUpdate(
      userId,
      { $addToSet: { wishlist: new mongoose.Types.ObjectId(bookId) } }, // addToSet = no duplicates
    );

    return ok({
      message: `"${book.title}" has been added to your wishlist! 💛`,
    });
  } catch (error) {
    logger.error("[Tool] addToWishlist error:", error);
    return fail("Could not add that book to your wishlist right now.");
  }
};

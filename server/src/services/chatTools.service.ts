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
    // Clamp limit between 1 and 8 — don't let the LLM request 100 results
    const safeLimit = Math.min(Math.max(limit, 1), 8);

    // Use MongoDB $text search on the text index (title + author fields)
    // Only return active books — isActive: true filters soft-deleted ones
    const books = await Book.find(
      { $text: { $search: query }, isActive: true }, // Full-text search filter
      {
        // Project only the fields KUN needs — never expose fileUrl or filePublicId
        title: 1,
        authorName: 1,
        price: 1,
        discountPrice: 1,
        coverImage: 1,
        rating: 1,
        category: 1,
        fileType: 1,
        description: 1,
      },
    )
      .limit(safeLimit) // Cap results
      .lean(); // Return plain JS objects instead of Mongoose documents (faster)

    // If nothing found, return a clear failure so LLM can suggest alternatives
    if (books.length === 0) {
      return fail("No books found matching that search.");
    }

    return ok(books); // Return the matching books
  } catch (error) {
    logger.error("[Tool] searchBooks error:", error); // Log internally
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
    const books = await Book.find(
      { isFeatured: true, isActive: true }, // Featured and not soft-deleted
      {
        title: 1,
        authorName: 1,
        price: 1,
        discountPrice: 1,
        coverImage: 1,
        rating: 1,
        category: 1,
        fileType: 1,
      },
    )
      .limit(6) // Cap at 6 — enough to present without overwhelming the chat
      .lean();

    if (books.length === 0) return fail("No featured books at the moment.");

    return ok(books);
  } catch (error) {
    logger.error("[Tool] getFeaturedBooks error:", error);
    return fail("Could not fetch featured books right now.");
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

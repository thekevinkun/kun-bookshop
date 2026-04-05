// Import Express types for request and response objects
import { Request, Response } from "express";

// Import Stripe SDK and initialize it with our secret key
import Stripe from "stripe";

import { env } from "../config/env";

// Import our models
import { Order } from "../models/Order";
import { Book } from "../models/Book";
import { User } from "../models/User";

// Import our logger — never use console.log in this project
import { logger } from "../utils/logger";

// Initialize Stripe with our secret key from .env
// This is the main Stripe client we use to create sessions and verify webhooks
const stripe = Stripe(env.STRIPE_SECRET_KEY);

// Helper to generate a unique human-readable order number
// Format: ORD-20260403-ABC123 — date + 6 random uppercase chars
const generateOrderNumber = (): string => {
  // Get today's date in YYYYMMDD format
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  // Generate 6 random uppercase letters/numbers
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${date}-${random}`;
};

// POST /api/checkout/create-session
// Creates a Stripe checkout session and returns the URL to redirect the user to
export const createCheckoutSession = async (req: Request, res: Response) => {
  try {
    // Extract the items array and optional coupon code from the validated request body
    const { items, couponCode } = req.body;
    // Get the logged-in user's ID from the JWT payload (attached by auth middleware)
    const userId = req.user!.userId;

    // --- SERVER-SIDE PRICE VERIFICATION (Security §4.1) ---
    // Extract just the book IDs from the items array
    const bookIds = items.map((item: { bookId: string }) => item.bookId);
    const bookIdsSorted = [...bookIds].sort().join(","); // Sort so order doesn't matter

    // --- DUPLICATE ORDER GUARD (Security §4.3) ---
    const recentPendingOrder = await Order.findOne({
      userId,
      paymentStatus: "pending",
      createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) },
    });

    // Only reuse the existing session if the cart contents are IDENTICAL
    // If the user changed their cart, fall through and create a new session
    if (recentPendingOrder?.stripeSessionId) {
      const savedBookIdsSorted = recentPendingOrder.items
        .map((item) => item.bookId.toString())
        .sort()
        .join(",");

      if (savedBookIdsSorted === bookIdsSorted) {
        const existingSession = await stripe.checkout.sessions.retrieve(
          recentPendingOrder.stripeSessionId,
        );
        return res.json({
          sessionId: existingSession.id,
          url: existingSession.url,
        });
      }
      // Cart changed — fall through to create a fresh order and session
    }

    // Fetch the books from OUR database — we never trust prices from the client
    const books = await Book.find({
      _id: { $in: bookIds }, // Find all books matching the sent IDs
      isActive: true, // Only return books that are currently available
    });

    // If any book IDs didn't match (deleted or inactive books), reject the checkout
    if (books.length !== bookIds.length) {
      return res
        .status(400)
        .json({ error: "One or more books are unavailable" });
    }

    // Check if the user already owns any of these books (already in their library)
    const user = await User.findById(userId).select("library");
    const alreadyOwned = books.filter((book) =>
      user?.library.map((id) => id.toString()).includes(book._id.toString()),
    );

    // Reject if the user is trying to buy a book they already own
    if (alreadyOwned.length > 0) {
      return res.status(400).json({
        error: `You already own: ${alreadyOwned.map((b) => b.title).join(", ")}`,
      });
    }

    // Compute the subtotal using OUR prices from OUR database
    // discountPrice takes priority over the regular price (sale price)
    const subtotal = books.reduce((sum, book) => {
      return sum + (book.discountPrice ?? book.price);
    }, 0);

    // Start with no discount applied
    let discount = 0;
    let appliedCouponCode: string | undefined;

    // --- COUPON VALIDATION ---
    // If a coupon code was sent, validate it before applying
    if (couponCode) {
      // Import inline to avoid circular deps — Coupon model may not exist yet
      // We'll handle coupon logic fully in Phase 9 (Enhanced Features)
      // For now we just pass it through if provided
      appliedCouponCode = couponCode.toUpperCase().trim();
    }

    // Final total after any discount
    const total = subtotal - discount;

    // --- CREATE ORDER IN DB ---
    // We create the order BEFORE the Stripe session so we have an orderId for the metadata
    const order = new Order({
      orderNumber: generateOrderNumber(), // Human-readable unique ID
      userId,
      items: books.map((book) => ({
        bookId: book._id,
        title: book.title,
        author: book.authorName, // Use denormalized authorName (Phase 3)
        price: book.discountPrice ?? book.price, // The actual price charged
        coverImage: book.coverImage,
      })),
      subtotal,
      discount,
      total,
      couponCode: appliedCouponCode,
      paymentStatus: "pending", // Will be updated to 'completed' by webhook
    });

    await order.save();

    // --- CREATE STRIPE CHECKOUT SESSION ---
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"], // Only accept card payments

      // Build one line item per book for Stripe's UI
      line_items: books.map((book) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: book.title,
            description: `by ${book.authorName}`,
            images: [book.coverImage], // Stripe shows this in their checkout UI
          },
          // Stripe requires amounts in cents — multiply by 100
          unit_amount: Math.round((book.discountPrice ?? book.price) * 100),
        },
        quantity: 1, // Digital books are always quantity 1
      })),

      mode: "payment", // One-time payment (not a subscription)

      // Where Stripe redirects after success — we pass session_id so we can verify it
      success_url: `${process.env.CLIENT_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,

      // Where Stripe redirects if the user cancels
      cancel_url: `${process.env.CLIENT_URL}/checkout/cancel`,

      // Pre-fill the user's email in Stripe's checkout form
      customer_email: req.user!.email,

      // Store our orderId and userId in Stripe's metadata
      // The webhook reads these to know which order to fulfill
      metadata: {
        orderId: order._id.toString(),
        userId,
      },
    });

    // Save the Stripe session ID to our order so we can retrieve it for the duplicate guard
    order.stripeSessionId = session.id;
    await order.save();

    // Log the session creation for audit purposes
    logger.info("Stripe checkout session created", {
      orderId: order._id,
      userId,
      total,
    });

    // Return the session ID and URL to the frontend
    // The frontend will redirect the user to session.url (Stripe's hosted checkout page)
    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    // Log the full error internally but don't expose details to the client
    logger.error("Checkout session creation failed", { error });
    res.status(500).json({ error: "Checkout failed. Please try again." });
  }
};

// GET /api/checkout/verify-session?session_id=xxx
// Called by the success page to confirm the payment went through
// We do NOT fulfill the order here — that's the webhook's job
// This is purely to show the user a confirmation screen with their order number
export const verifySession = async (req: Request, res: Response) => {
  try {
    const { session_id } = req.query;

    if (!session_id || typeof session_id !== "string") {
      return res.status(400).json({ error: "Session ID is required" });
    }

    const order = await Order.findOne({ stripeSessionId: session_id });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // If the order is still pending, the webhook hasn't fired yet
    // Tell the frontend to poll again rather than showing a false success screen
    if (order.paymentStatus === "pending") {
      return res.status(202).json({
        status: "pending",
        message: "Payment is being confirmed. Please wait...",
      });
    }

    // If payment failed, tell the frontend clearly
    if (order.paymentStatus === "failed") {
      return res.status(400).json({
        status: "failed",
        error: "Payment was not completed.",
      });
    }

    // Only reach here if paymentStatus === 'completed'
    res.json({
      orderNumber: order.orderNumber,
      total: order.total,
      status: order.paymentStatus,
    });
  } catch (error) {
    logger.error("Session verification failed", { error });
    res.status(500).json({ error: "Verification failed" });
  }
};

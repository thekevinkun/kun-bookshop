// Import Express types for request and response objects
import { Request, Response } from "express";

// Import Stripe SDK and initialize it with our secret key
import Stripe from "stripe";

import { env } from "../config/env";

// Import our models
import { Order } from "../models/Order";
import { Book } from "../models/Book";
import { User } from "../models/User";
import { Coupon } from "../models/Coupon";

// Import our logger — never use console.log in this project
import { logger } from "../utils/logger";

// Store the stripe instance — initialized lazily on first use
// This allows tests to mock the stripe module before the instance is created
let _stripe: ReturnType<typeof Stripe> | null = null;

function getStripe() {
  if (!_stripe) {
    // Call Stripe as a function (not constructor) — matches your existing usage
    _stripe = Stripe(env.STRIPE_SECRET_KEY);
  }
  return _stripe!;
}

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
  // Declare order outside try so the catch block can clean it up on Stripe failure
  let order: InstanceType<typeof Order> | null = null;

  try {
    // Extract the items array and optional coupon code from the validated request body
    const { items, couponCode } = req.body;
    // Get the logged-in user's ID from the JWT payload (attached by auth middleware)
    const userId = req.user!.userId;

    // SERVER-SIDE PRICE VERIFICATION (Security §4.1)
    // Extract just the book IDs from the items array
    const bookIds = items.map((item: { bookId: string }) => item.bookId);
    const bookIdsSorted = [...bookIds].sort().join(","); // Sort so order doesn't matter

    // DUPLICATE ORDER GUARD (Security §4.3)
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

      // Also check the coupon matches — different coupon = different total = need new session
      const couponMatches =
        (recentPendingOrder.couponCode ?? null) ===
        (couponCode?.toUpperCase().trim() ?? null);

      if (savedBookIdsSorted === bookIdsSorted && couponMatches) {
        const existingSession = await getStripe().checkout.sessions.retrieve(
          recentPendingOrder.stripeSessionId,
        );

        // Only reuse if the Stripe session is still open — expired sessions have no usable URL
        // Stripe sessions expire after 24 hours, after which status becomes 'expired'
        if (existingSession.status === "open") {
          return res.json({
            sessionId: existingSession.id,
            url: existingSession.url, // Same Stripe page the user was on before
          });
        }
        // Session expired — fall through to create a fresh order and session
      }
      // Cart or coupon changed — fall through to create a fresh order and session
    }

    // STALE ORDER CLEANUP
    // If we reach here, the duplicate guard didn't find a reusable session.
    // That means either: cart changed, coupon changed, or session expired.
    // Cancel any lingering pending orders for this user so they don't pile up.
    // We only cancel — we never delete — so admin can still see the history.
    if (recentPendingOrder) {
      recentPendingOrder.paymentStatus = "failed";
      await recentPendingOrder.save();
      logger.info(
        "Marked stale pending order as failed before creating new session",
        {
          orderId: recentPendingOrder._id.toString(),
          userId,
        },
      );
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

    // COUPON VALIDATION
    // Start with no discount applied
    let discount = 0;
    let appliedCouponCode: string | undefined;

    // If a coupon code was sent, validate it before applying
    if (couponCode) {
      // Look up the coupon — must be active, within its validity window, and under usage limit
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase().trim(),
        isActive: true,
        validFrom: { $lte: new Date() }, // Has already started
        validUntil: { $gte: new Date() }, // Has not yet expired
      });

      if (coupon && coupon.usedCount < coupon.usageLimit) {
        // Calculate the discount against the server-verified subtotal
        if (coupon.discountType === "percentage") {
          discount = (subtotal * coupon.discountValue) / 100;
          // Cap the discount if maxDiscount is set
          if (
            coupon.maxDiscount !== undefined &&
            discount > coupon.maxDiscount
          ) {
            discount = coupon.maxDiscount;
          }
        } else {
          // Fixed discount — never exceed the cart total
          discount = Math.min(coupon.discountValue, subtotal);
        }

        // Round to 2 decimal places to avoid floating-point drift
        discount = Math.round(discount * 100) / 100;
        appliedCouponCode = coupon.code; // Store the clean uppercase code
      }
      // If coupon is invalid we silently ignore it — frontend already validated,
      // so reaching here means a tampered request. Order proceeds at full price.
    }

    // Final total after any discount
    const total = subtotal - discount;

    // CREATE ORDER IN DB
    // We create the order BEFORE the Stripe session so we have an orderId for the metadata
    order = new Order({
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

    // Calculate the discount ratio so we can distribute it proportionally across items
    // e.g. if subtotal is $17 and discount is $3.40, ratio is 0.2 (20% off)
    const discountRatio = discount > 0 ? discount / subtotal : 0;

    // CREATE STRIPE CHECKOUT SESSION
    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ["card"], // Only accept card payments

      // Build one line item per book for Stripe's UI
      line_items: books.map((book) => {
        // Get this book's base price
        const basePrice = book.discountPrice ?? book.price;
        // Reduce it by the discount ratio so all items together sum to the correct total
        const discountedPrice = basePrice * (1 - discountRatio);
        // Convert to cents and round — Stripe requires a non-negative integer
        const unitAmount = Math.max(1, Math.round(discountedPrice * 100));

        return {
          price_data: {
            currency: "usd",
            product_data: {
              name: book.title,
              // Show the coupon code in the description so user sees it on Stripe page
              description: appliedCouponCode
                ? `by ${book.authorName} • Coupon ${appliedCouponCode} applied`
                : `by ${book.authorName}`,
              images: [book.coverImage],
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        };
      }),

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
      orderId: order._id.toString(),
      userId,
      total,
    });

    // Return the session ID and URL to the frontend
    // The frontend will redirect the user to session.url (Stripe's hosted checkout page)
    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    logger.error("Checkout session creation failed", { error });

    // Clean up the orphaned pending order if Stripe rejected the session
    // Without this, failed checkout attempts leave stale pending orders in the DB
    if (order?._id) {
      await Order.findByIdAndDelete(order._id).catch(() => {}); // Best-effort cleanup
    }

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

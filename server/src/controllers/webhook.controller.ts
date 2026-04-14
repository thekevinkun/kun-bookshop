// Import Express types
import { Request, Response } from "express";

// Import Stripe SDK
import Stripe from "stripe";

import { env } from "../config/env";

// Import our models
import { Book } from "../models/Book";
import { Order } from "../models/Order";
import { User } from "../models/User";
import { Coupon } from "../models/Coupon";
import { ProcessedEvent } from "../models/ProcessedEvent";

// Import email service to send order confirmation after payment
import { sendOrderConfirmation } from "../services/email.service";

// Import logger
import { logger } from "../utils/logger";

// Import audit logger to record the fulfilled order
import { logAuditEvent } from "../services/audit.service";

// Initialize Stripe client
const stripe = Stripe(env.STRIPE_SECRET_KEY);

// POST /api/webhooks/stripe
// Stripe calls this endpoint after a payment event happens
// IMPORTANT: This route must receive the RAW body (not JSON-parsed) — see routes file
export const handleStripeWebhook = async (req: Request, res: Response) => {
  // Read the Stripe signature header — Stripe includes this with every webhook
  const sig = req.headers["stripe-signature"] as string;

  let event: ReturnType<typeof stripe.webhooks.constructEvent>;

  // VERIFY WEBHOOK SIGNATURE
  // This proves the request actually came from Stripe and wasn't faked
  try {
    event = stripe.webhooks.constructEvent(
      req.body, // Raw body buffer (NOT parsed JSON)
      sig, // Signature from the header
      env.STRIPE_WEBHOOK_SECRET, // Our webhook secret from Stripe dashboard
    );
  } catch (err) {
    // If signature verification fails, reject the request immediately
    logger.warn("Stripe webhook signature verification failed", { err });
    return res
      .status(400)
      .json({ error: "Webhook signature verification failed" });
  }

  // IDEMPOTENCY GUARD (Security §4.2)
  // Try to insert this event's ID into the ProcessedEvent collection
  // If it already exists, MongoDB throws a duplicate key error (code 11000)
  // This prevents the same event from being processed twice if Stripe retries
  try {
    await ProcessedEvent.create({
      stripeEventId: event.id, // Stripe's unique event ID
      eventType: event.type, // e.g. 'checkout.session.completed'
    });
  } catch (err: any) {
    if (err.code === 11000) {
      // Duplicate event — we already processed this one, tell Stripe "got it" and stop
      logger.info("Duplicate Stripe webhook event received, skipping", {
        eventId: event.id,
      });
      return res.status(200).json({ received: true, duplicate: true });
    }
    // Any other DB error — let it bubble up as a 500
    throw err;
  }

  // HANDLE THE EVENT
  switch (event.type) {
    case "checkout.session.completed":
      // Payment was successful — fulfill the order
      await handleCheckoutCompleted(
        event.data.object as Awaited<
          ReturnType<typeof stripe.checkout.sessions.retrieve>
        >,
      );
      break;

    case "payment_intent.payment_failed":
      // Payment failed — update the order status so admin can see it
      await handlePaymentFailed(
        event.data.object as Awaited<
          ReturnType<typeof stripe.paymentIntents.retrieve>
        >,
      );
      break;

    default:
      // We don't handle every Stripe event — just log unknown ones and move on
      logger.info(`Unhandled Stripe event type: ${event.type}`);
  }

  // Tell Stripe we received the event — must respond with 200 or Stripe will retry
  res.json({ received: true });
};

// Handles a successful checkout — called only after signature AND idempotency checks pass
const handleCheckoutCompleted = async (
  session: Awaited<ReturnType<typeof stripe.checkout.sessions.retrieve>>,
) => {
  // Pull out the orderId and userId we stored in Stripe's metadata when creating the session
  const { orderId, userId } = session.metadata!;

  // Find the order in our database
  const order = await Order.findById(orderId);
  if (!order) {
    // This shouldn't happen — log it loudly for investigation
    logger.error("Order not found during webhook fulfillment", { orderId });
    return;
  }

  // Extra safety check — if order is already completed, do nothing
  // This is a second layer of protection on top of the ProcessedEvent guard
  if (order.paymentStatus === "completed") {
    logger.warn("Order already completed, skipping fulfillment", { orderId });
    return;
  }

  // Mark the order as completed
  order.paymentStatus = "completed";
  // Store Stripe's payment intent ID for refund lookups later
  order.stripePaymentIntentId = session.payment_intent as string;
  // Record exactly when the payment was confirmed
  order.completedAt = new Date();
  await order.save();

  // If a coupon was applied to this order, increment its usedCount by 1
  // $inc is atomic — safe if two webhooks somehow fire simultaneously
  if (order.couponCode) {
    await Coupon.findOneAndUpdate(
      { code: order.couponCode },
      { $inc: { usedCount: 1 } },
    );
  }

  // Add all purchased book IDs to the user's library
  // $addToSet prevents duplicates — safe to run multiple times
  const bookIds = order.items.map((item) => item.bookId);
  await User.findByIdAndUpdate(userId, {
    $addToSet: { library: { $each: bookIds } }, // $each adds multiple items at once
  });

  // Increment purchaseCount on every book that was just bought
  // $inc is atomic — safe if two webhooks somehow fire simultaneously
  // We use updateMany so all books in the order are updated in a single DB call
  await Book.updateMany(
    { _id: { $in: bookIds } }, // Match all books in this order
    { $inc: { purchaseCount: 1 } }, // Increment each book's purchaseCount by 1
  );

  // Fetch the user so we can send them a confirmation email
  const user = await User.findById(userId);
  if (user) {
    // Send order confirmation email with the order details
    await sendOrderConfirmation(user.email, order).catch((err) => {
      // Don't let email failure break the fulfillment — just log it
      logger.error("Failed to send order confirmation email", { err, orderId });
    });
  }

  // Write an audit log entry so we have a record of this fulfillment
  await logAuditEvent({
    userId,
    action: "ORDER_FULFILLED",
    resourceType: "Order",
    resourceId: orderId,
    metadata: { total: order.total, bookCount: bookIds.length },
  });

  logger.info("Order fulfilled successfully", {
    orderId,
    userId,
    total: order.total,
  });
};

// Handles a failed payment — looks up by session ID since paymentIntentId
// is only populated AFTER a successful completion, not on failure
const handlePaymentFailed = async (
  paymentIntent: Awaited<ReturnType<typeof stripe.paymentIntents.retrieve>>,
) => {
  // A PaymentIntent can have multiple charges and sessions — we find the order
  // by matching the stripePaymentIntentId if it was already set, OR by
  // looking for a pending order whose session maps to this payment intent
  let order = await Order.findOne({
    stripePaymentIntentId: paymentIntent.id,
  });

  // If not found by payment intent ID, the order was created but the
  // payment intent ID was never saved (failure happened before completion)
  // Try to find it via Stripe — retrieve the session that owns this intent
  if (!order) {
    try {
      // List checkout sessions associated with this payment intent
      const sessions = await stripe.checkout.sessions.list({
        payment_intent: paymentIntent.id,
        limit: 1,
      });

      if (sessions.data.length > 0) {
        // Find the order by the Stripe session ID we DO have stored
        order = await Order.findOne({
          stripeSessionId: sessions.data[0].id,
        });
      }
    } catch (err) {
      logger.error("Failed to look up session for failed payment intent", {
        paymentIntentId: paymentIntent.id,
        err,
      });
    }
  }

  if (!order) {
    logger.warn("No order found for failed payment intent", {
      paymentIntentId: paymentIntent.id,
    });
    return;
  }

  // Mark the order as failed so admin can see it
  order.paymentStatus = "failed";
  // Now we can also save the payment intent ID for future reference
  order.stripePaymentIntentId = paymentIntent.id;
  await order.save();

  logger.warn("Payment failed for order", { orderId: order._id });
};

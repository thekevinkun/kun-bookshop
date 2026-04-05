// Import mongoose tools we need to build the schema
import mongoose, { Schema } from "mongoose";

// Import Order types to ensure our schema matches the expected shape
import type { IOrder } from "../types/order";

// Build the Mongoose schema from the interface above
const OrderSchema = new Schema<IOrder>(
  {
    // Human-readable order number — generated in the controller before saving
    orderNumber: {
      type: String,
      required: true,
      unique: true, // No two orders can share the same number
    },

    // The user who placed this order
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User", // Links to the User collection
      required: true,
    },

    // Array of book snapshots — we copy the data so it's frozen at purchase time
    items: [
      {
        bookId: { type: Schema.Types.ObjectId, ref: "Book", required: true },
        title: { type: String, required: true },
        author: { type: String, required: true },
        price: { type: Number, required: true },
        coverImage: { type: String, required: true },
      },
    ],

    // Financial fields
    subtotal: { type: Number, required: true }, // Before discount
    discount: { type: Number, default: 0 }, // How much was saved
    total: { type: Number, required: true }, // What was actually charged
    couponCode: { type: String, default: null }, // Coupon used, if any

    // Payment state — starts as 'pending', becomes 'completed' after Stripe webhook
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },

    // Only Stripe is supported right now
    paymentMethod: {
      type: String,
      enum: ["stripe"],
      default: "stripe",
    },

    // Set by the webhook after Stripe confirms payment
    stripePaymentIntentId: { type: String, default: null },

    // Set when we create the Stripe checkout session
    stripeSessionId: { type: String, default: null },

    // Timestamp of when the payment was confirmed
    completedAt: { type: Date, default: null },
  },
  {
    timestamps: true, // Auto-adds createdAt and updatedAt
  },
);

// Index by userId so we can quickly fetch all orders for a specific user
OrderSchema.index({ userId: 1 });

// Index by paymentStatus for admin filtering (show all pending orders, etc.)
OrderSchema.index({ paymentStatus: 1 });

// Index by createdAt descending so newest orders appear first
OrderSchema.index({ createdAt: -1 });

// Export the model so controllers and services can use it
export const Order = mongoose.model<IOrder>("Order", OrderSchema);

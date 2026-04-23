import mongoose, { Schema } from "mongoose"; // Import mongoose tools for defining the model

import type { ICart, ICartItem, ICouponData } from "../types/order";

// CartItemSchema defines the sub-document shape for each item
const CartItemSchema = new Schema<ICartItem>(
  {
    bookId: { type: Schema.Types.ObjectId, ref: "Book", required: true }, // Links to Book collection
    title: { type: String, required: true }, // Stored here so CartDrawer renders without populate
    authorName: { type: String, required: true }, // Denormalized — never use book.author
    price: { type: Number, required: true }, // Price at time of adding — display only, NOT used for checkout
    coverImage: { type: String, required: true }, // Cloudinary cover URL
  },
  { _id: false }, // No separate _id for sub-documents — bookId is the identifier
);

// CouponSchema defines the applied coupon sub-document
const CouponSchema = new Schema<ICouponData>(
  {
    code: { type: String, required: true }, // Coupon code
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    }, // Type of discount
    discountValue: { type: Number, required: true }, // Raw value e.g. 20
    discountAmount: { type: Number, required: true }, // Computed savings in dollars
    finalTotal: { type: Number, required: true }, // Final price after coupon
  },
  { _id: false }, // No separate _id needed for this embedded object
);

// CartSchema is the main document schema
const CartSchema = new Schema<ICart>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    }, // One cart per user
    items: { type: [CartItemSchema], default: [] }, // Starts as empty array
    coupon: { type: CouponSchema, default: null }, // No coupon by default
  },
  { timestamps: true }, // Adds createdAt and updatedAt automatically
);

// Export the Cart model for use in controllers
export const Cart = mongoose.model<ICart>("Cart", CartSchema);

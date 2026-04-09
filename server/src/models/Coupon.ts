// Import mongoose and the tools we need to define a schema and model
import mongoose, { Schema } from "mongoose";

import type { ICoupon } from "../types/book";

// Define the schema — this tells mongoose exactly what fields to store in MongoDB
const CouponSchema = new Schema<ICoupon>(
  {
    code: {
      type: String,
      required: true, // Every coupon must have a code
      unique: true, // No two coupons can share the same code (enforces a unique index)
      uppercase: true, // Auto-converts to uppercase so "save20" and "SAVE20" are the same
      trim: true, // Strips leading/trailing spaces so " SAVE20 " becomes "SAVE20"
    },

    discountType: {
      type: String,
      enum: ["percentage", "fixed"], // Only these two values are allowed
      required: true,
    },

    discountValue: {
      type: Number,
      required: true,
      min: 0, // Discount can't be negative
    },

    minPurchase: {
      type: Number,
      min: 0, // If set, must be a positive number
      default: 0, // Default to 0 means no minimum purchase required
    },

    maxDiscount: {
      type: Number,
      min: 0, // If set, caps how much money the percentage discount can save
      // No default — undefined means no cap applied
    },

    validFrom: {
      type: Date,
      required: true, // Coupon must have a start date
    },

    validUntil: {
      type: Date,
      required: true, // Coupon must have an expiry date
    },

    usageLimit: {
      type: Number,
      required: true,
      min: 1, // At least 1 use must be allowed
    },

    usedCount: {
      type: Number,
      default: 0, // Starts at 0 when the coupon is first created
      min: 0,
    },

    isActive: {
      type: Boolean,
      default: true, // New coupons are active by default
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  },
);

// Export the Coupon model so controllers can use it to query/create/update coupons
export const Coupon = mongoose.model<ICoupon>("Coupon", CouponSchema);

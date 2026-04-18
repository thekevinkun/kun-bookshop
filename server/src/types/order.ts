// Import mongoose tools we need to build the schema
import mongoose, { Document } from "mongoose";

// Define the shape of a single item inside an order
// We snapshot the book data here so if the book changes later, the order still shows what was bought
interface IOrderItem {
  bookId: mongoose.Types.ObjectId; // Reference to the Book document
  title: string; // Snapshot of the book title at time of purchase
  author: string; // Snapshot of the author name at time of purchase
  price: number; // Snapshot of the price the user actually paid
  coverImage: string; // Snapshot of the cover URL for receipts/emails
}

// Define the full shape of an Order document
export interface IOrder extends Document {
  orderNumber: string; // Human-readable ID like 'ORD-20260403-ABC123'
  userId: mongoose.Types.ObjectId; // Which user placed this order
  items: IOrderItem[]; // The books they bought
  subtotal: number; // Total before any discount
  discount: number; // Amount taken off by a coupon (default 0)
  total: number; // Final amount charged
  couponCode?: string; // The coupon code used, if any
  paymentStatus: "pending" | "completed" | "failed" | "refunded"; // Current payment state
  paymentMethod: "stripe"; // Only Stripe for now
  stripePaymentIntentId?: string; // Stripe's payment ID, set after payment completes
  stripeSessionId?: string; // Stripe's checkout session ID, set when session is created
  completedAt?: Date; // When the payment was confirmed
  createdAt: Date;
  updatedAt: Date;
}

// This interface describes the shape of a Coupon document in TypeScript
// It extends Document so mongoose knows it's a MongoDB document
export interface ICoupon extends Document {
  code: string; // The coupon code users type in, e.g. "SAVE20"
  discountType: "percentage" | "fixed"; // Whether discount is % off or flat amount off
  discountValue: number; // How much to discount — e.g. 20 (meaning 20% or $20)
  minPurchase?: number; // Optional: minimum cart total required to use this coupon
  maxDiscount?: number; // Optional: cap on savings for percentage coupons (e.g. max $50 off)
  validFrom: Date; // The coupon becomes usable on this date
  validUntil: Date; // The coupon expires after this date
  usageLimit: number; // How many times total this coupon can be used across all users
  usedCount: number; // How many times it has been used so far (incremented on each valid use)
  isActive: boolean; // Admin can deactivate a coupon without deleting it
  createdAt: Date; // Auto-set by mongoose timestamps option
  updatedAt: Date; // Auto-set by mongoose timestamps option
}

// Define the TypeScript shape of a Download document
// This tells TypeScript what fields to expect on a Download object
export interface IDownload extends Document {
  userId: mongoose.Types.ObjectId; // Which user triggered the download
  bookId: mongoose.Types.ObjectId; // Which book was downloaded
  ipAddress: string; // The user's IP address — for abuse detection
  downloadedAt: Date; // When the download happened
}

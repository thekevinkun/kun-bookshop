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

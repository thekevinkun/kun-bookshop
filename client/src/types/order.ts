// Represents a single item sitting in the shopping cart
export interface ICartItem {
  bookId: string; // The book's MongoDB _id
  title: string; // Book title — shown in the cart drawer
  authorName: string; // Author name — shown in the cart drawer
  price: number; // The actual price (discountPrice if on sale, else price)
  coverImage: string; // Cover URL — shown as thumbnail in the cart
}

export interface Coupon {
  _id: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minPurchase: number;
  maxDiscount?: number;
  validFrom: string;
  validUntil: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface CreateCouponInput {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minPurchase?: number;
  maxDiscount?: number;
  validFrom: string;
  validUntil: string;
  usageLimit: number;
}

// The applied coupon stored in the cart — mirrors what the backend returns on validation
export interface IAppliedCoupon {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  maxDiscount?: number;
  discountAmount: number; // The actual dollar amount saved
  finalTotal: number; // What the user pays after discount
}

// This type describes what the banner needs to display a coupon ad
export interface ActiveCoupon {
  _id: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  maxDiscount?: number;
  minPurchase?: number;
  validUntil: string;
}

// Define the full shape of the cart store — state + actions
export interface CartState {
  items: ICartItem[]; // All items currently in the cart
  appliedCoupon: IAppliedCoupon | null; // null means no coupon applied

  // Actions the UI can call
  addItem: (item: ICartItem) => Promise<void>; // Add a book to the cart
  removeItem: (bookId: string) => Promise<void>; // Remove a book by its ID
  clearCart: () => Promise<void>; // Empty the cart (called after successful checkout)
  loadCart: () => Promise<void>; // Reloads cart items from localStorage for the current user
  applyCoupon: (coupon: IAppliedCoupon) => Promise<void>; // Save validated coupon to store + localStorage
  removeCoupon: () => Promise<void>; // Clear the coupon
  
  isInCart: (bookId: string) => boolean; // Check if a book is already in the cart
  
  // Computed helpers — derived from items array
  total: () => number; // Sum of all item prices
  itemCount: () => number; // How many books are in the cart
}

// Types related to orders and the shopping cart
export interface IOrder {
  _id: string;
  orderNumber: string;
  userId: {
    firstName: string;
    lastName: string;
    email?: string;
  };
  items: ICartItem[];
  subtotal: number;
  discount: number;
  total: number;
  couponCode?: string;
  paymentStatus: "pending" | "completed" | "failed" | "refunded";
  paymentMethod: "stripe";
  stripePaymentIntentId?: string; // Stripe's payment ID, set after payment completes
  stripeSessionId?: string; // Stripe's checkout session ID, set when session is created
  completedAt?: Date; // When the payment was confirmed
  createdAt: Date;
  updatedAt: Date;
}

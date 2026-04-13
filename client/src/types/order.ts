// Represents a single item sitting in the shopping cart
export interface ICartItem {
  bookId: string; // The book's MongoDB _id
  title: string; // Book title — shown in the cart drawer
  author: string; // Author name — shown in the cart drawer
  price: number; // The actual price (discountPrice if on sale, else price)
  coverImage: string; // Cover URL — shown as thumbnail in the cart
}

// Define the full shape of the cart store — state + actions
export interface CartState {
  items: ICartItem[]; // All items currently in the cart

  // Actions the UI can call
  addItem: (item: ICartItem) => void; // Add a book to the cart
  removeItem: (bookId: string) => void; // Remove a book by its ID
  clearCart: () => void; // Empty the cart (called after successful checkout)
  isInCart: (bookId: string) => boolean; // Check if a book is already in the cart
  loadCart: () => void; // Reloads cart items from localStorage for the current user
  
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

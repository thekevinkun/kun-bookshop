// Import Zustand's create function to build the store
import { create } from "zustand";

// Import our cart item type
import type { CartState } from "../types/order";

// Import auth store so we can read the current user's ID for scoping the cart key
import { useAuthStore } from "./auth";

// Helper: get the localStorage key for the current user's cart
// If no user is logged in, we use "guest" as the key
// This means each user gets their own cart slot: "cart-user-abc123", "cart-guest", etc.
const getCartKey = () => {
  const userId = useAuthStore.getState().user?.id ?? "guest";
  return `cart-user-${userId}`;
};

// Helper: load cart items from localStorage for the current user
// Returns an empty array if nothing is stored yet
const loadItems = () => {
  try {
    const stored = localStorage.getItem(getCartKey());
    return stored ? JSON.parse(stored) : [];
  } catch {
    return []; // If JSON is corrupted, start fresh
  }
};

// Helper: save the current cart items to localStorage under the current user's key
const saveItems = (items: CartState["items"]) => {
  localStorage.setItem(getCartKey(), JSON.stringify(items));
};

// Create the Zustand cart store WITHOUT persist middleware
// We handle localStorage manually so we can scope it per user
export const useCartStore = create<CartState>()((set, get) => ({
  // Load items from localStorage on store initialization
  // This replaces what persist middleware was doing automatically
  items: loadItems(),

  // Add a book to the cart — but only if it's not already there
  // We check by bookId to prevent duplicates (digital books are always qty 1)
  addItem: (item) => {
    const alreadyInCart = get().items.some((i) => i.bookId === item.bookId);
    if (alreadyInCart) return; // Silently ignore — book is already in cart
    const newItems = [...get().items, item];
    set({ items: newItems });
    saveItems(newItems); // Persist to localStorage immediately after every change
  },

  // Remove a specific book from the cart by its ID
  removeItem: (bookId) => {
    const newItems = get().items.filter((i) => i.bookId !== bookId);
    set({ items: newItems });
    saveItems(newItems); // Persist to localStorage immediately after every change
  },

  // Clear the entire cart — called after a successful Stripe checkout
  clearCart: () => {
    set({ items: [] });
    saveItems([]); // Wipe this user's cart from localStorage too
  },

  // Load the correct cart from localStorage for the current user
  // Call this right after login or logout so the cart switches to the right user's data
  loadCart: () => {
    set({ items: loadItems() });
  },

  // Returns true if the book with this ID is already in the cart
  // Used by BookCard and the detail page to show "In Cart" state
  isInCart: (bookId) => get().items.some((i) => i.bookId === bookId),

  // Add up all item prices to get the cart total
  total: () => get().items.reduce((sum, item) => sum + item.price, 0),

  // Count how many books are in the cart — shown as badge on cart icon
  itemCount: () => get().items.length,
}));

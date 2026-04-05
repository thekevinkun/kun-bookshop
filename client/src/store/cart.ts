// Import Zustand's create function to build the store
import { create } from "zustand";

// Import persist middleware so the cart survives page refreshes
import { persist } from "zustand/middleware";

// Import our cart item type
import type { CartState } from "../types/order";

// Create the Zustand cart store with persist middleware
// persist saves the cart to localStorage so it survives page refreshes
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      // Start with an empty cart
      items: [],

      // Add a book to the cart — but only if it's not already there
      // We check by bookId to prevent duplicates (digital books are always qty 1)
      addItem: (item) => {
        const alreadyInCart = get().items.some((i) => i.bookId === item.bookId);
        if (alreadyInCart) return; // Silently ignore — book is already in cart
        set((state) => ({ items: [...state.items, item] }));
      },

      // Remove a specific book from the cart by its ID
      removeItem: (bookId) => {
        set((state) => ({
          items: state.items.filter((i) => i.bookId !== bookId),
        }));
      },

      // Clear the entire cart — called after a successful Stripe checkout
      clearCart: () => set({ items: [] }),

      // Returns true if the book with this ID is already in the cart
      // Used by BookCard and the detail page to show "In Cart" state
      isInCart: (bookId) => get().items.some((i) => i.bookId === bookId),

      // Add up all item prices to get the cart total
      total: () => get().items.reduce((sum, item) => sum + item.price, 0),

      // Count how many books are in the cart — shown as badge on cart icon
      itemCount: () => get().items.length,
    }),
    {
      name: "cart-storage", // The localStorage key this cart is saved under
    },
  ),
);

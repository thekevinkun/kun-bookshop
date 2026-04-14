import { create } from "zustand";
import type { CartState, IAppliedCoupon } from "../types/order";
import { useAuthStore } from "./auth";

// Helper: get the localStorage key for the current user's cart items
const getCartKey = () => {
  const userId = useAuthStore.getState().user?.id ?? "guest";
  return `cart-user-${userId}`;
};

// Helper: get the localStorage key for the current user's applied coupon
// Separate key so we can clear items and coupon independently if needed
const getCouponKey = () => {
  const userId = useAuthStore.getState().user?.id ?? "guest";
  return `cart-coupon-${userId}`;
};

// Helper: load cart items from localStorage for the current user
const loadItems = () => {
  try {
    const stored = localStorage.getItem(getCartKey());
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Helper: load the applied coupon from localStorage for the current user
// Returns null if no coupon was previously saved
const loadCoupon = (): IAppliedCoupon | null => {
  try {
    const stored = localStorage.getItem(getCouponKey());
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

// Helper: save items to localStorage
const saveItems = (items: CartState["items"]) => {
  localStorage.setItem(getCartKey(), JSON.stringify(items));
};

// Helper: save the applied coupon to localStorage
// Pass null to remove it
const saveCoupon = (coupon: IAppliedCoupon | null) => {
  if (coupon) {
    localStorage.setItem(getCouponKey(), JSON.stringify(coupon));
  } else {
    localStorage.removeItem(getCouponKey()); // Clean up the key entirely when removed
  }
};

export const useCartStore = create<CartState>()((set, get) => ({
  // Load both items and coupon from localStorage on initialization
  items: loadItems(),
  appliedCoupon: loadCoupon(),

  addItem: (item) => {
    const alreadyInCart = get().items.some((i) => i.bookId === item.bookId);
    if (alreadyInCart) return;
    const newItems = [...get().items, item];
    // Clear the applied coupon — adding a book changes the cart total, making
    // the previously calculated discountAmount and finalTotal stale and wrong
    set({ items: newItems, appliedCoupon: null });
    saveItems(newItems);
    saveCoupon(null);
  },

  removeItem: (bookId) => {
    const newItems = get().items.filter((i) => i.bookId !== bookId);
    set({ items: newItems });
    saveItems(newItems);
    // If the cart changes, the coupon discount may no longer be valid
    // Clear it so the user has to re-apply — prevents stale discount amounts
    set({ appliedCoupon: null });
    saveCoupon(null);
  },

  clearCart: () => {
    // Clear both items and coupon on successful checkout
    set({ items: [], appliedCoupon: null });
    saveItems([]);
    saveCoupon(null);
  },

  loadCart: () => {
    // Reload both items and coupon when switching users
    set({ items: loadItems(), appliedCoupon: loadCoupon() });
  },

  isInCart: (bookId) => get().items.some((i) => i.bookId === bookId),

  // Save the validated coupon — called by CartDrawer after a successful validation response
  applyCoupon: (coupon) => {
    set({ appliedCoupon: coupon });
    saveCoupon(coupon);
  },

  // Clear the coupon — called when user clicks the remove coupon button
  removeCoupon: () => {
    set({ appliedCoupon: null });
    saveCoupon(null);
  },

  // Use finalTotal from the applied coupon if one exists, otherwise sum raw item prices
  total: () => {
    const { items, appliedCoupon } = get();
    if (appliedCoupon) return appliedCoupon.finalTotal;
    return items.reduce((sum, item) => sum + item.price, 0);
  },

  itemCount: () => get().items.length,
}));

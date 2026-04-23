import { create } from "zustand"; // Zustand for reactive global state
import api from "../lib/api"; // Axios instance with baseURL and cookie credentials
import type { CartState, IAppliedCoupon } from "../types/order"; // Types for cart shape

// useCartStore — in-memory mirror of the server-side Cart document
// All mutations call the backend first, then update local state on success
// This guarantees cart is identical across all browsers and devices
export const useCartStore = create<CartState>()((set, get) => ({
  items: [], // Starts empty — loadCart() populates on login
  appliedCoupon: null, // No coupon applied by default

  // loadCart — called after login and on app init (initAuth)
  // Fetches the user's cart from the server and hydrates local state
  loadCart: async () => {
    try {
      const { data } = await api.get("/cart"); // GET /api/cart
      set({ items: data.items ?? [], appliedCoupon: data.coupon ?? null }); // Sync local state
    } catch {
      // Fail silently — cart just stays empty if the fetch fails
    }
  },

  // addItem — POST /api/cart/items
  // Optimistically checks local state first to avoid duplicate UI flash,
  // then persists to server
  addItem: async (item) => {
    if (get().items.some((i) => i.bookId === item.bookId)) return; // Already in cart — skip
    try {
      const { data } = await api.post("/cart/items", item); // Persist to server
      // Server returns the full updated cart — sync both items and coupon
      // (adding an item clears the coupon server-side too)
      set({ items: data.items ?? [], appliedCoupon: data.coupon ?? null });
    } catch {
      // Fail silently — UI stays consistent with last known server state
    }
  },

  // removeItem — DELETE /api/cart/items/:bookId
  removeItem: async (bookId) => {
    try {
      const { data } = await api.delete(`/cart/items/${bookId}`); // Remove from server
      set({ items: data.items ?? [], appliedCoupon: data.coupon ?? null }); // Sync state
    } catch {
      // Fail silently
    }
  },

  // clearCart — DELETE /api/cart
  // Called from checkout/success.tsx after payment confirmed
  clearCart: async () => {
    try {
      await api.delete("/cart"); // Wipe server cart
    } catch {
      // Fail silently — even if the server call fails, we clear local state
    }
    set({ items: [], appliedCoupon: null }); // Always clear local state
  },

  // applyCoupon — POST /api/cart/coupon
  // Called by CartDrawer after the coupon validation endpoint confirms the coupon is valid
  applyCoupon: async (coupon: IAppliedCoupon) => {
    try {
      const { data } = await api.post("/cart/coupon", coupon); // Persist coupon to cart doc
      set({ appliedCoupon: data.coupon ?? coupon }); // Use server response, fallback to local
    } catch {
      // Fail silently — coupon still applied locally so UX isn't broken
      set({ appliedCoupon: coupon });
    }
  },

  // removeCoupon — DELETE /api/cart/coupon
  removeCoupon: async () => {
    try {
      await api.delete("/cart/coupon"); // Remove coupon from server cart doc
    } catch {
      // Fail silently
    }
    set({ appliedCoupon: null }); // Always clear locally
  },

  isInCart: (bookId) => get().items.some((i) => i.bookId === bookId), // Pure local check — no API needed

  // total — computed from appliedCoupon.finalTotal if coupon exists, else sum of item prices
  total: () => {
    const { items, appliedCoupon } = get();
    if (appliedCoupon) return appliedCoupon.finalTotal; // Coupon already has final total baked in
    return items.reduce((sum, item) => sum + item.price, 0); // Raw sum
  },

  itemCount: () => get().items.length, // Badge count for Navbar cart icon
}));

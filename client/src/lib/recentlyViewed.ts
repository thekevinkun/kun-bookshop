import type { IBook } from "../types/book";
import { useAuthStore } from "../store/auth";

// Maximum number of books we store — keeps localStorage lean
const MAX_ITEMS = 10;

// Derive a per-user storage key — same pattern as cart.ts getCartKey()
// Guest users share a single "guest" key, logged-in users each get their own
const getStorageKey = () => {
  const userId = useAuthStore.getState().user?.id ?? "guest";
  return `recently-viewed-${userId}`;
};

// Read the current list from localStorage for the current user
export const getRecentlyViewed = (): IBook[] => {
  try {
    const raw = localStorage.getItem(getStorageKey());
    if (!raw) return [];
    return JSON.parse(raw) as IBook[];
  } catch {
    return [];
  }
};

// Add a book to the recently viewed list for the current user
// Deduplicates, keeps newest first, caps at MAX_ITEMS
export const addRecentlyViewed = (book: IBook): void => {
  try {
    const current = getRecentlyViewed();
    // Remove this book if it already exists — re-add it at the front
    const filtered = current.filter((b) => b._id !== book._id);
    const updated = [book, ...filtered].slice(0, MAX_ITEMS);
    localStorage.setItem(getStorageKey(), JSON.stringify(updated));
  } catch {
    // localStorage might be full or disabled — fail silently
  }
};

// Clear the recently viewed list for the current user only
export const clearRecentlyViewed = (): void => {
  localStorage.removeItem(getStorageKey());
};

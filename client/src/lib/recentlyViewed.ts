import type { IBook } from "../types/book";

// Maximum number of books we store — keeps localStorage lean
const MAX_ITEMS = 10;

// The key we use in localStorage to store the list
const STORAGE_KEY = "kun_recently_viewed";

// Read the current list from localStorage
// Returns an empty array if nothing is stored yet or if parsing fails
export const getRecentlyViewed = (): IBook[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    // If nothing stored yet, return an empty array
    if (!raw) return [];
    // Parse the JSON string back into an array of books
    return JSON.parse(raw) as IBook[];
  } catch {
    // If localStorage is corrupted or unavailable, fail silently
    return [];
  }
};

// Add a book to the recently viewed list
// Deduplicates, keeps newest first, caps at MAX_ITEMS
export const addRecentlyViewed = (book: IBook): void => {
  try {
    const current = getRecentlyViewed();

    // Remove this book if it already exists — we'll re-add it at the front
    // This keeps the list sorted by most recent visit
    const filtered = current.filter((b) => b._id !== book._id);

    // Add the new book at the front, then cap the list length
    const updated = [book, ...filtered].slice(0, MAX_ITEMS);

    // Persist back to localStorage as a JSON string
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // localStorage might be full or disabled — fail silently, never crash the app
  }
};

// Clear the entire recently viewed list
// Useful for testing or if you want a "clear history" button later
export const clearRecentlyViewed = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

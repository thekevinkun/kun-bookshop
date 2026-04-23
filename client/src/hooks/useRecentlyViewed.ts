import { useState, useCallback, useEffect, useRef } from "react";
import api from "../lib/api";
import { useAuthStore } from "../store/auth";
import type { IBook } from "../types/book";

// localStorage helpers (guests only)
const MAX_ITEMS = 10;
const GUEST_KEY = "recently-viewed-guest";

const getGuestList = (): IBook[] => {
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    return raw ? (JSON.parse(raw) as IBook[]) : [];
  } catch {
    // Fail silently — this is a non-critical feature
    return [];
  }
};

const saveGuestList = (books: IBook[]): void => {
  try {
    localStorage.setItem(GUEST_KEY, JSON.stringify(books));
  } catch {
    // Fail silently — this is a non-critical feature
  }
};

// Shared refresh trigger
// A simple counter stored outside React — incrementing it tells
// useFetchRecentlyViewed to re-fetch without any prop drilling or context
let refreshCounter = 0;
const refreshListeners: Array<() => void> = [];

// Call this to tell all useFetchRecentlyViewed instances to re-fetch
const triggerRefresh = () => {
  refreshCounter++;
  refreshListeners.forEach((fn) => fn()); // Notify every mounted listener
};

// useRecentlyViewed — write hook (used in books/[id].tsx)
interface UseRecentlyViewedReturn {
  books: IBook[]; // Guest list only — logged-in users read from useFetchRecentlyViewed
  addRecentlyViewed: (book: IBook) => Promise<void>;
}

export const useRecentlyViewed = (): UseRecentlyViewedReturn => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const inFlightRef = useRef<string | null>(null); // Tracks which bookId is currently being saved

  const [books, setBooks] = useState<IBook[]>(() =>
    isAuthenticated ? [] : getGuestList(),
  );

  const addRecentlyViewed = useCallback(
    async (book: IBook): Promise<void> => {
      if (isAuthenticated) {
        // Guard: if this exact bookId is already being sent, skip the duplicate call
        if (inFlightRef.current === book._id) return;
        inFlightRef.current = book._id; // Mark this bookId as in-flight

        try {
          await api.post(`/recently-viewed/${book._id}`);
          triggerRefresh();
        } catch {
          // Fail silently — this is a non-critical feature
        } finally {
          inFlightRef.current = null; // Clear the guard when done
        }
      } else {
        const current = getGuestList();
        const filtered = current.filter((b) => b._id !== book._id);
        const updated = [book, ...filtered].slice(0, MAX_ITEMS);
        saveGuestList(updated);
        setBooks(updated);
      }
    },
    [isAuthenticated],
  );

  return { books, addRecentlyViewed };
};

// useFetchRecentlyViewed — read hook (used in RecentlyViewedSection)

export const useFetchRecentlyViewed = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const [books, setBooks] = useState<IBook[]>([]);
  // isFetched tracks whether the first fetch has completed — drives isLoading
  const [isFetched, setIsFetched] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const handler = () => setTick((t) => t + 1);
    refreshListeners.push(handler);
    return () => {
      const idx = refreshListeners.indexOf(handler);
      if (idx !== -1) refreshListeners.splice(idx, 1);
    };
  }, []);

  useEffect(() => {
    if (!isHydrated || !isAuthenticated) return;

    api
      .get("/recently-viewed")
      .then(({ data }) => setBooks(data.books ?? []))
      .catch(() => {})
      .finally(() => setIsFetched(true)); // Mark done after first fetch — no more skeleton
  }, [isHydrated, isAuthenticated, tick]);

  // isLoading is true only while authenticated and the first fetch hasn't completed yet
  // After isFetched is true, subsequent tick re-fetches don't show the skeleton again
  const isLoading = isAuthenticated && !isFetched;

  return { books, isLoading };
};

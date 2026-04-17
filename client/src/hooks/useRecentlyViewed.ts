import { useState } from "react"; // no useEffect needed
import { getRecentlyViewed } from "../lib/recentlyViewed";
import type { IBook } from "../types/book";

// Returns the recently viewed list from localStorage
// useState lazy initializer runs once on mount — synchronous, no effect needed
export const useRecentlyViewed = (): IBook[] => {
  // The () => getRecentlyViewed() form runs only on first render, not every re-render
  const [books] = useState<IBook[]>(() => getRecentlyViewed());

  return books;
};

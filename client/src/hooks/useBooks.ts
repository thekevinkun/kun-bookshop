import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";
import type { IBook, BookFilters, PaginatedBooks } from "../types/book";

// --- QUERY KEYS ---
// Centralizing query keys prevents typos and makes cache invalidation reliable
// React Query uses these to identify and cache each unique request
export const bookKeys = {
  all: ["books"] as const,
  lists: () => [...bookKeys.all, "list"] as const,
  list: (filters: BookFilters) => [...bookKeys.lists(), filters] as const,
  featured: () => [...bookKeys.all, "featured"] as const,
  detail: (id: string) => [...bookKeys.all, "detail", id] as const,
  category: (category: string) =>
    [...bookKeys.all, "category", category] as const,
  autocomplete: (q: string) => [...bookKeys.all, "autocomplete", q] as const,
};

// --- useBooks ---
// Fetches the paginated, filtered book catalog
// Used on the /books catalog page
export const useBooks = (filters: BookFilters = {}) => {
  return useQuery({
    // Each unique set of filters gets its own cache entry
    queryKey: bookKeys.list(filters),

    queryFn: async (): Promise<PaginatedBooks> => {
      // Convert the filters object into URL query params
      // e.g. { page: 2, category: 'Fiction' } → ?page=2&category=Fiction
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, String(value));
        }
      });

      const { data } = await api.get(`/books?${params.toString()}`);
      return data;
    },

    // Keep previous page data visible while the next page loads
    // This prevents the catalog from flashing blank between page changes
    placeholderData: (previousData) => previousData,

    // Book catalog data is fresh for 3 minutes before refetching
    staleTime: 3 * 60 * 1000,
  });
};

// --- useFeaturedBooks ---
// Fetches up to 8 featured books for the homepage carousel
export const useFeaturedBooks = () => {
  return useQuery({
    queryKey: bookKeys.featured(),

    queryFn: async (): Promise<IBook[]> => {
      const { data } = await api.get("/books/featured");
      return data.books;
    },

    // Featured books change rarely — cache for 10 minutes
    staleTime: 10 * 60 * 1000,
  });
};

// --- useBook ---
// Fetches a single book by ID for the detail page
export const useBook = (id: string) => {
  return useQuery({
    queryKey: bookKeys.detail(id),

    queryFn: async (): Promise<IBook> => {
      const { data } = await api.get(`/books/${id}`);
      return data.book;
    },

    // Only run this query if we actually have an id
    // Prevents firing on initial render before the param is available
    enabled: !!id,

    staleTime: 5 * 60 * 1000,
  });
};

// Fetches the list of distinct categories that exist in the database
// Used by BookFiltersComponent to show only real categories — not a hardcoded list
export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      // GET /api/books/categories — returns { categories: string[] }
      const { data } = await api.get("/books/categories");
      return data.categories as string[]; // Flat sorted array of category strings
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes — categories don't change often
  });
};

// --- useBooksByCategory ---
// Fetches books filtered by a single category
export const useBooksByCategory = (category: string) => {
  return useQuery({
    queryKey: bookKeys.category(category),

    queryFn: async (): Promise<IBook[]> => {
      const { data } = await api.get(`/books/category/${category}`);
      return data.books;
    },

    // Only run if we have a category string
    enabled: !!category,

    staleTime: 5 * 60 * 1000,
  });
};

// --- useAutocomplete ---
// Fetches search suggestions as the user types in the search bar
export const useAutocomplete = (q: string) => {
  return useQuery({
    queryKey: bookKeys.autocomplete(q),

    queryFn: async (): Promise<IBook[]> => {
      const { data } = await api.get(`/books/search/autocomplete?q=${q}`);
      return data.suggestions;
    },

    // Only search when the user has typed at least 2 characters
    enabled: q.trim().length >= 2,

    // Suggestions can go stale quickly — 1 minute is enough
    staleTime: 60 * 1000,
  });
};

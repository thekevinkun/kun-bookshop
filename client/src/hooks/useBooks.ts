import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../store/auth";
import api from "../lib/api";
import type { IBook, BookFilters, PaginatedBooks } from "../types/book";

// QUERY KEYS
// Centralizing query keys prevents typos and makes cache invalidation reliable
// React Query uses these to identify and cache each unique request
export const bookKeys = {
  all: ["books"] as const,
  lists: () => [...bookKeys.all, "list"] as const,
  list: (filters: BookFilters) => [...bookKeys.lists(), filters] as const,
  featured: () => [...bookKeys.all, "featured"] as const,
  detail: (id: string) => [...bookKeys.all, "detail", id] as const,
  similar: (id: string) => [...bookKeys.all, "similar", id] as const,
  category: (category: string) =>
    [...bookKeys.all, "category", category] as const,
  autocomplete: (q: string) => [...bookKeys.all, "autocomplete", q] as const,
};

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

// Fetches up to 8 featured books for the homepage carousel
export const useFeaturedBooks = () => {
  return useQuery({
    queryKey: bookKeys.featured(),

    queryFn: async (): Promise<IBook[]> => {
      const { data } = await api.get("/books/featured");
      return data.books;
    },

    // 3 minutes — purchase counts change, hero should stay fresh
    staleTime: 3 * 60 * 1000,
  });
};

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

// Fetches homepage discovery books.
// Guests receive fallback picks; logged-in users get personalised results when available.
export const useRecommendations = () => {
  // Read both the user and the hydration flag from the auth store
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  return useQuery({
    // Include the userId in the key so a logged-in user never gets a cached
    // guest result, and logging out immediately triggers a fresh fetch
    queryKey: ["recommendations", user?.id ?? "guest"],
    queryFn: async (): Promise<{ books: IBook[]; personalised: boolean }> => {
      const res = await api.get("/books/recommendations");
      return res.data;
    },
    // Don't fire AT ALL until Zustand has finished reading from localStorage.
    // This guarantees the access token is attached to the request before
    // the first fetch, so the backend sees the real user on first load.
    enabled: isHydrated,
    staleTime: 5 * 60 * 1000,
  });
};

// Fetches books that share meaningful categories with the current book
export const useSimilarBooks = (id: string) => {
  return useQuery({
    // This keeps the similar-books cache separate per book detail page.
    queryKey: bookKeys.similar(id),

    queryFn: async (): Promise<IBook[]> => {
      // The server decides which categories are meaningful for matching.
      const { data } = await api.get(`/books/${id}/similar`);
      return data.books;
    },

    // This avoids firing the request before the route param exists.
    enabled: !!id,

    // Similar books do not change often, so a short cache is fine.
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

// useBookPreview — fetches the signed preview URL for a specific book
// bookId is optional because we only fetch when the user opens the preview modal
export const useBookPreview = (bookId: string | null) => {
  // Wait for initAuth before firing — token may not be validated yet during hydration
  const isHydrated = useAuthStore((s) => s.isHydrated);

  return useQuery({
    queryKey: ["bookPreview", bookId],
    queryFn: async () => {
      const response = await api.get(`/books/${bookId}/preview`);
      return response.data as { previewUrl: string; previewPages: number };
    },
    enabled: isHydrated && !!bookId, // Add isHydrated, keep the existing !!bookId guard
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
};

// useBookRead — fetches the full-access signed URL for an owned book
// Only fires when the user opens the reader modal (bookId is non-null)
// Returns readUrl + fileType — no previewPages, so frontend knows there's no cap
export const useBookRead = (bookId: string | null) => {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ["bookRead", bookId],
    queryFn: async () => {
      const response = await api.get(`/books/${bookId}/read`);
      // Returns { readUrl: string, fileType: "pdf" | "epub" }
      return response.data as { readUrl: string; fileType: "pdf" | "epub" };
    },
    // Only fire when hydrated, authenticated, and a bookId is provided
    enabled: isHydrated && isAuthenticated && !!bookId,
    staleTime: 45 * 60 * 1000, // 45 min — under the 1hr Cloudinary expiry
    retry: false,
  });
};

// useAdminBooks — paginated book list for the admin dashboard
// Separate from useBooks (the public catalog) because it needs different defaults:
// - higher limit per page (20 rows in a table vs 12 cards in a grid)
// - sorted by purchaseCount so the most-sold books appear first
// - no isActive filter — admin needs to see soft-deleted books too (future-proofing)
export const useAdminBooks = (page = 1, search = "") => {
  return useQuery({
    // Include page and search in the key so each combination gets its own cache entry
    queryKey: ["books", "admin", page, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20", // 20 rows per page — readable without excessive scrolling
        sortBy: "purchaseCount",
        sortOrder: "desc",
      });
      if (search) params.set("search", search); // Only append if non-empty

      const { data } = await api.get(`/books?${params}`);
      return data; // { books, total, totalPages, currentPage }
    },
    placeholderData: (prev) => prev, // Keep previous page visible while next page loads
    staleTime: 2 * 60 * 1000, // 2 minutes — same as useAuthors
  });
};

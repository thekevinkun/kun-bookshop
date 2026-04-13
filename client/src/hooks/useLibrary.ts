// Import the React Query hooks we need for fetching and mutating data
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Import our pre-configured Axios instance so all requests include auth cookies
import api from "../lib/api";

// Query Key Constants
// Centralizing query keys prevents typos and makes cache invalidation reliable
// If we change a key here, it updates everywhere automatically
const LIBRARY_KEY = ["library"] as const; // Key for the user's purchased books
const WISHLIST_KEY = ["wishlist"] as const; // Key for the user's wishlisted books
const DOWNLOADS_KEY = ["downloadHistory"] as const; // Key for the user's download history

// useLibrary
// Fetches the logged-in user's purchased books from GET /api/users/library
// Use this on the library page to display all owned books
export const useLibrary = (enabled = true) => {
  return useQuery({
    queryKey: LIBRARY_KEY, // Cache this data under the 'library' key
    queryFn: async () => {
      // Call our backend library endpoint
      const { data } = await api.get("/users/library");
      // Return the library array — this becomes the 'data' property in the component
      return data.library;
    },
    enabled,
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes — library doesn't change often
  });
};

// useWishlist
// Fetches the logged-in user's wishlisted books from GET /api/users/wishlist
export const useWishlist = (enabled = true) => {
  return useQuery({
    queryKey: WISHLIST_KEY,
    queryFn: async () => {
      const { data } = await api.get("/users/wishlist");
      return data.wishlist;
    },
    enabled,
    staleTime: 1000 * 60 * 5, // Fresh for 5 minutes
  });
};

// useDownloadHistory
// Fetches the logged-in user's download history from GET /api/downloads/history
export const useDownloadHistory = () => {
  return useQuery({
    queryKey: DOWNLOADS_KEY,
    queryFn: async () => {
      const { data } = await api.get("/downloads/history");
      return data.downloads;
    },
    staleTime: 1000 * 60 * 2, // Fresh for 2 minutes — more likely to change than library
  });
};

// useDownloadBook
// Mutation that hits POST /api/downloads/book/:bookId and gets back a signed URL
// Then automatically triggers a browser download using that URL
export const useDownloadBook = () => {
  // Get the query client so we can invalidate the download history cache after a download
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookId,
      title,
      fileType,
    }: {
      bookId: string; // The book's MongoDB ID — used to request the signed URL
      title: string; // The book's title — used to build a clean filename
      fileType: string; // "pdf" or "epub" — used as the file extension
    }) => {
      // Request a signed Cloudinary URL for this book from our backend
      // The backend checks ownership and rate limit before responding
      const { data } = await api.post(`/downloads/book/${bookId}`);
      // Return the signed URL AND the filename info so onSuccess can use them
      return { url: data.url as string, title, fileType };
    },

    onSuccess: async ({ url, title, fileType }) => {
      // Build a clean filename from the book title
      // e.g. "Days at the Morisaki Bookshop: A Novel" → "days_at_the_morisaki_bookshop_a_novel.epub"
      const filename =
        title
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, "") // Remove special characters
          .trim()
          .replace(/\s+/g, "_") + // Replace spaces with underscores
        `.${fileType}`;

      // Fetch the file from Cloudinary as a raw blob
      // We do this because link.download is ignored for cross-origin URLs
      // By fetching it first and creating a local blob URL, the browser treats it as same-origin
      const response = await fetch(url);
      const blob = await response.blob();

      // Create a temporary local URL pointing to the blob in memory
      const blobUrl = URL.createObjectURL(blob);

      // Create a temporary invisible <a> element to trigger the download
      const link = document.createElement("a");
      link.href = blobUrl; // Local blob URL — same-origin so download attribute works
      link.download = filename; // Browser will respect this filename now
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Release the blob URL from memory — we no longer need it after the click
      URL.revokeObjectURL(blobUrl);

      // Invalidate the download history cache so the new download appears right away
      queryClient.invalidateQueries({ queryKey: DOWNLOADS_KEY });
    },
  });
};

// useAddToWishlist
// Mutation that adds a book to the wishlist via POST /api/users/wishlist/:bookId
export const useAddToWishlist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookId: string) => {
      // Send the request to add this book to the wishlist
      const { data } = await api.post(`/users/wishlist/${bookId}`);
      return data;
    },

    onSuccess: () => {
      // Invalidate the wishlist cache so the UI reflects the new addition immediately
      queryClient.invalidateQueries({ queryKey: WISHLIST_KEY });
    },
  });
};

// useRemoveFromWishlist
// Mutation that removes a book from the wishlist via DELETE /api/users/wishlist/:bookId
export const useRemoveFromWishlist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookId: string) => {
      // Send the delete request to remove this book from the wishlist
      const { data } = await api.delete(`/users/wishlist/${bookId}`);
      return data;
    },

    onSuccess: () => {
      // Invalidate the wishlist cache so the removed book disappears immediately
      queryClient.invalidateQueries({ queryKey: WISHLIST_KEY });
    },
  });
};

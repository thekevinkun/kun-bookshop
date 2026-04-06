// Import the React Query hooks we need for fetching and mutating data
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Import our pre-configured Axios instance so all requests include auth cookies
import api from "../lib/api";

// --- Query Key Constants ---
// Centralizing query keys prevents typos and makes cache invalidation reliable
// If we change a key here, it updates everywhere automatically
const LIBRARY_KEY = ["library"] as const; // Key for the user's purchased books
const WISHLIST_KEY = ["wishlist"] as const; // Key for the user's wishlisted books
const DOWNLOADS_KEY = ["downloadHistory"] as const; // Key for the user's download history

// --- useLibrary ---
// Fetches the logged-in user's purchased books from GET /api/users/library
// Use this on the library page to display all owned books
export const useLibrary = () => {
  return useQuery({
    queryKey: LIBRARY_KEY, // Cache this data under the 'library' key
    queryFn: async () => {
      // Call our backend library endpoint
      const { data } = await api.get("/users/library");
      // Return the library array — this becomes the 'data' property in the component
      return data.library;
    },
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes — library doesn't change often
  });
};

// --- useWishlist ---
// Fetches the logged-in user's wishlisted books from GET /api/users/wishlist
export const useWishlist = () => {
  return useQuery({
    queryKey: WISHLIST_KEY,
    queryFn: async () => {
      const { data } = await api.get("/users/wishlist");
      return data.wishlist;
    },
    staleTime: 1000 * 60 * 5, // Fresh for 5 minutes
  });
};

// --- useDownloadHistory ---
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

// --- useDownloadBook ---
// Mutation that hits POST /api/downloads/book/:bookId and gets back a signed URL
// Then automatically triggers a browser download using that URL
export const useDownloadBook = () => {
  // Get the query client so we can invalidate the download history cache after a download
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookId: string) => {
      // Request a signed Cloudinary URL for this book from our backend
      // The backend checks ownership and rate limit before responding
      const { data } = await api.post(`/downloads/book/${bookId}`);
      // Return the signed URL so onSuccess can use it
      return data.url as string;
    },

    onSuccess: (signedUrl) => {
      // Create a temporary invisible <a> element to trigger the browser download
      // This is the standard way to programmatically download a file in the browser
      const link = document.createElement("a");
      link.href = signedUrl; // Point it at the signed Cloudinary URL
      link.target = "_blank"; // Open in new tab — handles cross-origin download URLs
      link.rel = "noopener noreferrer"; // Security: prevents the new tab from accessing our page
      document.body.appendChild(link); // Must be in the DOM for Firefox to trigger the click
      link.click(); // Programmatically click to start the download
      document.body.removeChild(link); // Clean up — remove the element immediately after clicking

      // Invalidate the download history cache so the new download appears right away
      queryClient.invalidateQueries({ queryKey: DOWNLOADS_KEY });
    },
  });
};

// --- useAddToWishlist ---
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

// --- useRemoveFromWishlist ---
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

// Import React and the useState hook for managing local UI state (e.g. which book is downloading)
import { useState } from "react";

// Import useNavigate so we can redirect unauthenticated users to login
import { useNavigate } from "react-router-dom";

// Import our React Query hooks for fetching the library and triggering downloads
import { useLibrary, useDownloadBook } from "../../hooks/useLibrary";

// Import the auth store so we can check if the user is logged in
import { useAuthStore } from "../../store/auth";

// Import icons from lucide-react for the UI
import {
  BookOpen, // Used for the empty state illustration
  Download, // Used on the download button
  Loader2, // Spinning loader shown while downloading
  AlertCircle, // Used for the error state
} from "lucide-react";

import type { IBook } from "../../types/book"; // Import the IBook type for type-checking the library data

// The main Library page component
export default function LibraryPage() {
  // Get the logged-in user from the auth store
  const { user } = useAuthStore();

  // Hook for navigation — used to redirect to login if not authenticated
  const navigate = useNavigate();

  // Fetch the user's purchased books from the backend
  const { data: library, isLoading, isError } = useLibrary();

  // The download mutation — gives us a mutate function and loading state
  const { mutate: downloadBook, isPending: isDownloading } = useDownloadBook();

  // Track WHICH book is currently being downloaded so we can show a spinner on that specific card
  // We store the bookId string so we can compare it in the card render
  const [downloadingBookId, setDownloadingBookId] = useState<string | null>(
    null,
  );

  // If the user is not logged in, redirect them to the login page
  // This is a client-side guard — the backend also enforces auth via the authenticate middleware
  if (!user) {
    navigate("/login");
    return null; // Return null so nothing renders while the navigation happens
  }

  // --- Handle Download Click ---
  const handleDownload = (bookId: string) => {
    // Mark this specific book as downloading so its card shows a spinner
    setDownloadingBookId(bookId);

    // Trigger the download mutation
    downloadBook(bookId, {
      onSettled: () => {
        // Clear the downloading state whether the download succeeded or failed
        setDownloadingBookId(null);
      },
    });
  };

  // --- Loading State ---
  if (isLoading) {
    return (
      // Full-page centered spinner while we wait for the library to load
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-teal-400" size={40} />
      </div>
    );
  }

  // --- Error State ---
  if (isError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
        {/* Error icon */}
        <AlertCircle className="text-red-400" size={48} />
        <h2 className="text-xl font-semibold text-white">
          Failed to load your library
        </h2>
        <p className="text-gray-400">
          Something went wrong. Please refresh the page and try again.
        </p>
      </div>
    );
  }

  // --- Empty State ---
  // The user is logged in and the request succeeded but they haven't bought anything yet
  if (!library || library.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 text-center px-4">
        {/* Empty state icon */}
        <BookOpen className="text-teal-400 opacity-50" size={64} />
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Your library is empty
          </h2>
          <p className="text-gray-400">
            Books you purchase will appear here, ready to download anytime.
          </p>
        </div>
        {/* CTA to go browse books */}
        <button
          onClick={() => navigate("/books")}
          className="btn-primary" // Reusing our global btn-primary class from globals.css
        >
          Browse Books
        </button>
      </div>
    );
  }

  // --- Library Grid ---
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Page header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white">My Library</h1>
          <p className="text-gray-400 mt-1">
            {/* Show how many books they own */}
            {library.length} {library.length === 1 ? "book" : "books"} in your
            collection
          </p>
        </div>

        {/* Books grid — responsive: 1 col on mobile, 2 on tablet, 3 on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {library.map((book: IBook) => {
            // Check if THIS specific book is currently being downloaded
            const isThisDownloading = downloadingBookId === book._id;

            return (
              <div
                key={book._id}
                // Card styling — dark surface matching our design system
                className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col hover:border-teal-500/40 transition-colors duration-200"
              >
                {/* Book cover image */}
                <div className="aspect-[3/4] overflow-hidden bg-white/5">
                  <img
                    src={book.coverImage}
                    alt={`Cover of ${book.title}`}
                    // Cover fills the container, cropped to fit — same pattern as BookCard
                    className="w-full h-full object-cover"
                    // Fallback if the image fails to load
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "/placeholder-cover.jpg";
                    }}
                  />
                </div>

                {/* Card body */}
                <div className="p-4 flex flex-col flex-1">
                  {/* Book title */}
                  <h3 className="text-white font-semibold text-sm leading-snug line-clamp-2 mb-1">
                    {book.title}
                  </h3>

                  {/* Author name — using the denormalized authorName field, NOT book.author ObjectId */}
                  <p className="text-gray-400 text-xs mb-3">
                    {book.authorName}
                  </p>

                  {/* File type badge — shows PDF or EPUB */}
                  <span className="text-xs text-teal-400 uppercase font-medium tracking-wide mb-4">
                    {book.fileType}
                  </span>

                  {/* Spacer pushes the download button to the bottom of the card */}
                  <div className="flex-1" />

                  {/* Download button */}
                  <button
                    onClick={() => handleDownload(book._id)}
                    // Disable the button while any download is in progress to prevent double-clicks
                    disabled={isDownloading}
                    className="btn-primary w-full flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isThisDownloading ? (
                      // Show spinner only on the card that is actively downloading
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        Preparing...
                      </>
                    ) : (
                      // Default state — download icon + label
                      <>
                        <Download size={15} />
                        Download
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

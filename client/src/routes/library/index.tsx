// Import React and the useState hook for managing local UI state (e.g. which book is downloading)
import { useState } from "react";

// Import useNavigate so we can redirect unauthenticated users to login
import { useNavigate, Link } from "react-router-dom";

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

import SEO from "../../components/common/SEO";
import { toast } from "sonner";

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

  // Handle Download Click
  const handleDownload = (bookId: string, title: string, fileType: string) => {
    // Mark this specific book as downloading so its card shows a spinner
    setDownloadingBookId(bookId);

    // Trigger the download mutation — pass title and fileType so we can build a clean filename
    downloadBook(
      { bookId, title, fileType },
      {
        onSettled: () => {
          // Clear the downloading state whether the download succeeded or failed
          setDownloadingBookId(null);
        },
        onError: (error: unknown) => {
          // Extract the error message from the server response
          // The rate limiter returns { error: "Download limit reached..." } as the body
          const message =
            (error as { response?: { data?: { error?: string } } }).response
              ?.data?.error ?? "Download failed. Please try again.";

          // Show a toast notification so the user knows what happened
          toast.error(message);
        },
      },
    );
  };

  // Loading State
  if (isLoading) {
    return (
      // Full-page centered spinner while we wait for the library to load
      <div className="container-page min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-golden/75" size={40} />
      </div>
    );
  }

  // Error State
  if (isError) {
    return (
      <div className="container-page min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
        {/* Error icon */}
        <AlertCircle className="text-red-400" size={48} />
        <h2 className="text-xl font-semibold text-text-light">
          Failed to load your library
        </h2>
        <p className="text-text-muted">
          Something went wrong. Please refresh the page and try again.
        </p>
      </div>
    );
  }

  // Empty State
  // The user is logged in and the request succeeded but they haven't bought anything yet
  // Empty State
  if (!library || library.length === 0) {
    return (
      <>
        <SEO
          title="My Library"
          description="Your purchased books, ready to read and download anytime."
          url="/library"
          noIndex={true}
        />
        <div className="min-h-screen bg-bg-dark flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center flex flex-col items-center gap-6">
            {/* Illustrated stack of books — pure CSS, no images needed */}
            <div className="relative w-32 h-40 mx-auto">
              {/* Back book — rotated right */}
              <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2
              w-24 h-32 rounded-lg bg-ocean/60 border border-white/10
              rotate-[10deg] translate-x-3"
              />
              {/* Middle book — rotated left */}
              <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2
              w-24 h-32 rounded-lg bg-ocean/80 border border-white/10
              -rotate-[6deg] -translate-x-2"
              />
              {/* Front book — straight, golden spine accent */}
              <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2
              w-24 h-32 rounded-lg bg-card border border-white/10
              flex flex-col overflow-hidden shadow-xl"
              >
                {/* Spine color bar at top — mimics a book cover design */}
                <div className="h-2 bg-golden/70 w-full" />
                {/* Book open icon centered on front cover */}
                <div className="flex-1 flex items-center justify-center">
                  <BookOpen size={28} className="text-golden/40" />
                </div>
              </div>
            </div>

            {/* Heading + subtext */}
            <div className="flex flex-col gap-2">
              <h2 className="text-text-light text-2xl font-bold">
                Your library is empty
              </h2>
              <p className="text-text-muted text-sm leading-relaxed">
                Books you purchase appear here instantly — no waiting, no
                shipping. Download and read them anytime.
              </p>
            </div>

            {/* Value props — three quick reasons to buy */}
            <div className="w-full flex flex-col gap-2 text-left">
              {[
                { icon: "⚡", text: "Instant access after purchase" },
                { icon: "📥", text: "Download PDF or EPUB anytime" },
                { icon: "♾️", text: "Yours forever — no subscription" },
              ].map(({ icon, text }) => (
                <div
                  key={text}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl
                  bg-white/5 border border-white/10 text-sm text-text-muted"
                >
                  <span className="text-base">{icon}</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
             <Link
              to="/books"
              className="btn-primary w-full flex items-center gap-2"
            >
              <BookOpen size={18} />
              Browse the Catalog
            </Link>

            {/* Secondary nudge — if they came from a book page they might remember something */}
            <p className="text-text-muted text-xs">
              Already browsing something?{" "}
              <Link
                to="/books"
                className="text-golden hover:underline underline-offset-2"
              >
                Pick up where you left off
              </Link>
            </p>
          </div>
        </div>
      </>
    );
  }

  // Library Grid
  return (
    <>
      <SEO
        title="My Library"
        description="Your purchased books, ready to read and download anytime."
        url="/library"
        noIndex={true}
      />

      <section className="min-h-screen">
        <div className="container-page py-12">
          {/* Page header */}
          <div className="mb-10">
            <h1 className="text-text-light">My Library</h1>
            <p className="text-golden/85 text-sm mt-1">
              {/* Show how many books they own */}
              {library.length} {library.length === 1 ? "book" : "books"} in your
              collection
            </p>
          </div>

          {/* Books grid — responsive: 1 col on mobile, 2 on tablet, 3 on desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {library.map((book: IBook) => {
              // Check if THIS specific book is currently being downloaded
              const isThisDownloading = downloadingBookId === book._id;

              return (
                <div
                  key={book._id}
                  // Card styling — dark surface matching our design system
                  className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col hover:border-golden-500/40 transition-colors duration-200"
                >
                  {/* Book cover image */}
                  <div className="aspect-[1/1] overflow-hidden bg-white/5">
                    <img
                      src={book.coverImage}
                      alt={`Cover of ${book.title}`}
                      // Cover fills the container, cropped to fit — same pattern as BookCard
                      className="w-full h-full object-cover select-none"
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
                    <Link
                      className="text-text-light hover:text-golden font-semibold 
                        text-sm leading-snug line-clamp-2 mb-1 cursor-pointer transition-colors duration-300"
                      to={`/books/${book._id}`}
                    >
                      <h3>{book.title}</h3>
                    </Link>

                    {/* Author name — using the denormalized authorName field, NOT book.author ObjectId */}
                    <p className="text-text-muted text-xs mb-3">
                      {book.authorName}
                    </p>

                    {/* File type badge — shows PDF or EPUB */}
                    <span className="text-xs text-burgundy uppercase font-medium tracking-wide mb-4">
                      {book.fileType}
                    </span>

                    {/* Spacer pushes the download button to the bottom of the card */}
                    <div className="flex-1" />

                    {/* Download button */}
                    <button
                      onClick={() =>
                        handleDownload(book._id, book.title, book.fileType)
                      }
                      // Disable the button while any download is in progress to prevent double-clicks
                      disabled={isDownloading}
                      className="btn-primary w-full flex items-center justify-center gap-2 text-sm 
                      disabled:opacity-50 disabled:cursor-not-allowed"
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
      </section>
    </>
  );
}

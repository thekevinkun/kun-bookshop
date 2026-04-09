// Import React Router hooks for reading the URL param and navigating
import { useParams, useNavigate } from "react-router-dom";

// Import React Query for data fetching
import { useQuery } from "@tanstack/react-query";

// Import icons
import { Globe, ArrowLeft } from "lucide-react";

// Import our Axios instance
import api from "../../lib/api";

// Import BookCard to display the author's books in a grid
import { BookCard } from "../../cards";

import type { IBook } from "../../types/book";

export default function AuthorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Fetch the author and their books from the real API
  const { data, isLoading, isError } = useQuery({
    queryKey: ["author", id],
    queryFn: async () => {
      // GET /api/authors/:id — returns { author, books }
      const { data } = await api.get(`/authors/${id}`);
      return data;
    },
    enabled: !!id, // Don't fetch if id is undefined
  });

  const author = data?.author;
  const books = data?.books ?? [];

  // ── Loading state ──
  if (isLoading) {
    return (
      <div className="min-h-screen bg-navy animate-pulse">
        <div className="container-page py-16">
          <div className="flex flex-col sm:flex-row gap-8 items-start">
            <div className="skeleton w-36 h-36 rounded-full flex-shrink-0" />
            <div className="flex flex-col gap-4 flex-1">
              <div className="skeleton h-8 w-48 rounded" />
              <div className="skeleton h-4 w-32 rounded" />
              <div className="skeleton h-4 w-full rounded" />
              <div className="skeleton h-4 w-2/3 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Not found state ──
  if (isError || !author) {
    return (
      <div className="container-page text-center py-24">
        <p className="text-6xl mb-4">✍️</p>
        <h2 className="text-text-light text-2xl font-bold mb-2">
          Author not found
        </h2>
        <p className="text-text-muted mb-6">
          This author may have been removed or the link is incorrect.
        </p>
        <button className="btn-primary" onClick={() => navigate("/")}>
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-dark">
      {/* ── Hero banner ── */}
      <section className="bg-navy py-16">
        <div className="container-page">
          {/* Back button */}
          <button
            onClick={() => navigate(-1)} // Go back to wherever the user came from
            className="flex items-center gap-2 text-text-muted hover:text-teal
                transition-colors text-sm mb-8"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          {/* Author profile card */}
          <div className="flex flex-col sm:flex-row gap-8 items-start">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <img
                src={author.avatar}
                alt={author.name}
                className="w-36 h-36 rounded-full object-cover border-4 border-teal/30"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "/images/placeholder-author.webp";
                }}
              />
            </div>

            {/* Author info */}
            <div className="flex flex-col gap-3 flex-1">
              {/* Name */}
              <h1 className="text-text-light text-3xl font-bold">
                {author.name}
              </h1>

              {/* Specialties as teal pills */}
              {author.specialty?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {author.specialty.map((s: string) => (
                    <span key={s} className="badge-primary text-xs">
                      {s}
                    </span>
                  ))}
                </div>
              )}

              {/* Nationality + website row */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-text-muted">
                {author.nationality && <span>🌍 {author.nationality}</span>}
                {author.website && (
                  <a
                    href={author.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-teal hover:underline"
                  >
                    <Globe size={13} />
                    Website
                  </a>
                )}
              </div>

              {/* Bio */}
              <p className="text-text-muted text-sm leading-relaxed max-w-2xl">
                {author.bio}
              </p>

              {/* Social links */}
              {author.socialLinks && (
                <div className="flex flex-wrap gap-3 mt-1">
                  {Object.entries(author.socialLinks)
                    .filter(
                      ([, url]) => typeof url === "string" && url.length > 0,
                    )
                    .map(([platform, url]) => (
                      <a
                        key={platform}
                        href={url as string}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-ghost btn-sm capitalize"
                      >
                        {platform}
                      </a>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Author's books ── */}
      <section className="section">
        <div className="container-page">
          <div className="mb-8">
            <h2 className="text-text-light text-xl font-bold uppercase tracking-wider">
              Books by {author.name}
            </h2>
            <div className="w-10 h-1 bg-teal rounded-full mt-1" />
            <p className="text-text-muted text-xs mt-2">
              {books.length} {books.length === 1 ? "book" : "books"} available
            </p>
          </div>

          {/* Empty state — author exists but has no books yet */}
          {books.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-5xl mb-4">📚</p>
              <h3 className="text-text-light text-lg font-semibold mb-2">
                No books yet
              </h3>
              <p className="text-text-muted text-sm">
                This author doesn't have any books in the catalog yet.
              </p>
            </div>
          ) : (
            // Grid of BookCards — same component used everywhere else
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {books.map((book: IBook) => (
                <BookCard key={book._id} book={book} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

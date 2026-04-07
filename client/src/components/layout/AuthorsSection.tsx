import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Import the AuthorCard feature component
import { AuthorCard } from "../features";

// Import the hook that fetches all authors from the real API
// useAllAuthors returns a flat array — no pagination needed for a carousel
import { useAllAuthors } from "../../hooks/useAuthors";

import type { IAuthor } from "../../types/book";

const AuthorsSection = () => {
  // Track which index the carousel window starts from
  const [startIndex, setStartIndex] = useState(0);

  // How many author cards are visible at once
  const visibleCount = 3;

  // Fetch real authors from the API — no placeholder fallback
  const { data: authors = [], isLoading } = useAllAuthors();

  // Can we scroll further right?
  const canNext = startIndex + visibleCount < authors.length;

  // Can we scroll further left?
  const canPrev = startIndex > 0;

  const next = () => {
    if (canNext) setStartIndex((p) => p + 1);
  };
  const prev = () => {
    if (canPrev) setStartIndex((p) => p - 1);
  };

  // Slice the visible window from the real authors array
  const visibleAuthors = authors.slice(startIndex, startIndex + visibleCount);

  return (
    <section className="section bg-navy">
      <div className="container-page">
        {/* Section header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-teal text-xs font-semibold uppercase tracking-widest mb-1">
              Meet The Minds
            </p>
            <h2 className="text-text-light text-2xl font-bold uppercase tracking-wider">
              Authors
            </h2>
            <div className="w-10 h-1 bg-teal rounded-full mt-2" />
          </div>

          {/* Prev / Next arrows — hidden when there's nothing to scroll */}
          {authors.length > visibleCount && (
            <div className="flex gap-2">
              <button
                onClick={prev}
                disabled={!canPrev}
                className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all duration-200
                  ${
                    canPrev
                      ? "border-teal text-teal hover:bg-teal hover:text-white"
                      : "border-bg-hover text-bg-hover cursor-not-allowed"
                  }`}
                aria-label="Previous authors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={next}
                disabled={!canNext}
                className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all duration-200
                  ${
                    canNext
                      ? "border-teal text-teal hover:bg-teal hover:text-white"
                      : "border-bg-hover text-bg-hover cursor-not-allowed"
                  }`}
                aria-label="Next authors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="skeleton aspect-[3/4] rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state — shown when loading is done but no authors exist yet */}
        {!isLoading && authors.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-5xl mb-4">✍️</p>
            <h3 className="text-text-light text-lg font-semibold mb-2">
              No authors yet
            </h3>
            <p className="text-text-muted text-sm">
              Authors will appear here once they're added to the system.
            </p>
          </div>
        )}

        {/* Author cards — only rendered when we have real data */}
        {!isLoading && authors.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {visibleAuthors.map((author: IAuthor) => (
              <AuthorCard key={author._id} author={author} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default AuthorsSection;

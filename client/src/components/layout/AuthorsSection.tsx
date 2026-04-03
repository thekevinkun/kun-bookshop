import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { AuthorCard } from "../features";

import { PLACEHOLDER_AUTHORS } from "../../lib/data";

const AuthorsSection = () => {
  // Track which index the carousel starts from
  const [startIndex, setStartIndex] = useState(0);

  // How many cards visible at once — 6 on desktop
  const visibleCount = 3;

  // Can we go further right?
  const canNext = startIndex + visibleCount < PLACEHOLDER_AUTHORS.length;

  // Can we go further left?
  const canPrev = startIndex > 0;

  const next = () => {
    if (canNext) setStartIndex((prev) => prev + 1);
  };

  const prev = () => {
    if (canPrev) setStartIndex((prev) => prev - 1);
  };

  // Slice the visible window of authors
  const visibleAuthors = PLACEHOLDER_AUTHORS.slice(
    startIndex,
    startIndex + visibleCount,
  );

  return (
    <section className="section bg-navy">
      <div className="container-page">
        {/* Header row */}
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

          {/* Prev / Next arrows */}
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
        </div>

        {/* Author cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {visibleAuthors.map((author) => (
            <AuthorCard key={author._id} author={author} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default AuthorsSection;

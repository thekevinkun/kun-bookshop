import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Star, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import type { IBook } from "../../types/book";

const Hero = ({ books, isLoading }: { books: IBook[]; isLoading: boolean }) => {
  const navigate = useNavigate();

  // Which slide is currently active
  const [activeIndex, setActiveIndex] = useState(0);

  // Whether auto-play is paused (user is hovering)
  const [isPaused, setIsPaused] = useState(false);

  const activeBook = books[activeIndex];

  // Move to the next slide — wraps around to 0 after the last
  const next = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % books.length);
  }, [books.length]);

  // Move to the previous slide
  const prev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + books.length) % books.length);
  }, [books.length]);

  // Auto-advance every 5 seconds unless hovered
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer); // Clean up on unmount or pause
  }, [isPaused, next]);

  const displayPrice = activeBook
    ? (activeBook.discountPrice ?? activeBook.price)
    : 0;

  if (!isLoading && !activeBook) {
    // Show an empty state if there are no featured books
    return (
      <section className="relative min-h-screen flex flex-col items-center justify-center bg-navy">
        <div className="flex flex-col items-center justify-center text-center">
          <p className="text-5xl mb-4">📚</p>
          <h3 className="text-text-light text-lg font-semibold mb-2">
            No featured yet
          </h3>
          <p className="text-text-muted text-sm">
            There are no featured books at the moment. Check back soon!
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      className="relative min-h-[90vh] flex items-center overflow-hidden bg-navy"
      onMouseEnter={() => setIsPaused(true)} // Pause on hover
      onMouseLeave={() => setIsPaused(false)} // Resume on leave
    >
      {/* Subtle background texture — dark radial gradient for depth */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,_#1e3a5f33_0%,_transparent_70%)]" />
      </div>

      <div className="container-page relative z-10 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* ---- LEFT: Book info ---- */}
          {isLoading ? (
            <div className="animate-pulse w-full">
              <div className="w-32 h-4 bg-bg-hover rounded mb-4" />
              <div className="w-48 h-6 bg-bg-hover rounded mb-2" />
              <div className="w-24 h-3 bg-bg-hover rounded mb-6" />
              <div className="w-40 h-4 bg-bg-hover rounded" />
            </div>
          ) : (
            <div className="flex flex-col gap-5 order-2 md:order-1">
              {/* Category chip */}
              <span className="badge-primary self-start text-xs uppercase tracking-widest">
                {activeBook.category[0]}
              </span>

              {/* Book title — large and bold */}
              <h1 className="text-text-light text-5xl sm:text-6xl font-bold leading-tight">
                {activeBook.title}
              </h1>

              {/* Author */}
              <p className="text-text-muted text-base">
                By{" "}
                <span className="text-teal font-semibold">
                  {activeBook.authorName}
                </span>
              </p>

              {/* Rating row */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={
                        i < Math.round(activeBook.rating)
                          ? "text-warning fill-warning"
                          : "text-bg-hover fill-bg-hover"
                      }
                    />
                  ))}
                </div>
                <span className="text-text-muted text-sm">
                  {activeBook.rating.toFixed(1)} · {activeBook.reviewCount}{" "}
                  reviews
                </span>
              </div>

              {/* Description — clamped to 4 lines */}
              <p className="text-text-muted leading-relaxed line-clamp-4 max-w-lg">
                {activeBook.description}
              </p>

              {/* Price + CTA */}
              <div className="flex items-center gap-6 mt-2">
                <div className="flex flex-col">
                  <span className="text-teal text-3xl font-bold">
                    ${displayPrice.toFixed(2)}
                  </span>
                  {activeBook.discountPrice && (
                    <span className="text-text-muted text-sm line-through">
                      ${activeBook.price.toFixed(2)}
                    </span>
                  )}
                </div>
                <button
                  className="btn-primary btn-lg flex items-center gap-2"
                  onClick={() => navigate(`/books/${activeBook._id}`)}
                >
                  <BookOpen size={18} />
                  View Book
                </button>
              </div>

              {/* Slide indicators — dots at the bottom of the text block */}
              <div className="flex items-center gap-3 mt-4">
                {books.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIndex(i)}
                    className={`transition-all duration-300 rounded-full
                    ${
                      i === activeIndex
                        ? "w-8 h-2 bg-teal" // Active dot is wider
                        : "w-2 h-2 bg-bg-hover hover:bg-teal/50"
                    }`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}

                {/* Prev / Next arrows beside the dots */}
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={prev}
                    className="w-8 h-8 rounded-full border border-bg-hover flex items-center justify-center 
                    text-text-muted hover:border-teal hover:text-teal transition-all duration-200"
                    aria-label="Previous book"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={next}
                    className="w-8 h-8 rounded-full border border-bg-hover flex items-center justify-center 
                    text-text-muted hover:border-teal hover:text-teal transition-all duration-200"
                    aria-label="Next book"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ---- RIGHT: Book cover with stacked shadow effect ---- */}
          <div className="flex justify-center items-center order-1 md:order-2">
            <div className="relative w-64 sm:w-72">
              {isLoading ? (
                <div className="aspect-[2/3] bg-bg-hover rounded-xl shadow-[0_24px_60px_rgba(0,0,0,0.5)]" />
              ) : (
                <>
                  {/* Back copies of the same cover create a more convincing stacked-book effect */}
                  <img
                    key={`${activeBook._id}-stack-back`}
                    src={activeBook.coverImage}
                    alt=""
                    aria-hidden="true"
                    className="absolute top-6 left-12 w-full rounded-xl object-cover aspect-[2/3]
                      rotate-[12deg] scale-[0.94] opacity-55 blur-[1.5px] brightness-[0.55]
                      saturate-[0.8] shadow-[0_20px_50px_rgba(0,0,0,0.45)]"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "/images/placeholder-cover.webp";
                    }}
                  />
                  <img
                    key={`${activeBook._id}-stack-mid`}
                    src={activeBook.coverImage}
                    alt=""
                    aria-hidden="true"
                    className="absolute top-3 left-8 w-full rounded-xl object-cover aspect-[2/3]
                      rotate-[10deg] scale-[0.97] opacity-75 blur-[0.5px] brightness-[0.72]
                      saturate-[0.9] shadow-[0_18px_40px_rgba(0,0,0,0.38)]"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "/images/placeholder-cover.webp";
                    }}
                  />

                  {/* Main cover image */}
                  <img
                    key={activeBook._id} // Key change triggers re-render on slide change
                    src={activeBook.coverImage}
                    alt={`Cover of ${activeBook.title}`}
                    className="relative z-10 w-full rounded-xl shadow-[0_24px_60px_rgba(0,0,0,0.5)] 
                      object-cover aspect-[2/3] transition-opacity duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "/images/placeholder-cover.webp";
                    }}
                  />
                </>
              )}

              {/* Teal glow beneath the cover — our design touch */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-48 h-12 bg-teal/20 blur-2xl rounded-full z-0" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

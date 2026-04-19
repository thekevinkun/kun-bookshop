import { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BookCardCompact } from "../../cards";
import type { IBook } from "../../types/book";

interface SimilarBooksProps {
  books: IBook[];
}

const carouselItemClassName =
  "shrink-0 snap-start basis-[calc(36.555%-0.35rem)] min-[30rem]:basis-[calc(30%-0.65rem)] sm:basis-[calc(23.333%-0.75rem)]";

const SimilarBooks = ({ books }: SimilarBooksProps) => {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const rafRef = useRef<number | null>(null);

  const checkArrowVisibility = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const canScrollLeft = track.scrollLeft > 0;
    const canScrollRight =
      track.scrollLeft < track.scrollWidth - track.clientWidth - 1;

    setShowLeftArrow(canScrollLeft);
    setShowRightArrow(canScrollRight);
  }, []);

  const scrollByPage = (direction: "prev" | "next") => {
    const track = trackRef.current;
    if (!track) return;

    const amount = track.clientWidth * 0.9;
    track.scrollBy({
      left: direction === "next" ? amount : -amount,
      behavior: "smooth",
    });
  };

  // Debounced scroll check using requestAnimationFrame
  const handleScroll = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(checkArrowVisibility);
  }, [checkArrowVisibility]);

  // Initial check and resize observer
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    // Initial check (async)
    requestAnimationFrame(checkArrowVisibility);

    // ResizeObserver
    const resizeObserver = new ResizeObserver(checkArrowVisibility);
    resizeObserver.observe(track);

    return () => {
      resizeObserver.disconnect();
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [checkArrowVisibility, books.length]);

  // Scroll listener
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    track.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      track.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);

  return (
    <div className="mt-10 lg:mt-0 flex flex-col gap-4">
      <h2 className="text-text-light uppercase tracking-wider">
        Similar Books
      </h2>
      <div className="w-8 h-0.5 bg-golden rounded-full -mt-2 mb-2" />

      {books.length > 0 ? (
        <>
          {(showLeftArrow || showRightArrow) && (
            <div className="flex items-center justify-end gap-2 lg:hidden">
              <button
                type="button"
                className={`w-10 h-10 md:w-11 md:h-11 p-0.5 rounded-full border border-golden/80 bg-card/40 text-text-muted
                flex items-center justify-center hover:border-golden hover:text-golden transition-all duration-200 ${
                  showLeftArrow
                    ? "opacity-100 shadow-md hover:shadow-golden/50"
                    : "!border-bg-hover opacity-30 pointer-events-none cursor-not-allowed"
                }`}
                onClick={() => scrollByPage("prev")}
                aria-label="Scroll similar books left"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                className={`w-10 h-10 md:w-11 md:h-11 p-0.5 rounded-full border border-golden/80 bg-card/40 text-text-muted
                flex items-center justify-center hover:border-golden hover:text-golden transition-all duration-200 ${
                  showRightArrow
                    ? "opacity-100 shadow-md hover:shadow-golden/50"
                    : "!border-bg-hover opacity-30 pointer-events-none cursor-not-allowed"
                }`}
                onClick={() => scrollByPage("next")}
                aria-label="Scroll similar books right"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}

          <div
            ref={trackRef}
            className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory 
              scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:hidden"
          >
            {books.map((book) => (
              <div key={book._id} className={carouselItemClassName}>
                <BookCardCompact book={book} hideNew />
              </div>
            ))}
          </div>

          <div className="hidden lg:grid grid-cols-2 gap-4">
            {books.slice(0, 6).map((book) => (
              <BookCardCompact key={book._id} book={book} hideNew />
            ))}
          </div>
        </>
      ) : (
        <p className="text-text-muted text-sm">No similar books found yet.</p>
      )}
    </div>
  );
};

export default SimilarBooks;

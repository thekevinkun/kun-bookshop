import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BookCard } from "../../cards";
import type { IBook } from "../../types/book";

interface RecommendedCarouselProps {
  books: IBook[];
  isLoading?: boolean;
  skeletonCount?: number;
}

const carouselItemClassName = `shrink-0 snap-start basis-[calc(30%-0.5rem)] min-[30rem]:basis-[calc(30%-0.667rem)] 
    sm:basis-[calc(27.777%-0.425rem)] md:basis-[calc(22.333%-0.95rem)] lg:basis-[calc(20%-1rem)]`;

const RecommendedCardSkeleton = () => (
  <div className={carouselItemClassName}>
    <div className="flex flex-col">
      <div className="skeleton w-full aspect-[2/3] rounded-lg mb-3" />
      <div className="skeleton h-3.5 w-full rounded mb-1.5" />
      <div className="skeleton h-3.5 w-3/4 rounded mb-1.5" />
      <div className="skeleton h-3 w-1/2 rounded mb-1.5" />
      <div className="skeleton h-3.5 w-1/3 rounded mt-1" />
    </div>
  </div>
);

const RecommendedCarousel = ({
  books,
  isLoading = false,
  skeletonCount = 10,
}: RecommendedCarouselProps) => {
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
    <div className="relative">
      {(showLeftArrow || showRightArrow) && (
        <div className="flex items-center justify-end gap-2 mb-5">
          <button
            type="button"
            className={`w-10 h-10 md:w-11 md:h-11 p-0.5 rounded-full border border-golden/60 bg-card/40 text-text-muted
                  flex items-center justify-center hover:border-golden hover:text-golden transition-all duration-300 ${
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
            className={`w-10 h-10 md:w-11 md:h-11 p-0.5 rounded-full border border-golden/60 bg-card/40 text-text-muted
                  flex items-center justify-center hover:border-golden hover:text-golden transition-all duration-300 ${
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
        className="flex gap-3 sm:gap-4 md:gap-5 overflow-x-auto pb-2 snap-x snap-mandatory 
        scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {isLoading
          ? Array.from({ length: skeletonCount }).map((_, index) => (
              <RecommendedCardSkeleton key={index} />
            ))
          : books.map((book) => (
              <div key={book._id} className={carouselItemClassName}>
                <BookCard book={book} />
              </div>
            ))}
      </div>
    </div>
  );
};

export default RecommendedCarousel;

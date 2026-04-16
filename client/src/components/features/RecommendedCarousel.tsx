import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BookCard } from "../../cards";
import type { IBook } from "../../types/book";

interface RecommendedCarouselProps {
  books: IBook[];
  isLoading?: boolean;
  skeletonCount?: number;
}

const carouselItemClassName =
  `shrink-0 snap-start basis-[calc(39.999%-0.667rem)] min-[30rem]:basis-[calc(35%-0.667rem)] 
    sm:basis-[calc(27.666%-0.5rem)] md:basis-[calc(22.333%-0.667rem)] lg:basis-[calc(20%-1rem)]`;

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

  const scrollByPage = (direction: "prev" | "next") => {
    const track = trackRef.current;
    if (!track) return;

    const amount = track.clientWidth * 0.9;
    track.scrollBy({
      left: direction === "next" ? amount : -amount,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-end gap-2 mb-5">
        <button
          type="button"
          className="w-10 h-10 rounded-full border border-bg-hover bg-card/40 text-text-muted
            flex items-center justify-center hover:border-golden hover:text-golden transition-colors"
          onClick={() => scrollByPage("prev")}
          aria-label="Scroll recommended books left"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          className="w-10 h-10 rounded-full border border-bg-hover bg-card/40 text-text-muted
            flex items-center justify-center hover:border-golden hover:text-golden transition-colors"
          onClick={() => scrollByPage("next")}
          aria-label="Scroll recommended books right"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div
        ref={trackRef}
        className="flex gap-4 sm:gap-5 overflow-x-auto pb-2 snap-x snap-mandatory 
        scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {isLoading
          ? Array.from({ length: skeletonCount }).map((_, index) => (
              <RecommendedCardSkeleton key={index} />
            ))
          : books.map((book) => (
              <div
                key={book._id}
                className={carouselItemClassName}
              >
                <BookCard book={book} />
              </div>
            ))}
      </div>
    </div>
  );
};

export default RecommendedCarousel;

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AuthorCard } from "../../cards";
import type { IAuthor } from "../../types/book";

interface AuthorsCarouselProps {
  authors: (IAuthor & { bookCount?: number })[];
}

const carouselItemClassName =
  "shrink-0 snap-start basis-[calc(50%-0.5rem)] min-[30rem]:basis-[calc(33.333%-0.75rem)]";

const AuthorsCarousel = ({ authors }: AuthorsCarouselProps) => {
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
    <div className="lg:hidden">
      <div className="flex items-center justify-end gap-2 mb-5">
        <button
          type="button"
          className="w-10 h-10 rounded-full border border-bg-hover bg-card/40 text-text-muted
            flex items-center justify-center hover:border-teal hover:text-teal transition-colors"
          onClick={() => scrollByPage("prev")}
          aria-label="Scroll authors left"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          className="w-10 h-10 rounded-full border border-bg-hover bg-card/40 text-text-muted
            flex items-center justify-center hover:border-teal hover:text-teal transition-colors"
          onClick={() => scrollByPage("next")}
          aria-label="Scroll authors right"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div
        ref={trackRef}
        className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {authors.map((author) => (
          <div key={author._id} className={carouselItemClassName}>
            <AuthorCard author={author} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default AuthorsCarousel;

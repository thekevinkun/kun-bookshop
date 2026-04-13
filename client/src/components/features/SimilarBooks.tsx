import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BookCardCompact } from "../../cards";
import type { IBook } from "../../types/book";

interface SimilarBooksProps {
  books: IBook[];
}

const carouselItemClassName =
  "shrink-0 snap-start basis-[calc(33.333%-0.667rem)] sm:basis-[calc(28%-0.75rem)] md:basis-[calc(20%-0.8rem)]";

const SimilarBooks = ({ books }: SimilarBooksProps) => {
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
    <div className="flex flex-col gap-4">
      <h2 className="text-text-light uppercase tracking-wider">
        Similar Books
      </h2>
      <div className="w-8 h-0.5 bg-teal rounded-full -mt-2 mb-2" />

      {books.length > 0 ? (
        <>
          <div className="flex items-center justify-end gap-2 lg:hidden">
            <button
              type="button"
              className="w-10 h-10 rounded-full border border-bg-hover bg-card/40 text-text-muted
                flex items-center justify-center hover:border-teal hover:text-teal transition-colors"
              onClick={() => scrollByPage("prev")}
              aria-label="Scroll similar books left"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              className="w-10 h-10 rounded-full border border-bg-hover bg-card/40 text-text-muted
                flex items-center justify-center hover:border-teal hover:text-teal transition-colors"
              onClick={() => scrollByPage("next")}
              aria-label="Scroll similar books right"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div
            ref={trackRef}
            className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:hidden"
          >
            {books.map((book) => (
              <div key={book._id} className={carouselItemClassName}>
                <BookCardCompact book={book} hideNew />
              </div>
            ))}
          </div>

          <div className="hidden lg:grid grid-cols-2 gap-4">
            {books.map((book) => (
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

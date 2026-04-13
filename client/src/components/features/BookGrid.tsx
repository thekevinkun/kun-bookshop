import { BookCard } from "../../cards";
import type { IBook } from "../../types/book";

interface BookGridProps {
  books: IBook[];
  isLoading?: boolean;
  skeletonCount?: number;
}

const BookCardSkeleton = () => (
  <div className="flex flex-col">
    {/* Cover placeholder — same 2:3 ratio as the real card */}
    <div className="skeleton w-full aspect-[2/3] rounded-lg mb-3" />
    {/* Title */}
    <div className="skeleton h-3.5 w-full rounded mb-1.5" />
    <div className="skeleton h-3.5 w-3/4 rounded mb-1.5" />
    {/* Category */}
    <div className="skeleton h-3 w-1/2 rounded mb-1.5" />
    {/* Price */}
    <div className="skeleton h-3.5 w-1/3 rounded mt-1" />
  </div>
);

const BookGrid = ({
  books,
  isLoading = false,
  skeletonCount = 15,
}: BookGridProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <BookCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-6xl mb-4">📚</p>
        <h3 className="text-text-light mb-2">
          No books found
        </h3>
        <p className="text-text-muted text-sm max-w-xs">
          Try adjusting your filters or search term.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
      {books.map((book) => (
        <BookCard key={book._id} book={book} />
      ))}
    </div>
  );
};

export default BookGrid;

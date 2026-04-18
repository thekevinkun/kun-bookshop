import { Link } from "react-router-dom";
import type { IBook } from "../types/book";

interface BookCardCompactProps {
  book: IBook;
  hideNew?: boolean;
}

// Inline — small enough to not need its own file
const BookCardCompact = ({ book, hideNew }: BookCardCompactProps) => (
  <Link
    to={`/books/${book._id}`}
    className="group relative rounded-xl overflow-hidden block w-full h-full"
  >
    <img
      src={book.coverImage}
      alt={book.title}
      className="w-full h-full object-cover object-center select-none
        transition-transform duration-300 group-hover:scale-105"
      onError={(e) => {
        (e.target as HTMLImageElement).src = "/images/placeholder-cover.webp";
      }}
    />
    <div
      className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25
        to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
    />
    <div
      className="absolute bottom-0 left-0 right-0 p-2 translate-y-2 opacity-0
        group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300"
    >
      <p className="text-golden text-xs font-semibold line-clamp-1 leading-tight">
        {book.title}
      </p>
      <p className="text-text-light text-[10px] mt-0.5 line-clamp-1">
        {book.authorName}
      </p>
    </div>

    {!hideNew && (
      <div className="absolute top-2 left-2">
        <span
          className="bg-emerald-700 text-text-light text-[10px] font-bold px-2 py-0.5
            rounded-full uppercase tracking-wide"
        >
          New
        </span>
      </div>
    )}

    <div
      className="absolute bottom-0 left-0 right-0 h-0.5 bg-golden
          scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"
    />
  </Link>
);

export default BookCardCompact;

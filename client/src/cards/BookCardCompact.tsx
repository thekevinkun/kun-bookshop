import { Link } from "react-router-dom";
import type { IBook } from "../types/book";

// Inline — small enough to not need its own file
const BookCardCompact = ({ book }: { book: IBook }) => (
  <Link
    to={`/books/${book._id}`}
    className="group relative rounded-xl overflow-hidden block w-full h-full"
  >
    <img
      src={book.coverImage}
      alt={book.title}
      className="w-full h-full object-cover object-center
        transition-transform duration-300 group-hover:scale-105"
      onError={(e) => {
        (e.target as HTMLImageElement).src = "/images/placeholder-cover.webp";
      }}
    />
    <div
      className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10
        to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
    />
    <div
      className="absolute bottom-0 left-0 right-0 p-2 translate-y-2 opacity-0
        group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300"
    >
      <p className="text-white text-xs font-semibold line-clamp-1 leading-tight">
        {book.title}
      </p>
      <p className="text-slate-300 text-[10px] mt-0.5 line-clamp-1">
        {book.authorName}
      </p>
    </div>
    <div className="absolute top-2 left-2">
      <span
        className="bg-teal text-white text-[10px] font-bold px-2 py-0.5
            rounded-full uppercase tracking-wide"
      >
        New
      </span>
    </div>
  </Link>
);

export default BookCardCompact;

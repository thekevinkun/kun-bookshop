import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import type { IBook } from "../../types/book";

interface BookCardProps {
  book: IBook;
}

const BookCard = ({ book }: BookCardProps) => {
  const navigate = useNavigate();

  const displayPrice = book.discountPrice ?? book.price;

  const discountPercent =
    book.discountPrice && book.price > 0
      ? Math.round(((book.price - book.discountPrice) / book.price) * 100)
      : null;

  return (
    <div
      className="group cursor-pointer flex flex-col"
      onClick={() => navigate(`/books/${book._id}`)}
    >
      {/* COVER */}
      <div className="relative overflow-hidden rounded-lg mb-3 aspect-[2/3] bg-ocean">
        {/* Cover image — scales up slightly on hover */}
        <img
          src={book.coverImage}
          alt={`Cover of ${book.title}`}
          className="w-full h-full object-cover transition-transform duration-500 not-first:group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "/images/placeholder-cover.webp";
          }}
        />

        {/* Dark gradient overlay at the bottom — fades in on hover */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-dark/80 via-transparent
              to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        />

        {/* Discount badge — top left */}
        {discountPercent && (
          <span className="absolute top-2 left-2 bg-teal text-white text-xs font-bold px-2 py-0.5 rounded-md">
            -{discountPercent}%
          </span>
        )}

        {/* Teal bottom border glow — slides up on hover, our design touch */}
        <div
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal
              scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"
        />
      </div>

      {/* INFO */}
      <div className="flex flex-col gap-1 flex-1">
        {/* Title — clamp to 2 lines */}
        <h3
          className="text-text-light text-sm font-semibold leading-snug
              line-clamp-2 group-hover:text-teal transition-colors duration-200"
        >
          {book.title}
        </h3>

        {/* Category — italic muted, like in the reference images */}
        <div className="flex items-center gap-1">
          <p className="text-text-muted text-xs italic">{book.category[0]},</p>
          <p className="text-text-muted text-xs italic">{" "}{book.category[1]}</p>
        </div>

        {/* Rating — compact, only shows stars + number */}
        <div className="flex items-center gap-1 mt-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={10}
              className={
                i < Math.round(book.rating)
                  ? "text-warning fill-warning"
                  : "text-bg-hover fill-bg-hover"
              }
            />
          ))}
          <span className="text-text-muted text-xs ml-1">
            {book.rating.toFixed(1)}
          </span>
        </div>

        {/* Price — pushed to the bottom */}
        <div className="flex items-baseline gap-2 mt-auto pt-2">
          <span className="text-teal text-sm font-bold">
            ${displayPrice.toFixed(2)}
          </span>
          {book.discountPrice && (
            <span className="text-text-muted text-xs line-through">
              ${book.price.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookCard;

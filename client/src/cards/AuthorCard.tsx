// Import React Router's navigation hook
import { Link } from "react-router-dom";

// Import our author type
import type { IAuthor } from "../types/book";

// Extend IAuthor locally to include bookCount — added by the backend getAuthors response
interface AuthorCardProps {
  author: IAuthor & { bookCount?: number };
}

const AuthorCard = ({ author }: AuthorCardProps) => {
  return (
    <Link
      to={`/authors/${author._id}`}
      className="group card-base flex flex-col items-center text-center select-none
        h-full cursor-pointer hover:-translate-y-1 transition-all duration-300"
      // Navigate to the author's dedicated profile page — not a search URL
    >
      {/* Avatar — circular with golden ring on hover */}
      <div className="relative mb-3">
        <div
          className="w-20 h-20 rounded-full overflow-hidden border-2
          border-bg-hover group-hover:border-golden transition-colors duration-300"
        >
          <img
            src={author.avatar}
            alt={author.name}
            className="w-full h-full object-cover object-top
              transition-transform duration-500 group-hover:scale-110"
            onError={(e) => {
              // Fallback image if Cloudinary URL fails to load
              (e.target as HTMLImageElement).src =
                "/images/placeholder-author.webp";
            }}
          />
        </div>

        {/* golden glow ring on hover */}
        <div
          className="absolute inset-0 rounded-full bg-golden/0
          group-hover:bg-golden/10 transition-all duration-300"
        />
      </div>

      {/* Author name */}
      <h3
        className="text-text-light !text-lg !leading-tight line-clamp-2 mb-1
          min-h-[3.5rem] md:min-h-0 group-hover:text-golden transition-colors duration-200"
      >
        {author.name}
      </h3>

      {/* First specialty — italic muted text */}
      <p className="text-text-muted text-xs italic line-clamp-1 min-h-[1rem] mb-2">
        {Array.isArray(author.specialty)
          ? author.specialty[0] // Specialty is an array — show the first one
          : author.specialty}
      </p>

      {/* Book count badge — now real data from the backend */}
      {typeof author.bookCount === "number" && (
        <span className="badge-primary text-xs mt-auto">
          {author.bookCount} {author.bookCount === 1 ? "book" : "books"}
        </span>
      )}
    </Link>
  );
};

export default AuthorCard;

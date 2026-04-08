// Import React Router's navigation hook
import { useNavigate } from "react-router-dom";

// Import our author type
import type { IAuthor } from "../../types/book";

// Extend IAuthor locally to include bookCount — added by the backend getAuthors response
interface AuthorCardProps {
  author: IAuthor & { bookCount?: number };
}

const AuthorCard = ({ author }: AuthorCardProps) => {
  const navigate = useNavigate();

  return (
    <div
      className="group card-base flex flex-col items-center text-center
        cursor-pointer hover:-translate-y-1 transition-all duration-300"
      // Navigate to the author's dedicated profile page — not a search URL
      onClick={() => navigate(`/authors/${author._id}`)}
    >
      {/* Avatar — circular with teal ring on hover */}
      <div className="relative mb-3">
        <div
          className="w-20 h-20 rounded-full overflow-hidden border-2
          border-bg-hover group-hover:border-teal transition-colors duration-300"
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

        {/* Teal glow ring on hover */}
        <div
          className="absolute inset-0 rounded-full bg-teal/0
          group-hover:bg-teal/10 transition-all duration-300"
        />
      </div>

      {/* Author name */}
      <h3
        className="text-text-light text-sm font-semibold leading-tight
        group-hover:text-teal transition-colors duration-200 mb-1"
      >
        {author.name}
      </h3>

      {/* First specialty — italic muted text */}
      <p className="text-text-muted text-xs italic mb-2">
        {Array.isArray(author.specialty)
          ? author.specialty[0] // Specialty is an array — show the first one
          : author.specialty}
      </p>

      {/* Book count badge — now real data from the backend */}
      {typeof author.bookCount === "number" && (
        <span className="badge-primary text-xs">
          {author.bookCount} {author.bookCount === 1 ? "book" : "books"}
        </span>
      )}
    </div>
  );
};

export default AuthorCard;

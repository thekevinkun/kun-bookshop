import { useNavigate } from "react-router-dom";
import type { IAuthor } from "../../types/book";

interface AuthorCardProps {
  author: IAuthor;
}

const AuthorCard = ({ author }: AuthorCardProps) => {
  const navigate = useNavigate();

  return (
    <div
      key={author._id}
      className="group card-base flex flex-col items-center text-center
          cursor-pointer hover:-translate-y-1 transition-all duration-300"
      onClick={() => navigate(`/books?search=${author.name}`)}
    >
      {/* Avatar — circular, with teal ring on hover */}
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
              (e.target as HTMLImageElement).src =
                "/images/placeholder-author.webp";
            }}
          />
        </div>

        {/* Teal glow ring — our design touch */}
        <div
          className="absolute inset-0 rounded-full bg-teal/0
              group-hover:bg-teal/10 transition-all duration-300"
        />
      </div>

      {/* Name */}
      <h3
        className="text-text-light text-sm font-semibold leading-tight
            group-hover:text-teal transition-colors duration-200 mb-1"
      >
        {author.name}
      </h3>

      {/* Specialty — italic muted */}
      <p className="text-text-muted text-xs italic mb-2">{author.specialty}</p>

      {/* Book count badge */}
      {/* <span className="badge-primary text-xs">
        {author.totalBooks} {author.totalBooks === 1 ? "book" : "books"}
      </span> */}
    </div>
  );
};

export default AuthorCard;

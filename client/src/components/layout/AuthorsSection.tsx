import { useAllAuthors } from "../../hooks/useAuthors";
import { AuthorCard } from "../../cards";
import type { IAuthor } from "../../types/book";

const AuthorsSection = () => {
  const { data: authors = [], isLoading } = useAllAuthors();

  return (
    <section className="section bg-navy">
      <div className="container-page">
        {/* Section header */}
        <div className="mb-8">
          <p className="text-teal text-xs font-semibold uppercase tracking-widest mb-1">
            Meet The Popular Minds
          </p>
          <h2 className="text-text-light text-2xl font-bold uppercase tracking-wider">
            Authors
          </h2>
          <div className="w-10 h-1 bg-teal rounded-full mt-2" />
        </div>

        {/* Loading skeleton — 9 cards matching the real grid */}
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="skeleton aspect-[3/4] rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && authors.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-5xl mb-4">✍️</p>
            <h3 className="text-text-light text-lg font-semibold mb-2">
              No authors yet
            </h3>
            <p className="text-text-muted text-sm">
              Authors will appear here once they're added to the system.
            </p>
          </div>
        )}

        {/* 3-column grid — shows up to 9 authors sorted by total purchase count */}
        {!isLoading && authors.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {authors.map((author: IAuthor) => (
              <AuthorCard key={author._id} author={author} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default AuthorsSection;

import { BookCardCompact } from "../../cards";
import type { IBook } from "../../types/book";

interface SimilarBooksProps {
  books: IBook[];
}

const SimilarBooks = ({ books }: SimilarBooksProps) => (
  <div className="flex flex-col gap-4">
    <h2 className="text-text-light text-lg font-bold uppercase tracking-wider">
      Similar Books
    </h2>
    <div className="w-8 h-0.5 bg-teal rounded-full -mt-2 mb-2" />

    {books.length > 0 ? (
      // This keeps the same grid layout used before in the sidebar.
      <div className="grid grid-cols-2 gap-4">
        {books.map((b) => (
          // This reuses the normal card but hides category and price text.
          <BookCardCompact key={b._id} book={b} hideNew />
        ))}
      </div>
    ) : (
      <p className="text-text-muted text-sm">No similar books found yet.</p>
    )}
  </div>
);

export default SimilarBooks;

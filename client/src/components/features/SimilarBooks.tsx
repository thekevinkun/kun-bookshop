import BookCard from "./BookCard";
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
      // 2-column grid matches the reference image
      <div className="grid grid-cols-2 gap-4">
        {books.map((b) => (
          <BookCard key={b._id} book={b} />
        ))}
      </div>
    ) : (
      <p className="text-text-muted text-sm">No similar books found yet.</p>
    )}
  </div>
);

export default SimilarBooks;

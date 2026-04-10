import { useBooks } from "../../hooks/useBooks";
import { BookCardCompact } from "../../cards";

const NewArrivalsSection = () => {
  const { data, isLoading } = useBooks({
    sortBy: "createdAt",
    sortOrder: "desc",
    limit: 4,
  });

  const books = data?.books ?? [];

  if (isLoading) {
    return (
      // Same structure as real render — 2x2 grid, self-stretch fills parent height
      <div
        className="grid grid-cols-2 grid-rows-2 gap-3"
        style={{ height: "460px" }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-slate-800/50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (books.length === 0) return null;

  return (
    // self-stretch — takes the full height of whatever the left column is
    // grid-rows-2 — splits that height into exactly 2 equal rows
    // No aspect ratio — height is dictated by the parent, not the image
    <div
      className="grid grid-cols-2 grid-rows-2 gap-3"
      style={{ height: "460px" }}
    >
      {books.slice(0, 4).map((book) => (
        <BookCardCompact key={book._id} book={book} />
      ))}
    </div>
  );
};

export default NewArrivalsSection;

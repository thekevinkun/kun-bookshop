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
        className="lg:h-[460px] grid grid-cols-2 min-[30rem]:grid-cols-4 
          lg:grid-cols-2 lg:grid-rows-2 gap-3 order-1 lg:order-2"
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
      className="lg:h-[460px] grid grid-cols-2 min-[30rem]:grid-cols-4 
        lg:grid-cols-2 lg:grid-rows-2 gap-3 order-1 lg:order-2"
    >
      {books.slice(0, 4).map((book) => (
        <BookCardCompact key={book._id} book={book} />
      ))}
    </div>
  );
};

export default NewArrivalsSection;

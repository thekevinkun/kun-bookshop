import { useNavigate } from "react-router-dom";
import {
  Star,
  ArrowLeft,
  ShoppingCart,
  Heart,
  Download,
  FileText,
  BookOpen,
  Calendar,
} from "lucide-react";
import type { IBook } from "../../types/book";

interface BookDetailHeroProps {
  book: IBook;
  isAuthenticated: boolean;
}

// Formats bytes into a readable string like "2.4 MB"
const formatFileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Formats a date string into "January 2024"
const formatDate = (dateStr?: string) => {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });
};

const BookDetailHero = ({ book, isAuthenticated }: BookDetailHeroProps) => {
  const navigate = useNavigate();

  const displayPrice = book.discountPrice ?? book.price;
  const discountPercent = book.discountPrice
    ? Math.round(((book.price - book.discountPrice) / book.price) * 100)
    : null;

  return (
    <section className="relative min-h-[85vh] flex items-center bg-navy overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#1e3a5f33_0%,_transparent_70%)]" />
      </div>

      <div className="container-page relative z-10 w-full py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* LEFT: Info */}
          <div className="flex flex-col gap-5 order-2 md:order-1">
            <button
              className="btn-ghost btn-sm flex items-center gap-2 self-start -ml-2"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft size={15} /> Back
            </button>

            <span className="badge-primary self-start text-xs uppercase tracking-widest">
              {book.category[0]}
            </span>

            <h1 className="text-text-light text-4xl sm:text-5xl font-bold leading-tight">
              {book.title}
            </h1>

            <p className="text-text-muted text-base">
              By{" "}
              <span className="text-teal font-semibold">{book.authorName}</span>
            </p>

            {/* Stars */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={
                      i < Math.round(book.rating)
                        ? "text-warning fill-warning"
                        : "text-bg-hover fill-bg-hover"
                    }
                  />
                ))}
              </div>
              <span className="text-text-muted text-sm">
                {book.rating.toFixed(1)} · {book.reviewCount} reviews
              </span>
            </div>

            {/* Meta chips */}
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="flex items-center gap-1.5 text-text-muted">
                {book.fileType === "pdf" ? (
                  <FileText size={14} className="text-teal" />
                ) : (
                  <BookOpen size={14} className="text-teal" />
                )}
                {book.fileType.toUpperCase()}
              </span>
              <span className="flex items-center gap-1.5 text-text-muted">
                <Download size={14} className="text-teal" />
                {formatFileSize(book.fileSize)}
              </span>
              {book.publishedDate && (
                <span className="flex items-center gap-1.5 text-text-muted">
                  <Calendar size={14} className="text-teal" />
                  {formatDate(book.publishedDate)}
                </span>
              )}
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-teal text-4xl font-bold">
                ${displayPrice.toFixed(2)}
              </span>
              {book.discountPrice && (
                <>
                  <span className="text-text-muted text-xl line-through">
                    ${book.price.toFixed(2)}
                  </span>
                  <span className="badge-primary font-bold">
                    -{discountPercent}% OFF
                  </span>
                </>
              )}
            </div>

            <p className="text-text-muted text-xs">
              🔥 {book.purchaseCount.toLocaleString()} people have bought this
            </p>

            {/* Buttons */}
            <div className="flex gap-3 flex-wrap">
              <button
                className="btn-primary flex items-center gap-2"
                onClick={() => {
                  if (!isAuthenticated) navigate("/login");
                }}
              >
                <ShoppingCart size={16} /> Add to Cart
              </button>
              <button
                className="btn-ghost flex items-center gap-2"
                onClick={() => {
                  if (!isAuthenticated) navigate("/login");
                }}
              >
                <Heart size={16} /> Wishlist
              </button>
            </div>

            {book.previewPages && (
              <button className="btn-ghost btn-sm self-start flex items-center gap-2">
                <BookOpen size={13} />
                Preview first {book.previewPages} pages — free
              </button>
            )}
          </div>

          {/* RIGHT: Cover with stacked shadow */}
          <div className="flex justify-center items-center order-1 md:order-2">
            <div className="relative w-64 sm:w-72">
              {/* Back copies of the same cover create a more convincing stacked-book effect */}
              <img
                key={`${book._id}-stack-mid`}
                src={book.coverImage}
                alt=""
                aria-hidden="true"
                className="absolute top-3 left-8 w-full rounded-xl object-cover aspect-[2/3]
                  rotate-[10deg] scale-[0.97] opacity-75 blur-[0.5px] brightness-[0.72]
                  saturate-[0.9] shadow-[0_18px_40px_rgba(0,0,0,0.38)]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "/images/placeholder-cover.webp";
                }}
              />

              {/* Main cover image */}
              <img
                key={book._id} // Key change triggers re-render on slide change
                src={book.coverImage}
                alt={`Cover of ${book.title}`}
                className="relative z-10 w-full rounded-xl shadow-[0_24px_60px_rgba(0,0,0,0.5)] 
                  object-cover aspect-[2/3] transition-opacity duration-500"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "/images/placeholder-cover.webp";
                }}
              />

              {/* Teal glow beneath the cover — our design touch */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-48 h-12 bg-teal/20 blur-2xl rounded-full z-0" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BookDetailHero;

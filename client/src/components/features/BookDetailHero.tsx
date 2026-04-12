import { useState } from "react";
import { Link } from "react-router-dom";
import { useCartStore } from "../../store/cart";
import {
  useAddToWishlist,
  useRemoveFromWishlist,
  useWishlist,
} from "../../hooks/useLibrary";
import { toast } from "sonner";
import {
  Star,
  ShoppingCart,
  Heart,
  Download,
  FileText,
  BookOpen,
  Calendar,
} from "lucide-react";

import { BookPreview } from ".";

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
  // Read cart actions and state from Zustand store
  const { addItem, isInCart } = useCartStore();

  // Check if this book is already in the cart
  const alreadyInCart = isInCart(book._id);

  // Local state for the "Added!" flash feedback on the button
  const [justAdded, setJustAdded] = useState(false);

  // Controls whether the PDF preview modal is open or closed
  const [isPreviewOpen, setIsPreviewOpen] = useState(false); // Starts closed

  // Fetch the user's wishlist so we know if this book is already wishlisted
  const { data: wishlist } = useWishlist(isAuthenticated);

  // Check if this specific book is already in the wishlist
  // We compare string versions of the IDs to avoid ObjectId vs string mismatch
  const isWishlisted = wishlist?.some(
    (b: IBook) => b._id?.toString() === book._id?.toString(),
  );

  // Mutation hooks for adding and removing from wishlist
  const { mutate: addToWishlist, isPending: isAddingWishlist } =
    useAddToWishlist();
  const { mutate: removeFromWishlist, isPending: isRemovingWishlist } =
    useRemoveFromWishlist();

  // Combined pending state — true while either mutation is in flight
  const isWishlistPending = isAddingWishlist || isRemovingWishlist;

  // Called when the user clicks "Add to Cart"
  const handleAddToCart = () => {
    // Keep guests on the page and explain why checkout actions are unavailable.
    if (!isAuthenticated) {
      toast.error("Sign in to add books to your cart.");
      return;
    }

    // If already in cart, open the cart drawer instead of adding again
    // We do this by dispatching a custom event the Navbar listens to
    if (alreadyInCart) {
      window.dispatchEvent(new CustomEvent("open-cart"));
      return;
    }

    // Add the book to the cart with all the info CartDrawer needs to display it
    addItem({
      bookId: book._id,
      title: book.title,
      author: book.authorName,
      price: book.discountPrice ?? book.price, // Use sale price if available
      coverImage: book.coverImage,
    });

    // Show "Added!" flash for 1.5 seconds then revert to normal button text
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  // Toggle handler — adds if not wishlisted, removes if already wishlisted
  const handleWishlistToggle = () => {
    if (!isAuthenticated) {
      toast.error("Sign in to save books to your wishlist.");
      return;
    }

    if (isWishlisted) {
      removeFromWishlist(book._id);
    } else {
      addToWishlist(book._id);
    }
  };

  const displayPrice = book.discountPrice ?? book.price;
  const visibleCategories = Array.isArray(book.category)
    ? book.category.slice(0, 3)
    : [];
  const discountPercent = book.discountPrice
    ? Math.round(((book.price - book.discountPrice) / book.price) * 100)
    : null;

  return (
    <section className="relative min-h-[85vh] flex items-center bg-navy overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_right,_#1e3a5f33_0%,_transparent_70%)]" />
      </div>

      <div className="container-page relative z-10 w-full py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* LEFT: Info */}
          <div className="flex flex-col gap-5 order-2 md:order-1">
            <div className="flex flex-wrap items-center gap-2">
              {visibleCategories.map((category) => (
                <span
                  key={category}
                  className="badge-primary self-start !text-[11px] uppercase tracking-widest"
                >
                  {category}
                </span>
              ))}
            </div>

            <h1 className="text-text-light leading-tight">
              {book.title}
            </h1>

            <p className="text-text-muted text-base">
              By{" "}
              <Link
                to={`/authors/${
                  typeof book.author === "string"
                    ? book.author
                    : book.author?._id
                }`}
                className="text-teal font-semibold"
              >
                {book.authorName}
              </Link>
            </p>

            {/* Stars */}
            {book.rating > 0 && (
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
            )}
            
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
            
            {book.purchaseCount > 0 && (
              <p className="text-text-muted text-xs">
                {book.purchaseCount.toLocaleString()} people have bought this
              </p>
            )}

            {/* Buttons */}
            <div id="book-purchase-section" className="flex gap-3 flex-wrap">
              <button
                className="btn-primary flex items-center gap-2"
                onClick={handleAddToCart}
                // Disable only while the "Added!" flash is showing — prevents double-add
                disabled={justAdded}
              >
                <ShoppingCart size={16} />
                {
                  justAdded
                    ? "✓ Added!" // Flash feedback after adding
                    : alreadyInCart
                      ? "View in Cart" // Already in cart — clicking opens the drawer
                      : "Add to Cart" // Default state
                }
              </button>

              {/* Wishlist toggle button — sits below the Add to Cart button */}
              <button
                onClick={handleWishlistToggle}
                disabled={isWishlistPending}
                className={[
                  // Base styles — ghost button with icon
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
                  // Filled heart style if wishlisted, outline if not
                  isWishlisted
                    ? "bg-rose-500/20 border-rose-500/40 text-rose-400 hover:bg-rose-500/30" // Already wishlisted
                    : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20", // Not wishlisted
                ].join(" ")}
              >
                <Heart
                  size={16}
                  // Fill the heart icon solid when wishlisted, outline when not
                  className={isWishlisted ? "fill-rose-400" : ""}
                />
                {isWishlistPending
                  ? "Updating..."
                  : isWishlisted
                    ? "Wishlisted"
                    : "Add to Wishlist"}
              </button>
            </div>

            {/* Preview button — only show if the book has a preview available (previewPages is set) */}
            {book.previewPages && book.previewPages > 0 && (
              <button
                onClick={() => setIsPreviewOpen(true)} // Open the preview modal
                className="btn-ghost btn-sm self-start flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4" />{" "}
                {/* BookOpen icon from lucide-react */}
                Preview ({book.previewPages} pages)
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

      {/* PDF Preview Modal — rendered outside the normal flow but controlled by isPreviewOpen */}
      <BookPreview
        bookId={book._id}
        bookTitle={book.title}
        fileType={book.fileType} // Add this — 'pdf' | 'epub'
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onBuy={() => {
          document
            .getElementById("book-purchase-section")
            ?.scrollIntoView({ behavior: "smooth" });
        }}
      />
    </section>
  );
};

export default BookDetailHero;

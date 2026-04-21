import { useState, lazy, Suspense } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useCartStore } from "../../store/cart";
import {
  useAddToWishlist,
  useRemoveFromWishlist,
  useWishlist,
  useLibrary,
  useDownloadBook,
} from "../../hooks/useLibrary";
import { toast } from "sonner";
import {
  Users,
  Star,
  ShoppingCart,
  Heart,
  Download,
  FileText,
  BookOpen,
  Calendar,
  CheckCircle, // Used for the "Owned" badge icon
} from "lucide-react";

import type { IBook } from "../../types/book";

import { formatFileSize, formatDate } from "../../lib/helpers";

// BookPreview pulls in react-pdf (678kb pdfjs) — we lazy-load it so that chunk
// only downloads when the user actually opens a preview modal, not on page load
const BookPreview = lazy(() => import("./BookPreview"));

interface BookDetailHeroProps {
  book: IBook;
  isAuthenticated: boolean;
}

const BookDetailHero = ({ book, isAuthenticated }: BookDetailHeroProps) => {
  // Read cart actions and state from Zustand store
  const { addItem, isInCart } = useCartStore();

  // useNavigate lets us programmatically send the user to /library on button click
  const navigate = useNavigate();

  // Check if this book is already in the cart
  const alreadyInCart = isInCart(book._id);

  // Local state for the "Added!" flash feedback on the button
  const [justAdded, setJustAdded] = useState(false);

  // Controls whether the PDF preview modal is open or closed
  const [isPreviewOpen, setIsPreviewOpen] = useState(false); // Starts closed

  // Fetch the user's purchased library — only fires when the user is logged in
  // This gives us the list of books the user already owns
  const { data: library = [], isLoading: isLibraryLoading } =
    useLibrary(isAuthenticated);

  // Check if this specific book is already owned by the user
  // Compare string versions of IDs to avoid ObjectId vs string mismatches
  const isOwned = library.some(
    (b: IBook) => b._id?.toString() === book._id?.toString(),
  );

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

  const { mutate: downloadBook, isPending: isDownloadingEpub } =
    useDownloadBook();

  const handleDownloadEpub = () => {
    downloadBook(
      { bookId: book._id, title: book.title, fileType: book.fileType },
      {
        onError: () => toast.error("Download failed. Please try again."),
      },
    );
  };

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
    <section className="relative min-h-[92vh] flex items-center bg-navy overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_right,_#1e3a5f33_0%,_transparent_70%)] z-15" />
        <div 
          style={{
            backgroundImage: "url('/images/bg-texture.jpg')",
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
          }}
          className="absolute inset-0 opacity-10 z-10 pointer-events-none"
        />
      </div>

      <div className="container-page relative z-20 w-full py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* LEFT: Info */}
          <div className="mt-4 md:mt-0 flex flex-col gap-5 order-2 md:order-1">
            <div className="flex flex-wrap items-center gap-2">
              {visibleCategories.map((category) => (
                <span
                  key={category}
                  className="badge-primary self-start !text-[10px] sm:!text-[11px] uppercase tracking-widest"
                >
                  {category}
                </span>
              ))}
            </div>

            {/* "Owned" badge — only shows when the logged-in user has purchased this book */}
            {isOwned ? (
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-text-light !text-[2.25rem] md:!text-[2.75rem] leading-tight">{book.title}</h1>

                <span className="badge-primary text-[8px] uppercase tracking-widest">
                  <CheckCircle size={11} className="shrink-0 mr-1" />
                  Owned
                </span>
              </div>
            ) : (
              <h1 className="text-text-light !text-[2.25rem] md:!text-[2.75rem] leading-tight">{book.title}</h1>
            )}

            <p className="text-text-muted text-base">
              By{" "}
              <Link
                to={`/authors/${
                  typeof book.author === "string"
                    ? book.author
                    : book.author?._id
                }`}
                className="text-golden font-semibold"
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
                          ? "text-amber-400 fill-amber-400"
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
                  <FileText size={14} className="text-golden" />
                ) : (
                  <BookOpen size={14} className="text-golden" />
                )}
                {book.fileType.toUpperCase()}
              </span>

              <span className="flex items-center gap-1.5 text-text-muted">
                <Download size={14} className="text-golden" />
                {formatFileSize(book.fileSize)}
              </span>
              {book.publishedDate && (
                <span className="flex items-center gap-1.5 text-text-muted">
                  <Calendar size={14} className="text-golden" />
                  {formatDate(book.publishedDate)}
                </span>
              )}
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-golden text-4xl font-bold">
                ${displayPrice.toFixed(2)}
              </span>
              {book.discountPrice && (
                <>
                  <span className="text-text-muted text-xl line-through">
                    ${book.price.toFixed(2)}
                  </span>
                  <span className="badge-secondary font-bold">
                    -{discountPercent}% OFF
                  </span>
                </>
              )}
            </div>

            {book.purchaseCount > 0 && (
              <p className="text-text-muted text-xs flex items-center gap-1.5">
                <Users size={14} className="text-golden" />
                Bought by {book.purchaseCount.toLocaleString()} readers
              </p>
            )}

            {/* Buttons */}
            <div id="book-purchase-section" className="flex gap-3 flex-wrap">
              {/* 
                If the user already owns this book, show "View in Library" instead of the cart button.
                This prevents confusion and avoids re-purchasing an already-owned book.
              */}
              {isOwned ? (
                <button
                  className="btn-primary flex items-center gap-2"
                  disabled={isDownloadingEpub}
                  onClick={() => {
                    if (book.fileType === "epub") {
                      handleDownloadEpub();
                    } else {
                      setIsPreviewOpen(true);
                    }
                  }}
                >
                  <BookOpen size={16} />
                  {book.fileType === "epub"
                    ? isDownloadingEpub
                      ? "Preparing..."
                      : "Download to Read"
                    : "Read Now"}
                </button>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.95 }} // physical press-down feel
                  className="btn-primary flex items-center gap-2"
                  onClick={handleAddToCart}
                  disabled={justAdded}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {justAdded ? (
                      // "Added!" state — scales in from small to confirm the action
                      <motion.span
                        key="added"
                        className="flex items-center gap-2"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.15 }}
                      >
                        ✓ Added!
                      </motion.span>
                    ) : alreadyInCart ? (
                      <motion.span
                        key="in-cart"
                        className="flex items-center gap-2"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.15 }}
                      >
                        <ShoppingCart size={16} />
                        View in Cart
                      </motion.span>
                    ) : (
                      <motion.span
                        key="add"
                        className="flex items-center gap-2"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.15 }}
                      >
                        <ShoppingCart size={16} />
                        Add to Cart
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              )}

              {/* Wishlist toggle button — sits beside the primary action button */}
              <motion.button
                onClick={handleWishlistToggle}
                disabled={isWishlistPending}
                whileTap={{ scale: 0.93 }}
                whileHover={{
                  scale: 1.03,
                  backgroundColor: isWishlisted
                    ? "rgba(136, 19, 55, 0.4)" // slightly stronger burgundy
                    : "rgba(248, 250, 252, 0.08)", // slightly brighter ghost
                  borderColor: isWishlisted
                    ? "rgba(136, 19, 55, 1)" // stronger border
                    : "rgba(248, 250, 252, 0.2)",
                }}
                animate={{
                  backgroundColor: isWishlisted
                    ? "rgba(136, 19, 55, 0.3)"
                    : "rgba(248, 250, 252, 0.05)",
                  borderColor: isWishlisted
                    ? "rgba(136, 19, 55, 0.85)"
                    : "rgba(248, 250, 252, 0.10)",
                }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium 
                  cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-text-light"
              >
                <motion.div
                  // Heart icon pops on toggle — scale up briefly then settles
                  animate={{ scale: isWishlisted ? [1, 1.4, 1] : 1 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <Heart
                    size={16}
                    className={
                      isWishlisted
                        ? "fill-burgundy text-burgundy"
                        : "text-gray-400"
                    }
                  />
                </motion.div>

                <AnimatePresence mode="wait" initial={false}>
                  {isWishlistPending ? (
                    <motion.span
                      key="pending"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.1 }}
                    >
                      Updating...
                    </motion.span>
                  ) : isWishlisted ? (
                    <motion.span
                      key="wishlisted"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.15 }}
                    >
                      Wishlisted
                    </motion.span>
                  ) : (
                    <motion.span
                      key="add-wishlist"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.15 }}
                    >
                      Add to Wishlist
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>

            {/* Preview button — only show if the book has a preview available (previewPages is set) */}
            {isOwned && book.previewPages && book.previewPages > 0 ? (
              <button
                className="btn-ghost btn-sm self-start flex items-center gap-2"
                onClick={() => navigate("/library")} // Send them straight to their library
              >
                <BookOpen size={16} />
                View in Library
              </button>
            ) : (
              <button
                onClick={() => setIsPreviewOpen(true)} // Open the preview modal
                className="btn-ghost btn-sm self-start flex items-center gap-2 hover:border-text-muted/35"
              >
                <BookOpen size={16} /> {/* BookOpen icon from lucide-react */}
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
                fetchPriority="high"
                aria-hidden="true"
                className="absolute top-3 left-7 sm:left-8 md:left-5 lg:left-8 w-full rounded-xl object-cover aspect-[2/3]
                  rotate-[10deg] md:rotate-[7deg] lg:rotate-[10deg] scale-[0.97] opacity-75 blur-[0.5px] brightness-[0.72]
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
                fetchPriority="high"
                className="relative z-10 w-full rounded-xl shadow-[0_24px_60px_rgba(0,0,0,0.5)] 
                  object-cover aspect-[2/3] transition-opacity duration-500"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "/images/placeholder-cover.webp";
                }}
              />

              {/* golden glow beneath the cover — our design touch */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-48 h-12 bg-golden/20 blur-2xl rounded-full z-0" />
            </div>
          </div>
        </div>
      </div>

      {/* PDF Preview Modal — rendered outside the normal flow but controlled by isPreviewOpen */}
      <Suspense fallback={null}>
        <BookPreview
          bookId={book._id}
          bookTitle={book.title}
          fileType={book.fileType} // Add this — 'pdf' | 'epub'
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          mode={isOwned && !isLibraryLoading ? "read" : "preview"}
          onBuy={() => {
            document
              .getElementById("book-purchase-section")
              ?.scrollIntoView({ behavior: "smooth" });
          }}
        />
      </Suspense>
    </section>
  );
};

export default BookDetailHero;

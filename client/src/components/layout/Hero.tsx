import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { Star, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { SkeletonHero } from "../ui";
import type { IBook } from "../../types/book";

const Hero = ({
  books,
  coupons,
  isLoading,
}: {
  books: IBook[];
  coupons: number;
  isLoading: boolean;
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  // Track direction so we know which way to animate
  const [direction, setDirection] = useState<"next" | "prev">("next");

  const activeBook = books[activeIndex];

  // Store books.length in a ref so next/prev don't recreate on length change
  // This fixes the autoplay reset bug — the interval never restarts unexpectedly
  const lengthRef = useRef(books.length);
  useEffect(() => {
    lengthRef.current = books.length;
  }, [books.length]);

  const next = useCallback(() => {
    setDirection("next");
    setActiveIndex((prev) => (prev + 1) % lengthRef.current);
  }, []); // stable — no deps that change

  const prev = useCallback(() => {
    setDirection("prev");
    setActiveIndex(
      (prev) => (prev - 1 + lengthRef.current) % lengthRef.current,
    );
  }, []); // stable — no deps that change

  useEffect(() => {
    // When the tab becomes visible or window gets focus again,
    // always release the pause — the mouse is no longer over the element
    const resetPause = () => {
      if (!document.hidden) setIsPaused(false);
    };

    document.addEventListener("visibilitychange", resetPause);
    window.addEventListener("focus", resetPause);

    return () => {
      document.removeEventListener("visibilitychange", resetPause);
      window.removeEventListener("focus", resetPause);
    };
  }, []); // Runs once on mount

  // Clean autoplay — next and isPaused are both stable now so this never resets
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [isPaused, next]);

  const displayPrice = activeBook
    ? (activeBook.discountPrice ?? activeBook.price)
    : 0;

  // Crossfade variants — content fades out/in with subtle vertical drift
  // Direction-aware: next slides up, prev slides down
  const contentVariants = {
    enter: (dir: "next" | "prev") => ({
      opacity: 0,
      y: dir === "next" ? 16 : -16, // drift in from below (next) or above (prev)
    }),
    center: {
      opacity: 1,
      y: 0,
    },
    exit: (dir: "next" | "prev") => ({
      opacity: 0,
      y: dir === "next" ? -16 : 16, // drift out upward (next) or downward (prev)
    }),
  };

  if (!isLoading && !activeBook) {
    return (
      <section className="relative min-h-[92vh] flex flex-col items-center justify-center bg-navy">
        <div className="flex flex-col items-center justify-center text-center">
          <p className="text-5xl mb-4">📚</p>
          <h3 className="text-text-light mb-2">No featured yet</h3>
          <p className="text-text-muted text-sm">
            There are no featured books at the moment. Check back soon!
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      className={`relative flex items-center overflow-hidden bg-navy
        ${coupons > 0 ? "min-h-[87vh]" : "min-h-[92vh]"}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_right,_#1e3a5f33_0%,_transparent_70%)] z-15" />
        <div className="absolute inset-0 h-10 bg-gradient-to-b from-navy/35 to-transparent z-15" />
        <div
          style={{
            backgroundImage: "url('/images/bg-texture.jpg')",
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
          }}
          className="absolute inset-0 opacity-15 z-10"
        />
      </div>

      <div className="container-page relative z-20 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* LEFT: Book info */}
          {isLoading ? (
            <SkeletonHero />
          ) : (
            <div className="mt-4 sm:mt-0 flex flex-col gap-5 order-2 md:order-1">
              {/* AnimatePresence animates content out before new content animates in */}
              {/* mode="wait" ensures exit completes before enter starts — no overlap */}
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={activeBook._id} // key change triggers the animation
                  custom={direction}
                  variants={contentVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="flex flex-col gap-5"
                >
                  {/* Category chip */}
                  <span className="badge-primary self-start uppercase tracking-widest">
                    {activeBook.category[0]}
                  </span>

                  <h1
                    className="text-text-light !text-[1.85rem] sm:!text-[2rem] md:!text-[2.75rem] 
                    leading-tight line-clamp-1 md:line-clamp-none"
                  >
                    {activeBook.title}
                  </h1>

                  <div className="flex flex-wrap items-center gap-3 sm:gap-5">
                    <p className="text-text-muted">
                      By{" "}
                      <Link
                        to={`/authors/${
                          typeof activeBook.author === "string"
                            ? activeBook.author
                            : activeBook.author?._id
                        }`}
                        className="text-golden font-semibold"
                      >
                        {activeBook.authorName}
                      </Link>
                    </p>
                    <p className="text-text-muted italic">
                      {activeBook.publisher}
                    </p>
                    <div className="flex items-center gap-1">
                      <p className="text-text-muted italic text-xs">
                        #{activeBook.tags[0]}
                      </p>
                      {activeBook.tags.length > 1 && (
                        <p className="text-text-muted italic text-xs">
                          #{activeBook.tags[1]}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={
                            i < Math.round(activeBook.rating)
                              ? "text-warning fill-warning"
                              : "text-bg-hover fill-bg-hover"
                          }
                        />
                      ))}
                    </div>
                    <span className="text-text-muted text-sm">
                      {activeBook.rating.toFixed(1)} · {activeBook.reviewCount}{" "}
                      reviews
                    </span>
                  </div>

                  <p className="text-text-muted leading-relaxed line-clamp-4 max-w-lg">
                    {activeBook.description}
                  </p>

                  <div className="flex items-center gap-6 mt-2">
                    <div className="flex flex-col">
                      <span className="hidden md:inline text-golden text-3xl font-bold">
                        ${displayPrice.toFixed(2)}
                      </span>
                      {activeBook.discountPrice && (
                        <span className="hidden md:inline text-text-muted text-sm line-through">
                          ${activeBook.price.toFixed(2)}
                        </span>
                      )}
                      <span
                        className={`md:hidden text-golden text-3xl font-bold
                        ${!activeBook.discountPrice && "relative top-2.5"}`}
                      >
                        ${displayPrice.toFixed(2)}
                      </span>
                      <span
                        className={`md:hidden text-text-muted text-sm line-through
                        ${!activeBook.discountPrice && "invisible"}`}
                      >
                        {activeBook.discountPrice
                          ? activeBook.price.toFixed(2)
                          : "NaN"}
                      </span>
                    </div>
                    <Link
                      to={`/books/${activeBook._id}`}
                      className="btn-primary btn-md flex items-center gap-2"
                    >
                      <BookOpen size={18} />
                      View Book
                    </Link>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Dots and arrows stay OUTSIDE AnimatePresence — they never animate */}
              <div className="flex items-center gap-3 mt-4">
                {books.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      // Set direction based on whether we're going forward or back
                      setDirection(i > activeIndex ? "next" : "prev");
                      setActiveIndex(i);
                    }}
                    className={`p-1.5 transition-all duration-300 rounded-full
                      ${
                        i === activeIndex
                          ? "w-8 h-2 bg-golden"
                          : "w-2 h-2 bg-bg-hover hover:bg-golden/50"
                      }`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={prev}
                    className="w-10 h-10 rounded-full border border-golden/80 flex items-center justify-center
                      text-text-muted hover:border-golden hover:text-golden transition-all duration-200"
                    aria-label="Previous book"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={next}
                    className="w-10 h-10 rounded-full border border-golden/80 flex items-center justify-center
                      text-text-muted hover:border-golden hover:text-golden transition-all duration-200"
                    aria-label="Next book"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* RIGHT: Book cover */}
          <div className="select-none flex justify-center items-center order-1 md:order-2">
            <div className="relative w-64 sm:w-72">
              {isLoading ? (
                <div className="aspect-[2/3] bg-bg-hover rounded-xl shadow-[0_24px_60px_rgba(0,0,0,0.5)]" />
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeBook._id} // triggers on book change
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                    className="relative"
                  >
                    {/* Stacked back covers */}
                    <img
                      src={activeBook.coverImage}
                      alt=""
                      fetchPriority="high"
                      aria-hidden="true"
                      className="absolute top-6 left-9 sm:left-13 w-full rounded-xl object-cover aspect-[2/3]
                        rotate-[10deg] sm:rotate-[12deg] scale-[0.94] opacity-55 blur-[1.5px] brightness-[0.55]
                        saturate-[0.8] shadow-[0_20px_50px_rgba(0,0,0,0.45)] z-15"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "/images/placeholder-cover.webp";
                      }}
                    />
                    <img
                      src={activeBook.coverImage}
                      alt=""
                      fetchPriority="high"
                      aria-hidden="true"
                      className="absolute top-3 left-5 sm:left-8 w-full rounded-xl object-cover aspect-[2/3]
                        rotate-[8deg] sm:rotate-[10deg] scale-[0.97] opacity-75 blur-[0.5px] brightness-[0.72]
                        saturate-[0.9] shadow-[0_18px_40px_rgba(0,0,0,0.38)] z-15"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "/images/placeholder-cover.webp";
                      }}
                    />
                    {/* Main cover */}
                    <img
                      src={activeBook.coverImage}
                      alt={`Cover of ${activeBook.title}`}
                      fetchPriority="high"
                      className="relative z-10 w-full rounded-xl shadow-[0_24px_60px_rgba(0,0,0,0.5)]
                        object-cover aspect-[2/3] z-20"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "/images/placeholder-cover.webp";
                      }}
                    />
                  </motion.div>
                </AnimatePresence>
              )}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-48 h-12 bg-golden/20 blur-2xl rounded-full z-0" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

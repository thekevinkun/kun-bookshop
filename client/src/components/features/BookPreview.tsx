import { useState, useCallback, useEffect, useRef } from "react";
import { motion, useAnimationControls, useReducedMotion } from "framer-motion";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Lock,
  Loader2,
  AlertCircle,
  BookOpen,
} from "lucide-react";
import { useBookPreview, useBookRead } from "../../hooks/useBooks";
import {
  useReadingProgress,
  useSaveProgress,
} from "../../hooks/useReadingProgress";
import type { Book, Rendition } from "epubjs";

// Use CDN-hosted worker to bypass Railway's Fastly edge cache MIME type issue.
// The local .mjs file gets cached by Fastly with wrong content-type on first deploy.
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface BookPreviewProps {
  bookId: string;
  bookTitle: string;
  fileType: "pdf" | "epub";
  isOpen: boolean;
  onClose: () => void;
  onBuy: () => void;
  mode?: "preview" | "read";
}

const BookPreview = ({
  bookId,
  bookTitle,
  fileType,
  isOpen,
  onClose,
  onBuy,
  mode = "preview",
}: BookPreviewProps) => {
  const isReadMode = mode === "read";
  const isPdf = fileType === "pdf";
  const prefersReducedMotion = useReducedMotion();

  // PDF state
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // EPUB state
  const epubContainerRef = useRef<HTMLDivElement>(null);
  const epubBookRef = useRef<Book | null>(null);
  const epubRenditionRef = useRef<Rendition | null>(null);
  const [epubLoading, setEpubLoading] = useState(false);
  const [epubError, setEpubError] = useState(false);
  const [epubCurrentPage, setEpubCurrentPage] = useState(1);
  const [pageTurnDirection, setPageTurnDirection] = useState<1 | -1>(1);
  const pdfPageControls = useAnimationControls();
  const epubPageControls = useAnimationControls();
  const firstPdfPageRef = useRef(true);
  const firstEpubPageRef = useRef(true);
  const suppressNextPdfAnimationRef = useRef(false);
  const epubCurrentPageRef = useRef(1);
  const epubPreviewLimitRef = useRef<number | undefined>(undefined);
  const isReadModeRef = useRef(isReadMode);

  // PDF progress save
  // Only PDF uses progress tracking — EPUB read mode triggers a download instead
  const { mutate: saveProgress } = useSaveProgress();
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restoredRef = useRef(false);
  const currentPageRef = useRef(1);
  const numPagesRef = useRef<number | null>(null);

  const scheduleSave = useCallback(() => {
    if (!isReadMode || !isPdf || !restoredRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveProgress({
        bookId,
        currentPage: currentPageRef.current,
        totalPages: numPagesRef.current ?? 0,
      });
    }, 2000);
  }, [isReadMode, isPdf, bookId, saveProgress]);

  // Cancel pending save and reset flags when modal closes
  useEffect(() => {
    if (!isOpen) {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      restoredRef.current = false;
      if (isPdf) {
        setNumPages(null);
        setCurrentPage(1);
        currentPageRef.current = 1;
        numPagesRef.current = null;
      }
    }
  }, [isOpen, isPdf]);

  // Data fetching
  const previewQuery = useBookPreview(!isReadMode && isOpen ? bookId : null);
  const readQuery = useBookRead(isReadMode && isOpen ? bookId : null);
  const { data, isLoading, isError } = isReadMode ? readQuery : previewQuery;

  const bookUrl = isReadMode
    ? (data as { readUrl: string } | undefined)?.readUrl
    : (data as { previewUrl: string } | undefined)?.previewUrl;

  const allowedPages = isReadMode
    ? undefined
    : ((data as { previewPages: number } | undefined)?.previewPages ?? 5);

  // PDF progress restore
  const { data: savedProgress } = useReadingProgress(
    isReadMode && isPdf && isOpen ? bookId : null,
  );

  const pdfRestoredRef = useRef(false);

  const onDocumentLoadSuccess = useCallback(
    ({ numPages: total }: { numPages: number }) => {
      setNumPages(total);
      numPagesRef.current = total;
      setCurrentPage(1);
      restoredRef.current = false;
      pdfRestoredRef.current = false;
    },
    [],
  );

  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);
  useEffect(() => {
    numPagesRef.current = numPages;
  }, [numPages]);
  useEffect(() => {
    epubCurrentPageRef.current = epubCurrentPage;
  }, [epubCurrentPage]);
  useEffect(() => {
    epubPreviewLimitRef.current = allowedPages;
  }, [allowedPages]);
  useEffect(() => {
    isReadModeRef.current = isReadMode;
  }, [isReadMode]);

  // Restore saved page once both PDF is loaded and savedProgress has arrived
  useEffect(() => {
    if (
      !isOpen ||
      !isReadMode ||
      !isPdf ||
      numPages === null ||
      pdfRestoredRef.current
    )
      return;
    if (savedProgress === undefined) return; // still loading

    pdfRestoredRef.current = true;

    if (savedProgress?.currentPage && savedProgress.currentPage > 1) {
      const page = Math.min(savedProgress.currentPage, numPages);
      suppressNextPdfAnimationRef.current = true;
      setCurrentPage(page);
      currentPageRef.current = page;
    }

    restoredRef.current = true;
  }, [isOpen, isReadMode, isPdf, numPages, savedProgress]);

  useEffect(() => {
    if (!isOpen) pdfRestoredRef.current = false;
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      firstPdfPageRef.current = true;
      firstEpubPageRef.current = true;
      suppressNextPdfAnimationRef.current = false;
    }
  }, [isOpen]);

  // PDF navigation
  const maxAccessiblePage = isReadMode
    ? (numPages ?? 1)
    : Math.min(allowedPages ?? 5, numPages ?? allowedPages ?? 5);

  const goToPrev = () => {
    setPageTurnDirection(-1);
    setCurrentPage((p) => {
      const next = Math.max(1, p - 1);
      currentPageRef.current = next;
      scheduleSave();
      return next;
    });
  };

  const goToNext = () => {
    setPageTurnDirection(1);
    setCurrentPage((p) => {
      const next = Math.min(maxAccessiblePage, p + 1);
      currentPageRef.current = next;
      scheduleSave();
      return next;
    });
  };

  // EPUB initialisation
  // Simple — no progress tracking, no restore, no locations.generate()
  // EPUB read mode is handled as download in BookDetailHero and LibraryPage
  useEffect(() => {
    if (!isOpen || fileType !== "epub" || !bookUrl || !epubContainerRef.current)
      return;

    let cancelled = false;

    const initEpub = async () => {
      setEpubLoading(true);
      setEpubError(false);
      setEpubCurrentPage(1);

      try {
        const ePub = (await import("epubjs")).default;
        const book = ePub(bookUrl, { openAs: "opf" });
        epubBookRef.current = book;

        const rendition = book.renderTo(epubContainerRef.current!, {
          width: "100%",
          height: "100%",
          spread: "none",
          allowScriptedContent: true,
        });
        epubRenditionRef.current = rendition;

        await rendition.display();

        if (!cancelled) setEpubLoading(false);

        // Preview only: block keyboard nav past the page limit
        if (!isReadModeRef.current) {
          rendition.on("keyup", (e: KeyboardEvent) => {
            const limit = epubPreviewLimitRef.current ?? 5;
            if (e.key === "ArrowRight" && epubCurrentPageRef.current >= limit) {
              e.stopPropagation();
            }
          });
        }
      } catch (err) {
        console.error("EPUB error:", err);
        if (!cancelled) {
          setEpubLoading(false);
          setEpubError(true);
        }
      }
    };

    initEpub();

    return () => {
      cancelled = true;
      epubRenditionRef.current?.destroy?.();
      epubBookRef.current?.destroy?.();
      epubRenditionRef.current = null;
      epubBookRef.current = null;
    };
  }, [isOpen, fileType, bookUrl]);

  // EPUB navigation
  const epubPrev = () => {
    if (epubCurrentPage <= 1) return;
    setPageTurnDirection(-1);
    setEpubCurrentPage((p) => Math.max(1, p - 1));
    epubRenditionRef.current?.prev();
  };

  const epubNext = () => {
    if (!isReadMode && epubCurrentPage >= (allowedPages ?? 5)) return;
    setPageTurnDirection(1);
    setEpubCurrentPage((p) => p + 1);
    epubRenditionRef.current?.next();
  };

  useEffect(() => {
    if (prefersReducedMotion) return;
    if (firstPdfPageRef.current) {
      firstPdfPageRef.current = false;
      return;
    }
    if (suppressNextPdfAnimationRef.current) {
      suppressNextPdfAnimationRef.current = false;
      return;
    }

    void pdfPageControls.start({
      x: [pageTurnDirection * 32, 0],
      opacity: [0.85, 1],
      scale: [0.995, 1],
      transition: {
        duration: 0.35,
        ease: [0.4, 0, 0.2, 1],
      },
    });
  }, [currentPage, pageTurnDirection, pdfPageControls, prefersReducedMotion]);

  useEffect(() => {
    if (prefersReducedMotion) return;
    if (firstEpubPageRef.current) {
      firstEpubPageRef.current = false;
      return;
    }

    void epubPageControls.start({
      x: [pageTurnDirection * 32, 0],
      opacity: [0.85, 1],
      scale: [0.995, 1],
      transition: {
        duration: 0.35,
        ease: [0.4, 0, 0.2, 1],
      },
    });
  }, [
    epubCurrentPage,
    pageTurnDirection,
    epubPageControls,
    prefersReducedMotion,
  ]);

  // Body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // Footer label
  const footerProgressLabel =
    fileType === "pdf"
      ? numPages
        ? `Page ${currentPage} of ${isReadMode ? numPages : maxAccessiblePage}`
        : "PDF Preview"
      : `Page ${epubCurrentPage} of ${allowedPages ?? "?"}`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative bg-navy rounded-2xl w-full max-w-4xl h-[95vh] max-h-[900px] flex flex-col overflow-hidden sm:max-w-5xl lg:max-w-6xl xl:max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-400">
          <div>
            <h2 className="!text-sm min-[30rem]:!text-lg sm:!text-2xl font-semibold text-golden truncate max-w-lg">
              {bookTitle}
            </h2>
            <p className="text-[10px] sm:text-[11px] text-text-muted mt-0.5">
              <span className="uppercase tracking-wide font-medium text-burgundy mr-1.5">
                {fileType}
              </span>
              {isReadMode
                ? "Full Book"
                : `Preview — first ${allowedPages} pages`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-dark text-text-muted hover:text-text-text-light transition-colors"
            aria-label="Close preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 bg-reader p-2 sm:p-3 lg:p-4">
          <div className="h-full rounded-xl border border-gray-400 bg-dark overflow-hidden">
            {isLoading && (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-golden">
                <Loader2 className="w-8 h-8 animate-spin text-golden-500" />
                <p className="text-sm">
                  Loading{isReadMode ? " book" : " preview"}…
                </p>
              </div>
            )}

            {isError && (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-text-muted">
                <AlertCircle className="w-8 h-8 text-error" />
                <p className="text-sm">
                  {isReadMode
                    ? "Could not load book. Please try again."
                    : "Preview not available for this book."}
                </p>
              </div>
            )}

            {/*  PDF  */}
            {bookUrl && fileType === "pdf" && (
              <div className="h-full flex items-center justify-center bg-reader">
                <div className="w-full h-full flex items-center justify-center p-4">
                  <motion.div
                    className="w-full max-w-[90vw] max-h-[90vh] flex items-center justify-center overflow-hidden"
                    initial={false}
                    animate={pdfPageControls}
                    style={{ willChange: "transform, opacity" }}
                  >
                    <Document
                      file={bookUrl}
                      onLoadSuccess={onDocumentLoadSuccess}
                      loading={
                        <div className="flex flex-col items-center gap-3 py-12 text-text-muted">
                          <Loader2 className="w-8 h-8 animate-spin text-golden" />
                          <span className="text-sm">Parsing PDF…</span>
                        </div>
                      }
                      error={
                        <div className="flex flex-col items-center gap-3 py-12 text-error">
                          <AlertCircle className="w-8 h-8" />
                          <span className="text-sm">Failed to load PDF.</span>
                        </div>
                      }
                    >
                      <Page
                        pageNumber={currentPage}
                        width={Math.min(
                          window.innerWidth < 640 ? 400 : 450,
                          window.innerWidth * 0.85,
                        )}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        className="shadow-2xl ring-1 ring-black/10 bg-text-light"
                      />
                    </Document>
                  </motion.div>
                </div>
              </div>
            )}

            {/* EPUB */}
            {bookUrl && fileType === "epub" && (
              <div className="w-full h-full flex flex-col bg-reader">
                {epubLoading && (
                  <div className="h-full flex flex-col items-center justify-center gap-3 text-text-muted">
                    <Loader2 className="w-8 h-8 animate-spin text-golden" />
                    <p className="text-sm">Loading ePub…</p>
                  </div>
                )}
                {epubError && (
                  <div className="h-full flex flex-col items-center justify-center gap-3 text-text-muted">
                    <AlertCircle className="w-8 h-8 text-error" />
                    <p className="text-sm">Failed to load ePub.</p>
                  </div>
                )}
                <motion.div
                  className="w-[327px] min-[30rem]:w-[400px] sm:w-[560px] h-full overflow-hidden bg-text-light mx-auto"
                  initial={false}
                  animate={epubPageControls}
                  style={{
                    minHeight: "100%",
                    display: epubLoading || epubError ? "none" : "block",
                    willChange: "transform, opacity",
                  }}
                >
                  <div
                    ref={epubContainerRef}
                    className="w-full h-full"
                    style={{ minHeight: "100%" }}
                  />
                </motion.div>
              </div>
            )}
          </div>
        </div>

        {/*  Footer  */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-3 sm:px-4 py-2.5 border-t border-gray-400 bg-black/35">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto order-3 sm:order-1">
            {isReadMode ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 sm:w-7 sm:h-7 rounded-full bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-teal-400" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-golden">
                    Full Book
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-text-muted">
                    {isPdf ? "Progress saves automatically" : "Reading in full"}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 flex-1 sm:flex-none text-center sm:text-left">
                  <div className="w-8 h-8 sm:w-7 sm:h-7 rounded-full bg-burgundy/75 flex items-center justify-center flex-shrink-0">
                    <Lock className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-text-light" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-golden truncate">
                      Preview • {allowedPages} pages
                    </p>
                    <p className="text-[10px] sm:text-[11px] text-text-muted">
                      Buy to unlock full book
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    onBuy();
                    onClose();
                  }}
                  className="flex-1 sm:flex-none btn-ghost btn-sm"
                >
                  Unlock Full Book
                </button>
              </>
            )}
          </div>

          <div className="flex items-center justify-between w-full sm:w-auto gap-2 sm:gap-0 order-1 sm:order-2">
            <span className="text-xs sm:text-sm text-text-muted text-center sm:text-right min-w-[120px] sm:min-w-0">
              {footerProgressLabel}
              {!isReadMode &&
                fileType === "pdf" &&
                numPages &&
                numPages > maxAccessiblePage && (
                  <span className="text-golden block sm:inline ml-0 sm:ml-1 text-[10px] sm:text-xs">
                    ({numPages} total)
                  </span>
                )}
            </span>

            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={fileType === "pdf" ? goToPrev : epubPrev}
                disabled={
                  fileType === "pdf"
                    ? currentPage === 1
                    : epubLoading || epubError || epubCurrentPage <= 1
                }
                className="flex items-center gap-1 px-2.5 py-2 sm:px-2.5 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium text-text-light hover:bg-dark disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
              >
                <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {window.innerWidth < 640 ? "" : "Prev"}
              </button>
              <button
                onClick={fileType === "pdf" ? goToNext : epubNext}
                disabled={
                  fileType === "pdf"
                    ? currentPage === maxAccessiblePage
                    : epubLoading ||
                      epubError ||
                      (!isReadMode && epubCurrentPage >= (allowedPages ?? 5))
                }
                className="flex items-center gap-1 px-2.5 py-2 sm:px-2.5 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium text-text-light hover:bg-dark disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
              >
                {window.innerWidth < 640 ? "" : "Next"}
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookPreview;

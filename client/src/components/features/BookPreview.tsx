import { useState, useCallback, useEffect, useRef } from "react";
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
} from "lucide-react";
import { useBookPreview } from "../../hooks/useBooks";

import type { Book, Rendition } from "epubjs";

// react-pdf requires a PDF.js worker to parse PDF files in the browser.
// Resolve the worker from our installed pdfjs-dist package so Vite bundles it
// correctly instead of relying on a CDN path that may not exist.
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

// Props this component accepts
interface BookPreviewProps {
  bookId: string;
  bookTitle: string;
  fileType: "pdf" | "epub"; // New prop — determines which renderer to use
  isOpen: boolean;
  onClose: () => void;
  onBuy: () => void;
}

const BookPreview = ({
  bookId,
  bookTitle,
  fileType,
  isOpen,
  onClose,
  onBuy,
}: BookPreviewProps) => {
  // numPages: total pages in the PDF as reported by react-pdf after loading
  const [numPages, setNumPages] = useState<number | null>(null); // null until PDF loads

  // currentPage: which page the user is currently viewing (1-indexed)
  const [currentPage, setCurrentPage] = useState(1); // Start on page 1

  // ePub state
  // epubjs renders into a DOM container — we hold a ref to that div
  const epubContainerRef = useRef<HTMLDivElement>(null);
  // We store the epubjs Book and Rendition instances in refs so we can destroy them on close
  const epubBookRef = useRef<Book | null>(null); // epubjs Book instance
  const epubRenditionRef = useRef<Rendition | null>(null); // epubjs Rendition instance
  const [epubLoading, setEpubLoading] = useState(false); // Loading indicator for ePub init
  const [epubError, setEpubError] = useState(false); // Error flag for ePub init
  const [epubCurrentPage, setEpubCurrentPage] = useState(1);

  // Shared data fetch
  // Fetch the signed preview URL from backend — only when modal is open
  const { data, isLoading, isError } = useBookPreview(isOpen ? bookId : null);

  // Called by react-pdf's <Document> when the PDF finishes loading
  // We use it to know how many pages exist in the full file
  const onDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages); // Store total page count from the PDF
      setCurrentPage(1); // Reset to page 1 whenever a new PDF loads
    },
    [],
  ); // No dependencies — this function never changes

  // How many pages the user is allowed to see (comes from backend, defaults to 5)
  const allowedPages = data?.previewPages ?? 5;

  // The page the user can actually navigate to — capped at allowedPages
  // Even if the PDF has 300 pages, they can only go up to allowedPages
  const maxAccessiblePage = Math.min(allowedPages, numPages ?? allowedPages);

  // Go to previous page — never goes below 1
  const goToPrev = () => setCurrentPage((p) => Math.max(1, p - 1));

  // Go to next page — never exceeds the allowed limit
  const goToNext = () =>
    setCurrentPage((p) => Math.min(maxAccessiblePage, p + 1));

  // ePub initialisation
  // This effect runs when: the modal opens, the file type is epub, and the URL is ready.
  // It creates an epubjs Book, renders it into the container div, and locks navigation
  // to the first `previewPages` chapters by intercepting the rendition's location changes.
  useEffect(() => {
    // Only proceed if everything is ready
    if (
      !isOpen ||
      fileType !== "epub" ||
      !data?.previewUrl ||
      !epubContainerRef.current
    )
      return;

    let cancelled = false; // Guard against state updates after the effect has cleaned up

    const initEpub = async () => {
      setEpubLoading(true); // Show loading spinner while epubjs initialises
      setEpubError(false); // Clear any previous error
      setEpubCurrentPage(1);

      try {
        // Dynamically import epubjs — avoids loading it for PDF users
        const ePub = (await import("epubjs")).default;

        // The backend now serves an extracted EPUB preview and returns the OPF URL.
        // This lets epubjs stream the package and chapter assets directly instead of
        // downloading the entire .epub archive before first render.
        const book = ePub(data.previewUrl, { openAs: "opf" });
        epubBookRef.current = book; // Store in ref so we can destroy it on cleanup

        // Create a Rendition — this is the actual reader that renders into a DOM node
        const rendition = book.renderTo(epubContainerRef.current!, {
          width: "100%", // Fill the container width
          height: "100%", // Fill the container height
          spread: "none", // Single-page layout — no side-by-side pages
        });
        epubRenditionRef.current = rendition; // Store in ref so we can destroy it on cleanup

        // Display from the very beginning of the book
        await rendition.display();

        if (!cancelled) setEpubLoading(false); // Hide loading spinner once rendered

        // Keep epubjs keyboard navigation inside the preview limit.
        const limit = data.previewPages ?? 5;
        rendition.on("keyup", (e: KeyboardEvent) => {
          if (e.key === "ArrowRight" && epubCurrentPage >= limit) {
            e.stopPropagation(); // Block the default epubjs next-page behaviour
          }
        });
      } catch (err) {
        console.error("EPUB error:", err);

        // epubjs failed to load or render the file
        if (!cancelled) {
          setEpubLoading(false); // Hide spinner
          setEpubError(true); // Show error message
        }
      }
    };

    initEpub();

    // Cleanup: destroy the epubjs instances when the modal closes or the effect re-runs
    return () => {
      cancelled = true;
      epubRenditionRef.current?.destroy?.(); // Unmount the rendition from the DOM
      epubBookRef.current?.destroy?.(); // Release the book's internal resources
      epubRenditionRef.current = null; // Clear the ref
      epubBookRef.current = null; // Clear the ref
    };
  }, [isOpen, fileType, data?.previewUrl, data?.previewPages]); // Re-run if any of these change

  // ePub navigation controls
  // epubjs navigation uses the Rendition API — .prev() and .next() move between sections
  const epubPrev = () => {
    if (epubCurrentPage <= 1) return;
    setEpubCurrentPage((page) => Math.max(1, page - 1));
    epubRenditionRef.current?.prev();
  };

  const epubNext = () => {
    if (epubCurrentPage >= allowedPages) return;
    setEpubCurrentPage((page) => Math.min(allowedPages, page + 1));
    epubRenditionRef.current?.next();
  };

  // Inactive scrollbar on body
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const footerProgressLabel =
    fileType === "pdf"
      ? numPages
        ? `Page ${currentPage} of ${maxAccessiblePage}`
        : "PDF Preview"
      : `Page ${epubCurrentPage} of ${allowedPages}`;

  // If the modal is closed, render nothing — keeps the DOM clean
  if (!isOpen) return null;

  return (
    // Backdrop — covers the full screen with a semi-transparent dark overlay
    // Clicking the backdrop closes the modal (same as the X button)
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      {/* Modal panel — stop click propagation so clicking inside doesn't close */}
      <div
        className="relative bg-[var(--color-surface)] rounded-2xl w-full max-w-3xl h-[90vh] max-h-[880px] 
        flex flex-col overflow-hidden"
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-border)]">
          <div>
            <h2 className="!text-2xl font-semibold text-[var(--color-text-primary)] truncate max-w-lg">
              {bookTitle} {/* Show the book title */}
            </h2>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
              {/* Show the file type badge and preview limit */}
              <span className="uppercase tracking-wide font-medium text-teal-500 mr-1.5">
                {fileType} {/* 'pdf' or 'epub' */}
              </span>
              Preview — first {allowedPages} pages
            </p>
          </div>
          {/* Close button */}
          <button
            onClick={onClose} // Close the modal
            className="p-2 rounded-lg hover:bg-[var(--color-surface-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
            aria-label="Close preview" // Accessibility label
          >
            <X className="w-5 h-5" /> {/* X icon */}
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 min-h-0 bg-[var(--color-bg)] px-3 py-3">
          <div className="h-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
            {/* Shared loading state — shown while the backend URL is being fetched */}
            {isLoading && (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-[var(--color-text-muted)]">
                <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
                <p className="text-sm">Loading preview…</p>
              </div>
            )}

            {/* Shared error state — shown when the backend returns an error */}
            {isError && (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-[var(--color-text-muted)]">
                <AlertCircle className="w-8 h-8 text-rose-400" />
                <p className="text-sm">Preview not available for this book.</p>
              </div>
            )}

            {/* ── PDF path ── */}
            {data?.previewUrl && fileType === "pdf" && (
              <div className="h-full overflow-auto bg-[var(--color-bg)]">
                <div className="min-h-full flex items-start justify-center p-4">
                  <Document
                    file={data.previewUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={
                      <div className="flex items-center gap-2 text-[var(--color-text-muted)] py-10">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm">Parsing PDF…</span>
                      </div>
                    }
                    error={
                      <div className="flex items-center gap-2 text-rose-400 py-10">
                        <AlertCircle className="w-5 h-5" />
                        <span className="text-sm">Failed to load PDF.</span>
                      </div>
                    }
                  >
                    <Page
                      pageNumber={currentPage}
                      width={Math.min(700, window.innerWidth - 96)}
                      renderTextLayer={false} // Keep the preview feeling like a static page
                      renderAnnotationLayer={false}
                    />
                  </Document>
                </div>
              </div>
            )}

            {/* ── ePub path ── */}
            {data?.previewUrl && fileType === "epub" && (
              <div className="w-full h-full flex flex-col">
                {/* ePub loading spinner — shown while epubjs initialises */}
                {epubLoading && (
                  <div className="h-full flex flex-col items-center justify-center gap-3 text-[var(--color-text-muted)]">
                    <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
                    <p className="text-sm">Loading ePub…</p>
                  </div>
                )}

                {/* ePub error */}
                {epubError && (
                  <div className="h-full flex flex-col items-center justify-center gap-3 text-[var(--color-text-muted)]">
                    <AlertCircle className="w-8 h-8 text-rose-400" />
                    <p className="text-sm">Failed to load ePub.</p>
                  </div>
                )}

                {/* epubjs renders INTO this div — it must always be in the DOM while the modal is open */}
                {/* We hide it (not unmount) during loading so epubjs has a node to attach to */}
                <div
                  ref={epubContainerRef}
                  className="w-full h-full overflow-hidden bg-white"
                  style={{
                    minHeight: "100%",
                    display: epubLoading || epubError ? "none" : "block", // Hide while loading, not unmount
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Footer navigation ── */}
        <div
          className="flex items-center justify-between gap-3 px-4 py-2.5 
          border-t border-[var(--color-border)] bg-[var(--color-surface)]"
        >
          <div className="hidden sm:flex items-center gap-3 text-center">
            <div className="flex items-center gap-2 text-center">
              <div className="w-7 h-7 rounded-full bg-teal-500/10 flex items-center justify-center">
                <Lock className="w-3.5 h-3.5 text-teal-500" />
              </div>
              <div>
                <p className="text-xs font-medium text-[var(--color-text-primary)]">
                  You're reading a preview
                </p>
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  Purchase to unlock the complete book.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                onBuy();
                onClose();
              }}
              className="px-3.5 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-600 
                text-white text-sm font-medium transition-colors whitespace-nowrap"
            >
              Unlock Full Book
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--color-text-muted)] text-right">
              {footerProgressLabel}
              {fileType === "pdf" &&
                numPages &&
                numPages > maxAccessiblePage && (
                  <span className="text-teal-500 ml-1">({numPages} total)</span>
                )}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={fileType === "pdf" ? goToPrev : epubPrev}
                disabled={
                  fileType === "pdf"
                    ? currentPage === 1
                    : epubLoading || epubError || epubCurrentPage <= 1
                }
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Prev
              </button>
              <button
                onClick={fileType === "pdf" ? goToNext : epubNext}
                disabled={
                  fileType === "pdf"
                    ? currentPage === maxAccessiblePage
                    : epubLoading ||
                      epubError ||
                      epubCurrentPage >= allowedPages
                }
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookPreview;

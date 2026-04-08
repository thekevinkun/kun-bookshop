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

import type { Book, Rendition, Location } from "epubjs";

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
    const abortController = new AbortController();

    const initEpub = async () => {
      setEpubLoading(true); // Show loading spinner while epubjs initialises
      setEpubError(false); // Clear any previous error

      try {
        // Dynamically import epubjs — avoids loading it for PDF users
        const ePub = (await import("epubjs")).default;

        // Fetch the signed file first, then open it explicitly as an archived EPUB.
        // Cloudinary raw URLs do not necessarily end with ".epub", which makes epubjs
        // mis-detect the input as a directory and request META-INF/container.xml.
        const response = await fetch(data.previewUrl, {
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch EPUB: ${response.status}`);
        }

        const epubData = await response.arrayBuffer();
        const book = ePub(epubData, { openAs: "epub" });
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

        // ── Preview page limit enforcement for ePub ──
        // epubjs doesn't have a "page" concept like PDFs — it uses CFI location strings.
        // We approximate the limit by counting how many times the user has navigated forward.
        // When they hit the previewPages limit, we stop navigation and show the buy prompt.
        let navigationCount = 0; // Track how many "next" navigations have happened
        const limit = data.previewPages ?? 5; // How many sections the user may navigate through

        // Listen for every location change (every time the user turns a page)
        rendition.on("relocated", (location: Location) => {
          navigationCount = location.start?.displayed?.page ?? navigationCount;
        });

        // Override the keyboard right-arrow and swipe-right to enforce the limit
        rendition.on("keyup", (e: KeyboardEvent) => {
          if (e.key === "ArrowRight" && navigationCount >= limit) {
            e.stopPropagation(); // Block the default epubjs next-page behaviour
          }
        });
      } catch (err) {
        if (abortController.signal.aborted) return;
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
      abortController.abort();
      epubRenditionRef.current?.destroy?.(); // Unmount the rendition from the DOM
      epubBookRef.current?.destroy?.(); // Release the book's internal resources
      epubRenditionRef.current = null; // Clear the ref
      epubBookRef.current = null; // Clear the ref
    };
  }, [isOpen, fileType, data?.previewUrl, data?.previewPages]); // Re-run if any of these change

  // ── ePub navigation controls ───────────────────────────────────────────────
  // epubjs navigation uses the Rendition API — .prev() and .next() move between sections
  const epubPrev = () => epubRenditionRef.current?.prev(); // Go to previous ePub location
  const epubNext = () => epubRenditionRef.current?.next(); // Go to next ePub location

  // Inactive scrollbar on body
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  // If the modal is closed, render nothing — keeps the DOM clean
  if (!isOpen) return null;

  return (
    // Backdrop — covers the full screen with a semi-transparent dark overlay
    // Clicking the backdrop closes the modal (same as the X button)
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      {/* Modal panel — stop click propagation so clicking inside doesn't close */}
      <div className="relative bg-[var(--color-surface)] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] truncate max-w-xs">
              {bookTitle} {/* Show the book title */}
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              {/* Show the file type badge and preview limit */}
              <span className="uppercase tracking-wide font-medium text-teal-500 mr-1.5">
                {fileType} {/* 'pdf' or 'epub' */}
              </span>
              Preview — first {allowedPages}{" "}
              {fileType === "pdf" ? "pages" : "sections"}
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
        <div className="flex-1 overflow-y-auto flex flex-col items-center py-6 px-4 gap-4 bg-[var(--color-bg)]">
          {/* Shared loading state — shown while the backend URL is being fetched */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-[var(--color-text-muted)]">
              <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
              <p className="text-sm">Loading preview…</p>
            </div>
          )}

          {/* Shared error state — shown when the backend returns an error */}
          {isError && (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-[var(--color-text-muted)]">
              <AlertCircle className="w-8 h-8 text-rose-400" />
              <p className="text-sm">Preview not available for this book.</p>
            </div>
          )}

          {/* ── PDF path ── */}
          {data?.previewUrl && fileType === "pdf" && (
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
                width={Math.min(580, window.innerWidth - 80)}
                renderTextLayer={false} // Keep the preview feeling like a static page
                renderAnnotationLayer={false}
              />
            </Document>
          )}

          {/* PDF — locked page CTA */}
          {fileType === "pdf" &&
            numPages &&
            currentPage === maxAccessiblePage &&
            numPages > maxAccessiblePage && (
              <div className="w-full max-w-[580px] rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-6 flex flex-col items-center gap-3 text-center">
                <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-teal-500" />
                </div>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  {numPages - maxAccessiblePage} more page
                  {numPages - maxAccessiblePage !== 1 ? "s" : ""} available
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Purchase this book to read the full content.
                </p>
                <button
                  onClick={() => {
                    onBuy();
                    onClose();
                  }}
                  className="mt-1 px-5 py-2 rounded-lg bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium transition-colors"
                >
                  Buy Now — Unlock Full Book
                </button>
              </div>
            )}

          {/* ── ePub path ── */}
          {data?.previewUrl && fileType === "epub" && (
            <div className="w-full flex flex-col gap-4">
              {/* ePub loading spinner — shown while epubjs initialises */}
              {epubLoading && (
                <div className="flex flex-col items-center justify-center gap-3 py-20 text-[var(--color-text-muted)]">
                  <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
                  <p className="text-sm">Loading ePub…</p>
                </div>
              )}

              {/* ePub error */}
              {epubError && (
                <div className="flex flex-col items-center justify-center gap-3 py-20 text-[var(--color-text-muted)]">
                  <AlertCircle className="w-8 h-8 text-rose-400" />
                  <p className="text-sm">Failed to load ePub.</p>
                </div>
              )}

              {/* epubjs renders INTO this div — it must always be in the DOM while the modal is open */}
              {/* We hide it (not unmount) during loading so epubjs has a node to attach to */}
              <div
                ref={epubContainerRef}
                className="w-full rounded-lg overflow-hidden bg-white"
                style={{
                  height: "500px", // Fixed height — epubjs needs a concrete container size
                  display: epubLoading || epubError ? "none" : "block", // Hide while loading, not unmount
                }}
              />

              {/* ePub buy CTA — always shown at the bottom for ePubs since we can't detect page count */}
              {!epubLoading && !epubError && (
                <div className="w-full rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-5 flex flex-col items-center gap-3 text-center">
                  <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-teal-500" />
                  </div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    You're reading a preview
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Purchase to unlock the complete book.
                  </p>
                  <button
                    onClick={() => {
                      onBuy();
                      onClose();
                    }}
                    className="mt-1 px-5 py-2 rounded-lg bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium transition-colors"
                  >
                    Buy Now — Unlock Full Book
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer navigation ── */}
        {/* PDF navigation */}
        {fileType === "pdf" && numPages && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
            <button
              onClick={goToPrev}
              disabled={currentPage === 1}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Prev
            </button>
            <span className="text-sm text-[var(--color-text-muted)]">
              Page {currentPage} of {maxAccessiblePage}
              {numPages > maxAccessiblePage && (
                <span className="text-teal-500 ml-1">({numPages} total)</span>
              )}
            </span>
            <button
              onClick={goToNext}
              disabled={currentPage === maxAccessiblePage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ePub navigation — prev/next using epubjs Rendition API */}
        {fileType === "epub" && !epubLoading && !epubError && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
            <button
              onClick={epubPrev}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Prev
            </button>
            <span className="text-sm text-[var(--color-text-muted)]">
              ePub Preview
            </span>
            <button
              onClick={epubNext}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookPreview;

import {
  Heart,
  Clock,
  Trash2,
  Loader2,
  AlertCircle,
  Download,
} from "lucide-react";

import type { IBook, IDownloadRecord } from "../../types/book";
import { formatShortDate } from "../../lib/helpers";

interface ActivityCardProps {
  activityTab: "wishlist" | "history";
  setActivityTab: (tab: "wishlist" | "history") => void;

  wishlist: IBook[] | undefined;
  isWishlistLoading: boolean;
  isWishlistError: boolean;

  deduplicatedHistory: IDownloadRecord[] | undefined;
  isHistoryLoading: boolean;
  isHistoryError: boolean;

  removeFromWishlist: (id: string) => void;
  isRemoving: boolean;

  navigate: (path: string) => void;
}

const ActivityCard = ({
  activityTab,
  setActivityTab,
  wishlist,
  isWishlistLoading,
  isWishlistError,
  deduplicatedHistory,
  isHistoryLoading,
  isHistoryError,
  removeFromWishlist,
  isRemoving,
  navigate,
}: ActivityCardProps) => {
  return (
    <div className="flex-1 w-full lg:min-w-0">
      {/* Sub-tab bar */}
      <div className="flex gap-1 bg-text-light/5 border border-text-light/10 rounded-xl p-1 mb-6">
        {/* Wishlist sub-tab */}
        <button
          onClick={() => setActivityTab("wishlist")}
          className={[
            "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
            activityTab === "wishlist"
              ? "bg-golden/85 text-black shadow-sm"
              : "text-gray-400 hover:text-text-light hover:bg-text-light/5",
          ].join(" ")}
        >
          <Heart size={15} />
          Wishlist
          {!isWishlistLoading && wishlist && wishlist.length > 0 && (
            <span
              className={[
                "text-xs font-bold px-1.5 py-0.5 rounded-full",
                activityTab === "wishlist"
                  ? "bg-text-light/55 text-text-dark"
                  : "bg-text-light/10 text-gray-400",
              ].join(" ")}
            >
              {wishlist.length}
            </span>
          )}
        </button>

        {/* Download History sub-tab */}
        <button
          onClick={() => setActivityTab("history")}
          className={[
            "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
            activityTab === "history"
              ? "bg-golden/85 text-black shadow-sm"
              : "text-gray-400 hover:text-text-light hover:bg-text-light/5",
          ].join(" ")}
        >
          <Clock size={15} />
          Download History
          {!isHistoryLoading &&
            deduplicatedHistory &&
            deduplicatedHistory.length > 0 && (
              <span
                className={[
                  "text-xs font-bold px-1.5 py-0.5 rounded-full",
                  activityTab === "history"
                    ? "bg-text-light/55 text-text-dark"
                    : "bg-text-light/10 text-gray-400",
                ].join(" ")}
              >
                {deduplicatedHistory.length}
              </span>
            )}
        </button>
      </div>

      {/* WISHLIST CONTENT */}
      {activityTab === "wishlist" && (
        <div>
          {/* Loading state */}
          {isWishlistLoading && (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-golden/80" size={36} />
            </div>
          )}

          {/* Error state */}
          {isWishlistError && (
            <div className="flex flex-col items-center gap-3 py-20 text-center">
              <AlertCircle className="text-error" size={40} />
              <p className="text-gray-400">
                Failed to load your wishlist. Please try again.
              </p>
            </div>
          )}

          {/* Empty state */}
          {!isWishlistLoading &&
            !isWishlistError &&
            (!wishlist || wishlist.length === 0) && (
              <div className="flex flex-col items-center gap-4 py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-burgundy-500/10 border border-burgundy flex items-center justify-center">
                  <Heart className="text-burgundy opacity-60" size={28} />
                </div>
                <h3 className="text-text-light">Your wishlist is empty</h3>
                <p className="text-gray-500 text-sm max-w-xs">
                  Save books you're interested in — they'll show up here so you
                  can grab them later.
                </p>
                <button
                  onClick={() => navigate("/books")}
                  className="btn-primary mt-2"
                >
                  Browse Books
                </button>
              </div>
            )}

          {/* Wishlist grid */}
          {!isWishlistLoading && wishlist && wishlist.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {wishlist.map((book: IBook) => (
                <div
                  key={book._id}
                  className="group bg-text-light/5 border border-text-light/10 rounded-2xl p-4 
                    flex gap-4 hover:bg-text-light/[0.07] transition-all duration-200"
                >
                  {/* Cover thumbnail */}
                  <img
                    src={book.coverImage}
                    alt={`Cover of ${book.title}`}
                    className="w-16 h-22 object-cover rounded-xl flex-shrink-0 shadow-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "/placeholder-cover.jpg";
                    }}
                  />

                  {/* Book details */}
                  <div className="flex-1 min-w-0 flex flex-col">
                    <h3 className="text-text-light leading-snug line-clamp-2">
                      {book.title}
                    </h3>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {book.authorName}
                    </p>

                    <p className="text-golden/80 font-bold text-base mt-auto pt-2">
                      ${(book.discountPrice ?? book.price).toFixed(2)}
                    </p>

                    {/* Action row */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => navigate(`/books/${book._id}`)}
                        className="flex-1 btn-ghost text-xs py-1.5"
                      >
                        View Book
                      </button>
                      <button
                        onClick={() => removeFromWishlist(book._id)}
                        disabled={isRemoving}
                        title="Remove from wishlist"
                        className="w-8 h-8 flex items-center justify-center rounded-lg border 
                          border-text-light/10 text-gray-500 hover:text-red-400 hover:border-red-500/20
                          hover:bg-red-500/10 disabled:opacity-50 transition-all duration-200"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DOWNLOAD HISTORY CONTENT */}
      {activityTab === "history" && (
        <div>
          {/* Loading state */}
          {isHistoryLoading && (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-golden/80" size={36} />
            </div>
          )}

          {/* Error state */}
          {isHistoryError && (
            <div className="flex flex-col items-center gap-3 py-20 text-center">
              <AlertCircle className="text-error" size={40} />
              <p className="text-gray-400">
                Failed to load download history. Please try again.
              </p>
            </div>
          )}

          {/* Empty state */}
          {!isHistoryLoading &&
            !isHistoryError &&
            (!deduplicatedHistory || deduplicatedHistory.length === 0) && (
              <div className="flex flex-col items-center gap-4 py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-golden border border-golden flex items-center justify-center">
                  <Clock className="text-text-dark" size={28} />
                </div>
                <h3 className="text-text-light">No downloads yet</h3>
                <p className="text-gray-500 text-sm max-w-xs">
                  Your download history will appear here after you download a
                  book from your library.
                </p>
              </div>
            )}

          {/* History list */}
          {!isHistoryLoading &&
            deduplicatedHistory &&
            deduplicatedHistory.length > 0 && (
              <div className="space-y-3">
                {deduplicatedHistory.map(
                  (record: IDownloadRecord, index: number) => (
                    <div
                      key={record._id}
                      className="bg-text-light/5 border border-text-light/10 rounded-xl p-4 flex 
                    items-center gap-4 hover:border-text-light/20 transition-colors duration-200"
                    >
                      {/* Row index number */}
                      <span className="text-gray-600 text-xs font-mono w-5 text-right flex-shrink-0">
                        {index + 1}
                      </span>

                      {/* Download icon badge */}
                      <div className="w-9 h-9 rounded-xl bg-golden border border-golden flex items-center justify-center flex-shrink-0">
                        <Download size={15} className="text-black" />
                      </div>

                      {/* Book info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-text-light text-sm font-medium line-clamp-1">
                          {record.bookId?.title ?? "Unknown Book"}
                        </p>
                        <p className="text-gray-500 text-xs mt-0.5">
                          {record.bookId?.authorName ?? ""}
                        </p>
                      </div>

                      {/* Date */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-gray-400 text-xs">
                          {formatShortDate(record.downloadedAt)}
                        </p>
                        <p className="text-gray-600 text-xs mt-0.5">
                          Downloaded
                        </p>
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
        </div>
      )}
    </div>
  );
};

export default ActivityCard;

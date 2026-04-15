// Import useState for managing the active tab on the right panel
import { useState } from "react";

// Import useNavigate to redirect unauthenticated users and handle navigation
import { useNavigate, Link } from "react-router-dom";

// Import our React Query hooks for wishlist and download history data
import {
  useWishlist,
  useDownloadHistory,
  useRemoveFromWishlist,
} from "../../hooks/useLibrary";

// Import the auth store to get the logged-in user's info
import { useAuthStore } from "../../store/auth";

// Import icons from lucide-react for the UI elements
import {
  Heart,
  Clock,
  Trash2,
  Loader2,
  AlertCircle,
  Download,
  BookOpen,
  BadgeCheck,
  ShoppingBag,
  KeyRound,
  Pencil,
} from "lucide-react";

import type { IBook, IDownloadRecord } from "../../types/book";

import { formatShortDate } from "../../lib/helpers";

// The two tabs available on the right panel
type RightTab = "wishlist" | "history";

export default function ProfilePage() {
  // Get the logged-in user from the auth store
  const { user } = useAuthStore();

  // Hook for navigation
  const navigate = useNavigate();

  // Track which right-panel tab is active — default to wishlist
  const [activeTab, setActiveTab] = useState<RightTab>("wishlist");

  // Fetch wishlist data from the backend
  const {
    data: wishlist,
    isLoading: isWishlistLoading,
    isError: isWishlistError,
  } = useWishlist();

  // Fetch download history data from the backend
  const {
    data: downloadHistory,
    isLoading: isHistoryLoading,
    isError: isHistoryError,
  } = useDownloadHistory();

  // Deduplicate download history — one entry per book per day
  // Used for display counts and the history list itself
  const deduplicatedHistory = downloadHistory
    ? downloadHistory.filter(
        (record: IDownloadRecord, index: number, self: IDownloadRecord[]) => {
          const dateKey = new Date(record.downloadedAt).toLocaleDateString();
          const bookId = record.bookId?._id ?? record.bookId;
          const key = `${bookId}-${dateKey}`;
          return (
            index ===
            self.findIndex((r: IDownloadRecord) => {
              const rDateKey = new Date(r.downloadedAt).toLocaleDateString();
              const rBookId = r.bookId?._id ?? r.bookId;
              return `${rBookId}-${rDateKey}` === key;
            })
          );
        },
      )
    : [];

  // Mutation to remove a book from the wishlist
  const { mutate: removeFromWishlist, isPending: isRemoving } =
    useRemoveFromWishlist();

  // Client-side auth guard — redirect to login if not logged in
  if (!user) {
    navigate("/login");
    return null;
  }

  // Get the user's initials for the avatar circle
  // e.g. "Kevin Mahendra" → "KM"
  const initials = [user.firstName?.charAt(0), user.lastName?.charAt(0)]
    .filter(Boolean)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen">
      <div className="container-page py-12">
        {/*
            OUTER LAYOUT — left profile card + right content panel
            On mobile: stacked vertically. On desktop: side by side.
        */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* 
              LEFT — Profile Card
           */}
          <div className="w-full lg:w-82 flex-shrink-0">
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              {/* Card top banner — decorative teal gradient strip like the reference image */}
              <div className="h-24 bg-gradient-to-br from-teal-600/40 via-teal-500/20 to-transparent relative">
                {/* Subtle dot pattern overlay for texture */}
                <div
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle, white 1px, transparent 1px)",
                    backgroundSize: "16px 16px",
                  }}
                />
              </div>

              {/* Avatar — overlaps the banner by pulling it up with negative margin */}
              <div className="px-6 pb-6">
                <div className="flex items-end justify-between -mt-10 mb-4">
                  {/* Avatar circle with initials */}
                  <div
                    className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-400 
                      to-teal-600 flex items-center justify-center text-text-light font-bold 
                      text-2xl border-4 border-dark shadow-xl"
                  >
                    {initials}
                  </div>

                  {/* Role badge — top right of avatar row */}
                  <div
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full 
                    bg-teal-500/15 border border-teal-500/30 text-teal-400 text-xs font-medium capitalize"
                  >
                    <BadgeCheck size={13} />
                    {user.role}
                  </div>
                </div>

                {/* Name and email */}
                <h2 className="text-text-light leading-tight">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-gray-400 text-sm mt-0.5">{user.email}</p>

                {/* Divider */}
                <div className="border-t border-white/10 my-5" />

                {/* Stats row — wishlist count and download count */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Wishlist count stat */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                      <Heart size={12} />
                      Wishlist
                    </div>
                    <p className="text-text-light font-bold text-xl">
                      {/* Show count or dash while loading */}
                      {isWishlistLoading ? "—" : (wishlist?.length ?? 0)}
                    </p>
                  </div>

                  {/* Download history count stat */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                      <Download size={12} />
                      Downloads
                    </div>
                    <p className="text-text-light font-bold text-xl">
                      {isHistoryLoading
                        ? "—"
                        : (deduplicatedHistory?.length ?? 0)}
                    </p>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-white/10 my-5" />

                {/* Profile detail rows */}
                <div className="space-y-4">
                  {/* First name */}
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wider font-medium mb-0.5">
                      First Name
                    </p>
                    <p className="text-text-light text-sm">{user.firstName}</p>
                  </div>

                  {/* Last name */}
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wider font-medium mb-0.5">
                      Last Name
                    </p>
                    <p className="text-text-light text-sm">{user.lastName}</p>
                  </div>

                  {/* Email */}
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wider font-medium mb-0.5">
                      Email
                    </p>
                    <p className="text-text-light text-sm break-all">{user.email}</p>
                  </div>

                  {/* Account type */}
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wider font-medium mb-0.5">
                      Account Type
                    </p>
                    <p className="text-text-light text-sm capitalize">{user.role}</p>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-white/10 my-5" />

                {/* Go to Library CTA */}
                <button
                  onClick={() => navigate("/library")}
                  className="w-full flex items-center justify-center gap-2 btn-primary text-sm"
                >
                  <BookOpen size={15} />
                  My Library
                </button>

                {/* Quick links to sub-pages */}
                <div className="flex flex-col gap-2 w-full mt-2">
                  <Link
                    to="/profile/edit"
                    className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg border border-text-light text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
                  >
                    <Pencil className="w-4 h-4" />{" "}
                    {/* Import Pencil from lucide-react */}
                    Edit Profile
                  </Link>
                  <Link
                    to="/profile/orders"
                    className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg border border-text-light text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
                  >
                    <ShoppingBag className="w-4 h-4" />{" "}
                    {/* Import ShoppingBag from lucide-react */}
                    Order History
                  </Link>
                  <Link
                    to="/profile/password"
                    className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg border border-text-light text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
                  >
                    <KeyRound className="w-4 h-4" />{" "}
                    {/* Import KeyRound from lucide-react */}
                    Change Password
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — Tabbed Content Panel */}
          <div className="flex-1 w-full lg:min-w-0">
            {/* Tab bar */}
            <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1 mb-6">
              {/* Wishlist tab */}
              <button
                onClick={() => setActiveTab("wishlist")}
                className={[
                  "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  activeTab === "wishlist"
                    ? "bg-teal-500 text-text-light shadow-sm"
                    : "text-gray-400 hover:text-text-light hover:bg-white/5",
                ].join(" ")}
              >
                <Heart size={15} />
                Wishlist
                {/* Show count badge on the tab when data is loaded */}
                {!isWishlistLoading && wishlist && wishlist.length > 0 && (
                  <span
                    className={[
                      "text-xs font-bold px-1.5 py-0.5 rounded-full",
                      activeTab === "wishlist"
                        ? "bg-white/20 text-text-light"
                        : "bg-white/10 text-gray-400",
                    ].join(" ")}
                  >
                    {wishlist.length}
                  </span>
                )}
              </button>

              {/* Download History tab */}
              <button
                onClick={() => setActiveTab("history")}
                className={[
                  "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  activeTab === "history"
                    ? "bg-teal-500 text-text-light shadow-sm"
                    : "text-gray-400 hover:text-text-light hover:bg-white/5",
                ].join(" ")}
              >
                <Clock size={15} />
                Download History
                {/* Count badge for history tab */}
                {!isHistoryLoading &&
                  deduplicatedHistory &&
                  deduplicatedHistory.length > 0 && (
                    <span
                      className={[
                        "text-xs font-bold px-1.5 py-0.5 rounded-full",
                        activeTab === "history"
                          ? "bg-white/20 text-text-light"
                          : "bg-white/10 text-gray-400",
                      ].join(" ")}
                    >
                      {deduplicatedHistory.length}
                    </span>
                  )}
              </button>
            </div>

            {/* WISHLIST TAB CONTENT */}
            {activeTab === "wishlist" && (
              <div>
                {/* Loading */}
                {isWishlistLoading && (
                  <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-teal-400" size={36} />
                  </div>
                )}

                {/* Error */}
                {isWishlistError && (
                  <div className="flex flex-col items-center gap-3 py-20 text-center">
                    <AlertCircle className="text-red-400" size={40} />
                    <p className="text-gray-400">
                      Failed to load your wishlist. Please try again.
                    </p>
                  </div>
                )}

                {/* Empty */}
                {!isWishlistLoading &&
                  !isWishlistError &&
                  (!wishlist || wishlist.length === 0) && (
                    <div className="flex flex-col items-center gap-4 py-20 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                        <Heart className="text-rose-400 opacity-60" size={28} />
                      </div>
                      <h3 className="text-text-light">Your wishlist is empty</h3>
                      <p className="text-gray-500 text-sm max-w-xs">
                        Save books you're interested in — they'll show up here
                        so you can grab them later.
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
                        className="group bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-4 hover:border-teal-500/30 hover:bg-white/[0.07] transition-all duration-200"
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

                          {/* Price */}
                          <p className="text-teal-400 font-bold text-base mt-auto pt-2">
                            ${(book.discountPrice ?? book.price).toFixed(2)}
                          </p>

                          {/* Action row */}
                          <div className="flex items-center gap-2 mt-2">
                            {/* View book detail */}
                            <button
                              onClick={() => navigate(`/books/${book._id}`)}
                              className="flex-1 btn-ghost text-xs py-1.5"
                            >
                              View Book
                            </button>

                            {/* Remove from wishlist — icon only, red on hover */}
                            <button
                              onClick={() => removeFromWishlist(book._id)}
                              disabled={isRemoving}
                              title="Remove from wishlist"
                              className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 text-gray-500 hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/10 disabled:opacity-50 transition-all duration-200"
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

            {/* DOWNLOAD HISTORY TAB CONTENT */}
            {activeTab === "history" && (
              <div>
                {/* Loading */}
                {isHistoryLoading && (
                  <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-teal-400" size={36} />
                  </div>
                )}

                {/* Error */}
                {isHistoryError && (
                  <div className="flex flex-col items-center gap-3 py-20 text-center">
                    <AlertCircle className="text-red-400" size={40} />
                    <p className="text-gray-400">
                      Failed to load download history. Please try again.
                    </p>
                  </div>
                )}

                {/* Empty */}
                {!isHistoryLoading &&
                  !isHistoryError &&
                  (!deduplicatedHistory ||
                    deduplicatedHistory.length === 0) && (
                    <div className="flex flex-col items-center gap-4 py-20 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                        <Clock className="text-teal-400 opacity-60" size={28} />
                      </div>
                      <h3 className="text-text-light">No downloads yet</h3>
                      <p className="text-gray-500 text-sm max-w-xs">
                        Your download history will appear here after you
                        download a book from your library.
                      </p>
                    </div>
                  )}

                {/* Download history list */}
                {!isHistoryLoading &&
                  deduplicatedHistory &&
                  deduplicatedHistory.length > 0 && (
                    <div className="space-y-3">
                      {/* Deduplicate records — keep only one entry per book per day
                          If the user downloads the same book 10 times today, show it once.
                          If they download it again tomorrow, that gets its own row.
                          We do this on the frontend so the backend audit log stays complete. */}
                      {deduplicatedHistory
                        .filter(
                          (
                            record: IDownloadRecord,
                            index: number,
                            self: IDownloadRecord[],
                          ) => {
                            // Build a key that combines the book ID + the calendar date of the download
                            const dateKey = new Date(
                              record.downloadedAt,
                            ).toLocaleDateString();
                            const bookId = record.bookId?._id ?? record.bookId;
                            const key = `${bookId}-${dateKey}`;

                            // Keep this record only if it's the FIRST occurrence of this key
                            // findIndex returns the index of the first match — if it matches our current index, keep it
                            return (
                              index ===
                              self.findIndex((r: IDownloadRecord) => {
                                const rDateKey = new Date(
                                  r.downloadedAt,
                                ).toLocaleDateString();
                                const rBookId = r.bookId?._id ?? r.bookId;
                                return `${rBookId}-${rDateKey}` === key;
                              })
                            );
                          },
                        )
                        .map((record: IDownloadRecord, index: number) => (
                          <div
                            key={record._id}
                            className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4 hover:border-white/20 transition-colors duration-200"
                          >
                            {/* Index number — gives it a ranked list feel */}
                            <span className="text-gray-600 text-xs font-mono w-5 text-right flex-shrink-0">
                              {index + 1}
                            </span>

                            {/* Download icon badge */}
                            <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center flex-shrink-0">
                              <Download size={15} className="text-teal-400" />
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

                            {/* Date — pushed to the far right */}
                            <div className="text-right flex-shrink-0">
                              <p className="text-gray-400 text-xs">
                                {formatShortDate(record.downloadedAt)}
                              </p>
                              <p className="text-gray-600 text-xs mt-0.5">
                                Downloaded
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

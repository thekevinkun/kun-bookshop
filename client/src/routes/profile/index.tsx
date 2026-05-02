import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

import {
  useWishlist,
  useDownloadHistory,
  useRemoveFromWishlist,
} from "../../hooks/useLibrary";

import { useAuthStore } from "../../store/auth";

import { Heart, User } from "lucide-react";

import { ActivityCard, ProfileCard } from "../../components/cards";
import SEO from "../../components/common/SEO";

import type { IDownloadRecord } from "../../types/book";
import api from "../../lib/api";

// Which top-level tab is active on mobile/tablet (below lg)
type MobileTab = "profile" | "activity";

// Which sub-tab is active inside the Activity panel (both mobile and desktop)
type ActivityTab = "wishlist" | "history";

export default function ProfilePage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Mobile/tablet top-level tab — default to "profile" since user just
  // tapped the Profile icon in the bottom nav
  const [mobileTab, setMobileTab] = useState<MobileTab>("profile");

  // Sub-tab inside the Activity/right panel — default to wishlist
  const [activityTab, setActivityTab] = useState<ActivityTab>("wishlist");

  // Data fetching
  const {
    data: wishlist,
    isLoading: isWishlistLoading,
    isError: isWishlistError,
  } = useWishlist();

  const {
    data: downloadHistory,
    isLoading: isHistoryLoading,
    isError: isHistoryError,
  } = useDownloadHistory();

  // Deduplicate download history — one entry per book per calendar day
  // The backend stores every individual download for audit purposes,
  // but the UI only needs to show one row per book per day.
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

  const { mutate: removeFromWishlist, isPending: isRemoving } =
    useRemoveFromWishlist();

  // Auth guard
  if (!user) {
    navigate("/login");
    return null;
  }

  // Logout
  // Same logic as Navbar — call server endpoint, then always clear local state
  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Even if the server call fails, wipe local state
    } finally {
      queryClient.clear(); // Prevents previous user's cached data bleeding in
      logout();
      navigate("/login");
    }
  };

  // User initials for the avatar fallback, e.g. "Kevin Mahendra" → "KM"
  const initials = [user.firstName?.charAt(0), user.lastName?.charAt(0)]
    .filter(Boolean)
    .join("")
    .toUpperCase();

  return (
    <>
      <SEO
        title="My Profile"
        description="Manage your Kun Bookshop account settings and preferences."
        url="/profile"
        noIndex={true}
      />

      <main className="min-h-screen">
        <div className="container-page py-12">
          {/* MOBILE / TABLET LAYOUT (below lg)
              Two top-level tabs: "Profile" and "Activity".
              Completely hidden on lg+ where the desktop layout takes over.
          */}
          <div className="lg:hidden">
            {/* Top-level tab switcher */}
            <div className="flex gap-1 bg-text-light/5 border border-text-light/10 rounded-xl p-1 mb-6">
              <button
                onClick={() => setMobileTab("profile")}
                className={[
                  "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  mobileTab === "profile"
                    ? "bg-golden/85 text-black shadow-sm"
                    : "text-gray-400 hover:text-text-light hover:bg-text-light/5",
                ].join(" ")}
              >
                <User size={15} />
                Profile
              </button>
              <button
                onClick={() => setMobileTab("activity")}
                className={[
                  "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  mobileTab === "activity"
                    ? "bg-golden/85 text-black shadow-sm"
                    : "text-gray-400 hover:text-text-light hover:bg-text-light/5",
                ].join(" ")}
              >
                <Heart size={15} />
                Activity
                {/* Badge shows total items across both sub-tabs */}
                {(wishlist?.length ?? 0) + (deduplicatedHistory?.length ?? 0) >
                  0 && (
                  <span
                    className={[
                      "text-xs font-bold px-1.5 py-0.5 rounded-full",
                      mobileTab === "activity"
                        ? "bg-text-light/55 text-text-dark"
                        : "bg-text-light/10 text-gray-400",
                    ].join(" ")}
                  >
                    {(wishlist?.length ?? 0) +
                      (deduplicatedHistory?.length ?? 0)}
                  </span>
                )}
              </button>
            </div>

            {/* Render the active top-level tab */}
            {mobileTab === "profile" && (
              <ProfileCard
                user={user}
                initials={initials}
                wishlistCount={wishlist?.length ?? 0}
                downloadCount={deduplicatedHistory.length}
                isWishlistLoading={isWishlistLoading}
                isHistoryLoading={isHistoryLoading}
                handleLogout={handleLogout}
                navigate={navigate}
              />
            )}

            {mobileTab === "activity" && (
              <ActivityCard
                activityTab={activityTab}
                setActivityTab={setActivityTab}
                wishlist={wishlist}
                isWishlistLoading={isWishlistLoading}
                isWishlistError={isWishlistError}
                deduplicatedHistory={deduplicatedHistory}
                isHistoryLoading={isHistoryLoading}
                isHistoryError={isHistoryError}
                removeFromWishlist={removeFromWishlist}
                isRemoving={isRemoving}
                navigate={navigate}
              />
            )}
          </div>

          {/* DESKTOP LAYOUT (lg and above)
              Original two-column layout — untouched.
              Completely hidden below lg where the mobile tabs take over.
          */}
          <div className="hidden lg:flex flex-row gap-6 items-start">
            <ProfileCard
              user={user}
              initials={initials}
              wishlistCount={wishlist?.length ?? 0}
              downloadCount={deduplicatedHistory.length}
              isWishlistLoading={isWishlistLoading}
              isHistoryLoading={isHistoryLoading}
              handleLogout={handleLogout}
              navigate={navigate}
            />

            <ActivityCard
              activityTab={activityTab}
              setActivityTab={setActivityTab}
              wishlist={wishlist}
              isWishlistLoading={isWishlistLoading}
              isWishlistError={isWishlistError}
              deduplicatedHistory={deduplicatedHistory}
              isHistoryLoading={isHistoryLoading}
              isHistoryError={isHistoryError}
              removeFromWishlist={removeFromWishlist}
              isRemoving={isRemoving}
              navigate={navigate}
            />
          </div>
        </div>
      </main>
    </>
  );
}

import { Link } from "react-router-dom";
import {
  Heart,
  Download,
  BookOpen,
  BadgeCheck,
  ShoppingBag,
  KeyRound,
  Pencil,
  LogOut,
} from "lucide-react";

import type { User } from "../../types/auth";

interface ProfileCardProps {
  user: User;
  initials: string;
  wishlistCount: number;
  downloadCount: number;
  isWishlistLoading: boolean;
  isHistoryLoading: boolean;
  handleLogout: () => void;
  navigate: (path: string) => void;
}

const ProfileCard = ({
  user,
  initials,
  wishlistCount,
  downloadCount,
  isWishlistLoading,
  isHistoryLoading,
  handleLogout,
  navigate,
}: ProfileCardProps) => {
  return (
    <div className="w-full lg:w-82 flex-shrink-0">
      <div className="bg-text-light/5 border border-text-light/10 rounded-2xl overflow-hidden">
        {/* Decorative golden gradient banner at the top of the card */}
        <div className="z-10 h-24 bg-gradient-to-br from-golden/75 via-golden/50 to-transparent relative">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "radial-gradient(circle, text-light 1px, transparent 1px)",
              backgroundSize: "16px 16px",
            }}
          />
        </div>

        <div className="px-6 pb-6">
          {/* Avatar — overlaps the banner via negative margin */}
          <div className="z-20 relative flex items-end justify-between -mt-10 mb-4">
            {user?.avatar ? (
              <div className="w-22 h-22 rounded-2xl border-4 border-dark shadow-xl">
                <img
                  src={user.avatar}
                  alt={user.firstName}
                  className="w-full h-full rounded-lg object-cover"
                />
              </div>
            ) : (
              <div
                className="w-22 h-22 rounded-2xl bg-[linear-gradient(135deg,#f8fafc_0%,#e6be77_100%)]
                flex items-center justify-center text-black font-bold 
                text-2xl border-4 border-dark shadow-xl"
              >
                {initials}
              </div>
            )}

            {/* Role badge */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full 
              bg-golden/21 border border-golden text-golden/85 text-xs font-medium capitalize"
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

          <div className="border-t border-text-light/10 my-5" />

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-text-light/5 border border-text-light/10 rounded-xl p-3 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                <Heart size={12} />
                Wishlist
              </div>
              <p className="text-text-light font-bold text-xl">
                {isWishlistLoading ? "—" : wishlistCount}
              </p>
            </div>
            <div className="bg-text-light/5 border border-text-light/10 rounded-xl p-3 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                <Download size={12} />
                Downloads
              </div>
              <p className="text-text-light font-bold text-xl">
                {isHistoryLoading ? "—" : downloadCount}
              </p>
            </div>
          </div>

          <div className="border-t border-text-light/10 my-5" />

          {/* Profile detail rows */}
          <div className="space-y-4">
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wider font-medium mb-0.5">
                First Name
              </p>
              <p className="text-text-light text-sm">{user.firstName}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wider font-medium mb-0.5">
                Last Name
              </p>
              <p className="text-text-light text-sm">{user.lastName}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wider font-medium mb-0.5">
                Email
              </p>
              <p className="text-text-light text-sm break-all">{user.email}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wider font-medium mb-0.5">
                Account Type
              </p>
              <p className="text-text-light text-sm capitalize">{user.role}</p>
            </div>
          </div>

          <div className="border-t border-text-light/10 my-5" />

          {/* Go to Library CTA */}
          <button
            onClick={() => navigate("/library")}
            className="w-full flex items-center justify-center gap-2 btn-primary text-sm"
          >
            <BookOpen size={15} />
            My Library
          </button>

          {/* Quick links */}
          <div className="flex flex-col gap-2 w-full mt-2">
            <Link
              to="/profile/edit"
              className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg 
              border border-[#d1d1d1] text-sm text-text-muted hover:bg-navy transition-colors"
            >
              <Pencil className="w-4 h-4" />
              Edit Profile
            </Link>
            <Link
              to="/profile/orders"
              className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg 
              border border-[#d1d1d1] text-sm text-text-muted hover:bg-navy transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              Order History
            </Link>
            <Link
              to="/profile/password"
              className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg 
              border border-[#d1d1d1] text-sm text-text-muted hover:bg-navy transition-colors"
            >
              <KeyRound className="w-4 h-4" />
              Change Password
            </Link>

            {/* 
              Logout — only rendered on mobile/tablet (below md).
              On desktop the logout lives in the Navbar avatar dropdown.
              On mobile the BottomNav has no logout, so it lives here.
            */}
            <button
              onClick={handleLogout}
              className="flex md:hidden items-center justify-center gap-2 w-full px-4 py-2 
              rounded-lg border border-red-500/30 text-sm text-error 
              hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Log out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;

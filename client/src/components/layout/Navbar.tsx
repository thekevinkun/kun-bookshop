import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

// Import useQueryClient so we can wipe the cache on logout
import { useQueryClient } from "@tanstack/react-query";

import {
  ShoppingCart,
  User,
  LogOut,
  LayoutDashboard,
  Library,
} from "lucide-react";

import { useCartStore } from "../../store/cart";
import { useAuthStore } from "../../store/auth";

import { CouponBanner } from ".";
import { CartDrawer } from "../features";

import api from "../../lib/api";

const Navbar = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Tracks whether the avatar dropdown is open — needed to drive the exit animation
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { itemCount } = useCartStore();

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Even if server call fails, clear local state
    } finally {
      // Wipe ALL cached query data — prevents previous user's data bleeding into next session
      queryClient.clear();
      logout();
      navigate("/login");
    }
  };

  // Listen for the 'open-cart' custom event fired by BookDetailHero
  // when the user clicks "View in Cart" on a book already in their cart
  useEffect(() => {
    const handleOpenCart = () => setIsCartOpen(true);
    window.addEventListener("open-cart", handleOpenCart);
    // Clean up the listener when Navbar unmounts — prevents memory leaks
    return () => window.removeEventListener("open-cart", handleOpenCart);
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 12);

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        isScrolled
          ? "border-b border-golden/15 bg-navy/88 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.28)]"
          : "bg-navy"
      }`}
    >
      {/* Coupon announcement banner — only visible on homepage, auto-hides when no active coupons */}
      <CouponBanner />

      <div className="relative container-page py-0 h-16 flex items-center justify-between">
        {/* Background texture on home and book detail pages */}
        {location.pathname === "/" ||
        location.pathname.startsWith("/books/") ? (
          <div
            style={{
              backgroundImage: "url('/images/bg-texture.jpg')",
              backgroundRepeat: "no-repeat",
              backgroundSize: "cover",
            }}
            className="absolute inset-0 opacity-10 pointer-events-none"
          />
        ) : null}

        {/* Logo
            Visible on ALL screen sizes. On mobile this is justify-between
            with just the cart, so it naturally sits on the left.
        */}
        <Link to="/" className="flex items-center">
          <img
            src="/images/logo.webp"
            alt="Logo"
            className="w-7 h-7 sm:w-8 sm:h-8 object-cover"
          />
          <span className="text-gradient-secondary font-cinzel font-medium text-base sm:text-xl">
            un <span className="text-golden">Bookshop</span>
          </span>
        </Link>

        {/* Desktop nav links (hidden on mobile) */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            to="/books"
            className="text-text-muted hover:text-golden text-sm font-medium transition-colors"
          >
            Browse
          </Link>
          {user?.role === "admin" && (
            <Link
              to="/admin"
              className="text-text-muted hover:text-golden text-sm font-medium transition-colors"
            >
              Dashboard
            </Link>
          )}
        </div>

        {/* Desktop right-side controls (avatar dropdown + cart + auth buttons) */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {/* Cart button — desktop only */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative inline-flex h-9 items-center justify-center pr-1 
                  text-text-muted hover:text-text-light transition-colors cursor-pointer"
                aria-label="Open cart"
              >
                <ShoppingCart size={20} strokeWidth={2.1} />
                {/* Badge showing how many books are in the cart */}
                {itemCount() > 0 && (
                  <span
                    className="absolute -top-1 -right-1.5 min-w-4.5 h-4.5 px-1 
                    bg-burgundy text-text-light text-[10px] font-bold 
                    rounded-full flex items-center justify-center leading-none"
                  >
                    {itemCount()}
                  </span>
                )}
              </button>

              {/* RADIX DROPDOWN MENU */}
              <DropdownMenu.Root modal={false} onOpenChange={setDropdownOpen}>
                {/* The button that opens the dropdown */}
                <DropdownMenu.Trigger asChild>
                  <button
                    className="flex h-9 w-9 items-center justify-center rounded-full
                      text-text-light transition-colors group hover:border-golden/35 
                      hover:bg-text-light/[0.06] focus-visible:border-white cursor-pointer"
                    aria-label="Open account menu"
                  >
                    {/* Avatar image or initials fallback */}
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.firstName}
                        className="h-9 w-9 rounded-full object-cover group-hover:opacity-90 transition-opacity duration-200"
                      />
                    ) : (
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-full 
                          backdrop-blur-md border-2 border-golden/80
                          text-[11px] font-bold tracking-[0.08em] text-text-light"
                      >
                        {user?.firstName?.[0]}
                        {user?.lastName?.[0]}
                      </div>
                    )}
                  </button>
                </DropdownMenu.Trigger>

                {/* Radix handles the portal, positioning, and accessibility */}
                <DropdownMenu.Portal forceMount>
                  <AnimatePresence mode="wait">
                    {dropdownOpen && (
                      <DropdownMenu.Content
                        forceMount
                        align="end"
                        sideOffset={8}
                        className="min-w-48 bg-card border border-bg-hover rounded-xl shadow-2xl px-1.5 py-2 z-50"
                        asChild
                      >
                        <motion.div
                          initial={{
                            opacity: 0,
                            scale: 0.8,
                            rotateX: -20,
                            rotateY: 10,
                            y: 30,
                          }}
                          animate={{
                            opacity: 1,
                            scale: 1,
                            rotateX: 0,
                            rotateY: 0,
                            y: 0,
                          }}
                          exit={{
                            opacity: 0,
                            scale: 0.8,
                            rotateX: 10,
                            rotateY: -5,
                            y: -10,
                          }}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 20,
                            mass: 0.6,
                          }}
                        >
                          {/* User info header */}
                          {user?.avatar ? (
                            <div className="flex items-center gap-3 px-3 py-2 mb-1">
                              <img
                                src={user.avatar}
                                alt={user.firstName}
                                className="h-13.5 w-13.5 rounded-full object-cover"
                              />
                              <div>
                                <p className="text-text-light text-sm font-semibold">
                                  {user?.firstName} {user?.lastName}
                                </p>
                                <p className="text-text-muted text-xs">
                                  {user?.email}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="px-3 py-2 mb-1">
                              <p className="text-text-light text-sm font-semibold">
                                {user?.firstName} {user?.lastName}
                              </p>
                              <p className="text-text-muted text-xs">
                                {user?.email}
                              </p>
                            </div>
                          )}

                          <DropdownMenu.Separator className="h-px bg-bg-hover my-1" />

                          {/* My Library */}
                          <DropdownMenu.Item asChild>
                            <Link
                              to="/library"
                              className="flex items-center gap-2 px-3 py-2 text-sm
                              text-text-muted rounded-lg cursor-pointer hover:bg-bg-hover
                              hover:text-golden focus:outline-none focus:bg-bg-hover focus:text-golden
                              transition-colors duration-150"
                            >
                              <Library size={15} />
                              My Library
                            </Link>
                          </DropdownMenu.Item>

                          {/* Profile */}
                          <DropdownMenu.Item asChild>
                            <Link
                              to="/profile"
                              className="flex items-center gap-2 px-3 py-2 text-sm
                              text-text-muted rounded-lg cursor-pointer
                              hover:bg-bg-hover hover:text-golden focus:outline-none focus:bg-bg-hover 
                              focus:text-golden transition-colors duration-150"
                            >
                              <User size={15} />
                              Profile
                            </Link>
                          </DropdownMenu.Item>

                          {/* Admin Dashboard — only for admin role */}
                          {user?.role === "admin" && (
                            <DropdownMenu.Item asChild>
                              <Link
                                to="/admin"
                                className="flex items-center gap-2 px-3 py-2 text-sm
                              text-text-muted rounded-lg cursor-pointer
                              hover:bg-bg-hover hover:text-golden
                                focus:outline-none focus:bg-bg-hover focus:text-golden
                                transition-colors duration-150"
                              >
                                <LayoutDashboard size={15} />
                                Admin Dashboard
                              </Link>
                            </DropdownMenu.Item>
                          )}

                          <DropdownMenu.Separator className="h-px bg-bg-hover my-1" />

                          {/* Logout */}
                          <DropdownMenu.Item
                            onSelect={handleLogout}
                            className="flex items-center gap-2 px-3 py-2 text-sm
                            text-error rounded-lg cursor-pointer hover:bg-bg-hover 
                            focus:outline-none focus:bg-bg-hover transition-colors duration-150"
                          >
                            <LogOut size={15} />
                            Log out
                          </DropdownMenu.Item>
                        </motion.div>
                      </DropdownMenu.Content>
                    )}
                  </AnimatePresence>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </>
          ) : (
            /* Not authenticated — show Login / Sign up buttons */
            <>
              <button
                className="btn-ghost btn-sm"
                onClick={() => navigate("/login")}
              >
                Log in
              </button>
              <button
                className="btn-primary btn-sm"
                onClick={() => navigate("/register")}
              >
                Sign up
              </button>
            </>
          )}
        </div>

        {/* Mobile right side — cart icon only
            Below 768px the hamburger is GONE. The cart sits here on the right.
            Navigation is handled entirely by BottomNav.tsx.
            Cart is only shown when authenticated (guests have no cart).
        */}
        {isAuthenticated ? (
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative inline-flex h-9 items-center justify-center pr-1 
                text-text-muted hover:text-text-light transition-colors cursor-pointer"
              aria-label="Open cart"
            >
              <ShoppingCart size={20} strokeWidth={2.1} />
              {/* Cart item count badge */}
              {itemCount() > 0 && (
                <span
                  className="absolute -top-1 -right-1.5 min-w-4.5 h-4.5 px-1 bg-burgundy 
                  text-text-light text-[10px] font-bold 
                  rounded-full flex items-center justify-center leading-none"
                >
                  {itemCount()}
                </span>
              )}
            </button>
          </div>
        ) : (
          <div className="md:hidden">
            <button
              className="btn-ghost btn-sm"
              onClick={() => navigate("/login")}
            >
              Log in
            </button>
          </div>
        )}
      </div>

      {/* CartDrawer — shared between mobile and desktop */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </nav>
  );
};

export default Navbar;

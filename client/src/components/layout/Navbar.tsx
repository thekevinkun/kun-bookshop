import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  BookOpen,
  ShoppingCart,
  User,
  LogOut,
  LayoutDashboard,
  Library,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";

import { useCartStore } from "../../store/cart";
import { useAuthStore } from "../../store/auth";

import { CartDrawer } from "../features";

import api from "../../lib/api";

const Navbar = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const { itemCount } = useCartStore();

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Even if server call fails, clear local state
    } finally {
      logout();
      navigate("/login");
    }
  };

  return (
    <nav className="sticky top-0 z-40 w-full bg-dark/80 backdrop-blur-md border-b border-bg-hover">
      <div className="container-page py-0 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 text-text-light hover:text-teal transition-colors"
        >
          <BookOpen size={24} className="text-teal" />
          <span className="font-bold text-lg">
            Kun <span className="text-teal">Bookshop</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            to="/books"
            className="text-text-muted hover:text-teal text-sm font-medium transition-colors"
          >
            Browse
          </Link>
          {user?.role === "admin" && (
            <Link
              to="/admin"
              className="text-text-muted hover:text-teal text-sm font-medium transition-colors"
            >
              Dashboard
            </Link>
          )}
        </div>

        {/* Desktop right side */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {/* Cart button */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative text-text-muted hover:text-text-light transition-colors"
                aria-label="Open cart"
              >
                <ShoppingCart size={22} />
                {/* Badge showing how many books are in the cart */}
                {itemCount() > 0 && (
                  <span
                    className="absolute -top-2 -right-2 bg-teal text-white text-xs font-bold 
                    w-5 h-5 rounded-full flex items-center justify-center"
                  >
                    {itemCount()}
                  </span>
                )}
              </button>

              {/* ---- RADIX DROPDOWN MENU ---- */}
              <DropdownMenu.Root>
                {/* The button that opens the dropdown */}
                <DropdownMenu.Trigger asChild>
                  <button
                    className="flex items-center gap-2 btn-ghost btn-sm
                      data-[state=open]:border-teal data-[state=open]:text-teal"
                    aria-label="User menu"
                  >
                    {/* Avatar or initials */}
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.firstName}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-7 h-7 rounded-full bg-teal flex items-center
                          justify-center text-white text-xs font-bold"
                      >
                        {user?.firstName?.[0]}
                        {user?.lastName?.[0]}
                      </div>
                    )}
                    <span className="text-sm text-text-light">
                      {user?.firstName}
                    </span>
                    <ChevronDown
                      size={14}
                      className="text-text-muted transition-transform duration-200
                        [[data-state=open]_&]:rotate-180"
                    />
                  </button>
                </DropdownMenu.Trigger>

                {/* Radix handles the portal, positioning, and accessibility */}
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    align="end"
                    sideOffset={8}
                    className="min-w-48 bg-card border border-bg-hover rounded-xl
                        shadow-2xl p-1.5 z-50 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out 
                        data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
                  >
                    {/* User info header */}
                    <div className="px-3 py-2 mb-1">
                      <p className="text-text-light text-sm font-semibold">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-text-muted text-xs">{user?.email}</p>
                    </div>

                    <DropdownMenu.Separator className="h-px bg-bg-hover my-1" />

                    {/* My Library */}
                    <DropdownMenu.Item asChild>
                      <Link
                        to="/library"
                        className="flex items-center gap-2 px-3 py-2 text-sm
                        text-text-muted rounded-lg cursor-pointer hover:bg-bg-hover
                        hover:text-teal focus:outline-none focus:bg-bg-hover focus:text-teal
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
                        hover:bg-bg-hover hover:text-teal focus:outline-none focus:bg-bg-hover 
                        focus:text-teal transition-colors duration-150"
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
                          hover:bg-bg-hover hover:text-teal
                            focus:outline-none focus:bg-bg-hover focus:text-teal
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
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </>
          ) : (
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

        {/* Mobile hamburger */}
        <button
          className="md:hidden btn-ghost btn-sm"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu — plain list, no Radix needed here */}
      {mobileOpen && (
        <div
          className="md:hidden bg-dark border-t border-bg-hover
            px-4 py-4 flex flex-col gap-3"
        >
          <Link
            to="/books"
            className="text-text-muted hover:text-teal text-sm font-medium py-2"
            onClick={() => setMobileOpen(false)}
          >
            Browse
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                to="/library"
                className="text-text-muted hover:text-teal text-sm font-medium py-2"
                onClick={() => setMobileOpen(false)}
              >
                My Library
              </Link>
              <Link
                to="/profile"
                className="text-text-muted hover:text-teal text-sm font-medium py-2"
                onClick={() => setMobileOpen(false)}
              >
                Profile
              </Link>
              {user?.role === "admin" && (
                <Link
                  to="/admin"
                  className="text-text-muted hover:text-teal text-sm font-medium py-2"
                  onClick={() => setMobileOpen(false)}
                >
                  Admin Dashboard
                </Link>
              )}
              <button
                className="text-error text-sm font-medium py-2 text-left"
                onClick={handleLogout}
              >
                Log out
              </button>
            </>
          ) : (
            <div className="flex gap-3 pt-2">
              <button
                className="btn-ghost btn-sm flex-1"
                onClick={() => {
                  navigate("/login");
                  setMobileOpen(false);
                }}
              >
                Log in
              </button>
              <button
                className="btn-primary btn-sm flex-1"
                onClick={() => {
                  navigate("/register");
                  setMobileOpen(false);
                }}
              >
                Sign up
              </button>
            </div>
          )}
        </div>
      )}

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </nav>
  );
};

export default Navbar;

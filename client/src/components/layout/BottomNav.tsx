import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Home, BookOpen, Library, LogIn, X } from "lucide-react";

import { useAuthStore } from "../../store/auth";
import { useChat } from "../../hooks/useChat";

import ChatPanel from "../chat/ChatPanel";

import { BOTTOM_NAV_ITEMS } from "../../lib/constants";

// Icon lookup
// Maps nav item id → Lucide icon component.
// "chat" and "profile/signin" are rendered separately with custom visuals.
const NAV_ICONS: Record<string, React.ReactNode> = {
  home: <Home size={20} strokeWidth={2} />,
  browse: <BookOpen size={20} strokeWidth={2} />,
  library: <Library size={20} strokeWidth={2} />,
  signin: <LogIn size={20} strokeWidth={2} />,
};

const BottomNav = () => {
  const location = useLocation();
  const { user, isAuthenticated, isHydrated } = useAuthStore();

  // Chat state lives here — BottomNav owns the panel on mobile
  const { messages, isLoading, sendMessage, clearMessages } = useChat();
  const [chatOpen, setChatOpen] = useState(false);

  const handleChatToggle = () => {
    if (chatOpen) {
      // Closing: wipe messages so next open starts fresh (matches ChatWidget behavior)
      clearMessages();
    }
    setChatOpen((prev) => !prev);
  };

  // Lock body scroll when chat panel is open — prevents page scrolling behind the overlay
  useEffect(() => {
    if (chatOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [chatOpen]);

  // Don't render until auth has hydrated — prevents a flash of the wrong tab set
  if (!isHydrated) return null;

  // Filter items based on auth state
  // Logged-in:  show authRequired items, hide "signin"
  // Logged-out: show guestVisible items, hide "library" and "profile"
  const visibleItems = BOTTOM_NAV_ITEMS.filter((item) => {
    if (isAuthenticated) {
      // Hide the "Sign In" slot when logged in — "profile" replaces it
      return item.id !== "signin";
    } else {
      // Logged out: only show items that are visible to guests
      // and hide auth-only items (library, profile)
      return item.guestVisible && !item.authRequired;
    }
  });

  // Active route detection
  // "/" only matches exactly so Browse doesn't highlight on "/books/123"
  const isActive = (to?: string) => {
    if (!to) return false;
    if (to === "/") return location.pathname === "/";
    return location.pathname.startsWith(to);
  };

  return (
    <>
      {/* Chat panel overlay (full-screen on mobile) */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            key="bottom-chat-panel"
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            // Sits above the bottom nav (z-50) but below modals
            className="fixed inset-0 z-[60] flex flex-col bg-navy md:hidden"
          >
            {/* Chat panel header — mirrors ChatWidget's header styling */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#deb368] border-b border-white/15 flex-shrink-0">
              <div>
                <p className="text-text-dark text-sm font-bold leading-none">
                  Talk with KUN!
                </p>
                <p className="text-black/75 text-[11px] mt-0.5">AI Assistant</p>
              </div>

              {/* Close button collapses the panel */}
              <button
                onClick={handleChatToggle}
                className="w-7 h-7 rounded-lg flex items-center justify-center
                  text-text-dark hover:bg-slate-200/20 transition-colors cursor-pointer"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat messages + input — fills remaining height */}
            <ChatPanel
              messages={messages}
              isLoading={isLoading}
              onSendMessage={sendMessage}
              className="flex-1 min-h-0"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* The actual bottom nav bar */}
      {/* 
        md:hidden — only shows below 768px.
        h-16 gives enough tap area; pb-safe handles iOS home indicator.
        z-50 keeps it above page content but below the chat panel (z-[60]).
      */}
      <nav
        className="
          fixed bottom-0 left-0 right-0 z-50 md:hidden
          h-16 pb-safe
          bg-navy/95 backdrop-blur-xl
          border-t border-golden/15
          flex items-center justify-around px-1
        "
        aria-label="Mobile navigation"
      >
        {visibleItems.map((item) => {
          // KUN chat tab
          if (item.id === "chat") {
            return (
              <button
                key={item.id}
                onClick={handleChatToggle}
                aria-label="Open KUN chat"
                className="flex flex-col items-center justify-center gap-1 flex-1 py-2 cursor-pointer"
              >
                {/* KUN logo image — same asset as the floating bubble */}
                <div className="min-h-[1.7rem] relative flex items-center justify-center">
                  <div
                    className={`
                        w-6.5 h-6.5 rounded-full flex items-center justify-center
                        transition-all duration-200
                        ${
                          chatOpen
                            ? "ring-2 ring-golden/60 bg-golden/10 scale-110"
                            : "opacity-75 hover:opacity-100"
                        }
                    `}
                  >
                    <img
                      src="/images/kun-chatbot-white.webp"
                      alt="KUN"
                      className="w-full h-full rounded-full object-contain"
                    />
                  </div>
                </div>
                <span
                  className={`text-[10px] font-medium transition-colors duration-200 ${
                    chatOpen ? "text-golden" : "text-text-muted"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          }

          // Profile tab (logged-in) — avatar or initials
          if (item.id === "profile") {
            const active = isActive(item.to);
            return (
              <Link
                key={item.id}
                to={item.to!}
                className="flex flex-col items-center justify-center gap-1 flex-1 py-2"
                aria-label="Profile"
              >
                {user?.avatar ? (
                  // Real avatar image — ring highlights when active
                  <div className="min-h-[1.7rem] relative flex items-center justify-center">
                    <div
                      className={`
                            w-6.5 h-6.5 rounded-full flex items-center justify-center
                            transition-all duration-200
                            ${
                              chatOpen
                                ? "ring-2 ring-golden/60 bg-golden/10 scale-110"
                                : "opacity-100 hover:opacity-80"
                            }
                        `}
                    >
                      <img
                        src={user.avatar}
                        alt={user.firstName}
                        className="w-full h-full rounded-full object-contain"
                      />
                    </div>
                  </div>
                ) : (
                  // Initials fallback — matches desktop Navbar style
                  <div className="min-h-[1.7rem] relative flex items-center justify-center">
                    <div
                      className={`
                            w-6.5 h-6.5 rounded-full flex items-center justify-center
                            border-2 text-[9px] font-bold tracking-wide
                            transition-all duration-200
                        ${
                          active
                            ? "border-golden text-golden scale-110"
                            : "border-golden/40 text-text-muted"
                        }
                        `}
                    >
                      {user?.firstName?.[0]}
                      {user?.lastName?.[0]}
                    </div>
                  </div>
                )}
                <span
                  className={`text-[10px] font-medium transition-colors duration-200 ${
                    active ? "text-golden" : "text-text-muted"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          }

          // Standard nav tab (Home, Browse, Library, Sign In)
          const active = isActive(item.to);
          const icon = NAV_ICONS[item.id];

          // Action items without a "to" shouldn't reach here, but guard anyway
          if (!item.to) return null;

          return (
            <Link
              key={item.id}
              to={item.to}
              className="flex flex-col items-center justify-center gap-1 flex-1 py-2"
              aria-label={item.label}
            >
              {/* Active indicator dot above the icon */}
              <div className="min-h-[25px] relative flex items-center justify-center">
                {active && (
                  <motion.span
                    layoutId="bottom-nav-active-dot"
                    className="absolute -top-1 w-1 h-1 rounded-full bg-golden"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <span
                  className={`transition-colors duration-200 ${
                    active ? "text-golden" : "text-text-muted"
                  }`}
                >
                  {icon}
                </span>
              </div>
              <span
                className={`text-[10px] font-medium transition-colors duration-200 ${
                  active ? "text-golden" : "text-text-muted"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Spacer so page content isn't hidden behind the fixed nav */}
      {/* 
        This empty div pushes the bottom of every page up by 64px (h-16)
        so the last content element isn't obscured by the nav bar.
        Only rendered on mobile — md:hidden matches the nav itself.
      */}
      <div className="h-16 md:hidden" aria-hidden="true" />
    </>
  );
};

export default BottomNav;

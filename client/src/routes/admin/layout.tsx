// Import React and the hooks we need
import { useState } from "react";

// Import Outlet from React Router — it renders whichever child route is active
import { Outlet, NavLink, useNavigate, Link } from "react-router-dom";

// Import icons from lucide-react for the sidebar nav items
import {
  LayoutDashboard,
  BookOpen,
  TicketPercent,
  Users,
  ShoppingBag,
  LogOut,
  Menu,
  X,
  UserSquare,
  MessageSquare,
} from "lucide-react";

import SEO from "../../components/common/SEO";
import { GlobalToaster } from "../../components/ui";

// Import our auth store to get the current user and logout function
import { useAuthStore } from "../../store/auth";

// Define the shape of each nav link item
interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
}

// List of sidebar navigation items — each maps to an admin route
const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    to: "/admin/dashboard",
    icon: <LayoutDashboard size={18} />,
  },
  { label: "Books", to: "/admin/books", icon: <BookOpen size={18} /> },
  { label: "Authors", to: "/admin/authors", icon: <UserSquare size={18} /> }, // ← new
  { label: "Users", to: "/admin/users", icon: <Users size={18} /> },
  { label: "Coupons", to: "/admin/coupons", icon: <TicketPercent size={18} /> },
  { label: "Orders", to: "/admin/orders", icon: <ShoppingBag size={18} /> },
  { label: "Reviews", to: "/admin/reviews", icon: <MessageSquare size={18} /> }, // ← new
];

export default function AdminLayout() {
  // Track whether the mobile sidebar is open or closed
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Get the logout function and current user from our auth store
  const { logout, user } = useAuthStore();

  // useNavigate lets us redirect programmatically after logout
  const navigate = useNavigate();

  // Handle logout — clear auth state and redirect to the login page
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      <SEO title="Admin" noIndex={true} />
      
      {/* // Full-screen layout — dark background, flex row so sidebar and content
      sit side by side */}
      <div className="min-h-screen bg-dark flex">
        {/* Mobile overlay — dark backdrop behind sidebar on small screens */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)} // Close sidebar when backdrop is clicked
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
          fixed top-0 left-0 h-full w-64 bg-card border-r border-slate-700/50
          flex flex-col z-30 transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:z-auto
        `}
        >
          {/* Sidebar header — logo + close button (mobile only) */}
          <Link
            to="/"
            className="py-5 px-4 hidden lg:flex items-center border-b border-slate-700/50"
          >
            <img 
              src="/images/logo.webp"
              alt="Logo"
              className="w-8 h-8 object-cover"
            />
            <span className="text-gradient-secondary font-cinzel font-medium text-xl">
              un <span className="text-golden">Bookshop</span>
            </span>
          </Link>

          <div className="flex lg:hidden items-center justify-between py-5 px-6 border-b border-slate-700/50">
            <span className="font-bold text-white text-lg">Admin Panel</span>
            
            {/* Close button — only visible on mobile */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-slate-400 hover:text-white lg:hidden"
            >
              <X size={20} />
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)} // Close mobile sidebar when a link is clicked
                className={({ isActive }) =>
                  // Apply active styles when this route is currently selected
                  `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200
                ${
                  isActive
                    ? "bg-golden/75 text-black border border-golden/90"
                    : "text-slate-400 hover:bg-slate-700/50 hover:text-white"
                }`
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Sidebar footer — logged-in user info + logout */}
          <div className="px-4 py-5 border-t border-slate-700/50">
            <div className="flex items-center gap-3 mb-4">
              {/* Avatar circle showing user's initials */}
              <div className="w-8 h-8 rounded-lg bg-[linear-gradient(135deg,#f8fafc_0%,#e6be77_100%)] 
                flex items-center justify-center text-black text-sm font-bold"
              >
                {user?.firstName?.charAt(0)}
                {user?.lastName?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-slate-500 text-xs truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400
              hover:bg-red-500/10 hover:text-red-400 transition-colors text-sm"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </aside>

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile top bar — hamburger button to open sidebar */}
          <div className="lg:hidden flex items-center gap-4 px-4 py-4 border-b border-slate-700/50 bg-card">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-slate-400 hover:text-white"
            >
              <Menu size={22} />
            </button>
            <Link
              to="/"
              className="flex items-center"
            >
              <img 
                src="/images/logo.webp"
                alt="Logo"
                className="w-5 h-5 object-cover"
              />
              <span className="text-gradient-secondary font-cinzel font-medium">
                un <span className="text-golden">Bookshop</span>
              </span>
            </Link>
          </div>

          {/* Page content — Outlet renders the active child route here */}
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
        <GlobalToaster />
      </div>
    </>
  );
}

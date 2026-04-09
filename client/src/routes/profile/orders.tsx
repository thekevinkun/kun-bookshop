import { Link } from "react-router-dom";
import {
  ShoppingBag,
  BookOpen,
  Calendar,
  Hash,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useOrders } from "../../hooks/useOrders";
import { format } from "date-fns";
import type { IOrder } from "../../types/order";

// Maps a payment status string to a colour-coded badge style
// Keeps the badge logic in one place so it's easy to extend later
const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", // Green — paid
    pending: "bg-amber-500/10  text-amber-400  border-amber-500/20", // Yellow — in progress
    failed: "bg-rose-500/10   text-rose-400   border-rose-500/20", // Red — failed
    refunded: "bg-slate-500/10  text-slate-400  border-slate-500/20", // Grey — refunded
  };
  // Return the matching class string, or a neutral default if status is unknown
  return map[status] ?? "bg-slate-500/10 text-slate-400 border-slate-500/20";
};

export default function OrdersPage() {
  // Fetch the user's order history from the backend
  const { data, isLoading, isError } = useOrders();

  const orders = data?.orders ?? []; // Default to empty array while loading

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-[var(--color-text-muted)]">
        <Loader2 className="w-6 h-6 animate-spin mr-2 text-teal-500" />
        <span className="text-sm">Loading your orders…</span>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-[var(--color-text-muted)]">
        <AlertCircle className="w-8 h-8 text-rose-400" />
        <p className="text-sm">
          Failed to load orders. Please try again later.
        </p>
      </div>
    );
  }

  // Empty state
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-[var(--color-text-muted)]">
        <div className="w-14 h-14 rounded-2xl bg-teal-500/10 flex items-center justify-center">
          <ShoppingBag className="w-7 h-7 text-teal-500" />
        </div>
        <p className="text-sm font-medium text-[var(--color-text-primary)]">
          No orders yet
        </p>
        <p className="text-xs">
          When you purchase a book, your orders will appear here.
        </p>
        <Link
          to="/books"
          className="mt-1 px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium transition-colors"
        >
          Browse Books
        </Link>
      </div>
    );
  }

  // Order list
  return (
    <div className="flex flex-col gap-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
          Order History
        </h2>
        <span className="text-xs text-[var(--color-text-muted)]">
          {orders.length} order{orders.length !== 1 ? "s" : ""}{" "}
          {/* Pluralise correctly */}
        </span>
      </div>

      {/* One card per order */}
      {orders.map((order: IOrder) => (
        <div
          key={order._id} // React needs a unique key for each list item
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden"
        >
          {/* Order header row — number, date, status, total */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-4">
              {/* Order number */}
              <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                <Hash className="w-3.5 h-3.5" /> {/* Hash icon */}
                <span className="font-mono font-medium text-[var(--color-text-primary)]">
                  {order.orderNumber} {/* e.g. ORD-20260403-ABC123 */}
                </span>
              </div>
              {/* Order date */}
              <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {/* Format the date — completedAt is set by webhook, createdAt is always available */}
                  {format(
                    new Date(order.completedAt ?? order.createdAt),
                    "dd MMM yyyy",
                  )}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Payment status badge */}
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${statusBadge(order.paymentStatus)}`}
              >
                {order.paymentStatus} {/* e.g. "completed" */}
              </span>
              {/* Order total */}
              <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                ${order.total.toFixed(2)} {/* Always show 2 decimal places */}
              </span>
            </div>
          </div>

          {/* Items list — each book in the order */}
          <div className="divide-y divide-[var(--color-border)]">
            {order.items.map(
              (
                item: {
                  coverImage: string;
                  title: string;
                  author: string;
                  price: number;
                },
                index: number,
              ) => (
                <div key={index} className="flex items-center gap-3 px-5 py-3">
                  {/* Book cover thumbnail */}
                  {item.coverImage ? (
                    <img
                      src={item.coverImage}
                      alt={item.title}
                      className="w-10 h-14 object-cover rounded-md flex-shrink-0" // Fixed size — no layout shift
                    />
                  ) : (
                    // Fallback placeholder if no cover image
                    <div className="w-10 h-14 rounded-md bg-[var(--color-surface-hover)] flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-4 h-4 text-[var(--color-text-muted)]" />
                    </div>
                  )}
                  {/* Book title and author */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                      {item.title} {/* Snapshotted at purchase time */}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)] truncate">
                      {item.author} {/* Snapshotted — uses book.authorName */}
                    </p>
                  </div>
                  {/* Price paid — snapshotted at purchase, so historical prices are preserved */}
                  <span className="text-sm font-medium text-[var(--color-text-secondary)] flex-shrink-0">
                    ${item.price.toFixed(2)}
                  </span>
                </div>
              ),
            )}
          </div>

          {/* Coupon discount row — only shown if a coupon was applied */}
          {order.couponCode && (
            <div className="flex items-center justify-between px-5 py-2.5 bg-emerald-500/5 border-t border-[var(--color-border)]">
              <span className="text-xs text-emerald-400">
                Coupon applied:{" "}
                <span className="font-mono font-medium">
                  {order.couponCode}
                </span>
              </span>
              <span className="text-xs font-medium text-emerald-400">
                −${order.discount.toFixed(2)} {/* Show savings */}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

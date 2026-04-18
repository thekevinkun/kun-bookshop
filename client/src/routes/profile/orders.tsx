import { useNavigate, Link } from "react-router-dom";
import { BookOpen, Calendar, Hash, Loader2, AlertCircle } from "lucide-react";
import { useOrders } from "../../hooks/useOrders";
import { format } from "date-fns";

import SEO from "../../components/common/SEO";

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

  // Hook for navigation — used to redirect to login if not authenticated
  const navigate = useNavigate();

  const orders = data?.orders ?? []; // Default to empty array while loading

  // Loading state
  if (isLoading) {
    return (
      // Full-page centered spinner while we wait for the library to load
      <div className="container-page min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-golden/75" size={40} />
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="container-page min-h-screen flex flex-col items-center justify-center">
        <AlertCircle className="text-rose-400" size={40} />
        <p className="text-sm">
          Failed to load orders. Please try again later.
        </p>
      </div>
    );
  }

  // Empty state
  if (orders.length === 0) {
    return (
      <>
        <SEO
          title="My Orders"
          description="Track your order history and purchase status in Kun Bookshop."
          url="/profile/orders"
          noIndex={true}
        />
        <div className="min-h-screen bg-bg-dark flex items-center justify-center px-4">
          <div className="max-w-sm w-full text-center flex flex-col items-center gap-6">
            {/* Receipt illustration — pure CSS */}
            <div className="relative w-24 mx-auto">
              {/* Receipt shadow behind */}
              <div
                className="absolute top-2 left-1/2 -translate-x-1/2 w-20
              h-28 rounded-lg bg-ocean/40 border border-white/5 rotate-[4deg]"
              />
              {/* Receipt front */}
              <div
                className="relative w-20 h-28 rounded-lg bg-card border
              border-white/10 flex flex-col gap-2 p-3 shadow-xl mx-auto"
              >
                {/* Mimics a receipt line pattern */}
                <div className="h-1.5 w-full rounded bg-golden/30" />
                <div className="h-1.5 w-3/4 rounded bg-white/10" />
                <div className="h-1.5 w-1/2 rounded bg-white/10" />
                <div className="my-1 border-t border-dashed border-white/10" />
                <div className="h-1.5 w-full rounded bg-white/10" />
                <div className="h-1.5 w-2/3 rounded bg-white/10" />
                <div className="mt-auto h-1.5 w-1/2 rounded bg-golden/20 self-end" />
              </div>
            </div>

            {/* Heading + subtext */}
            <div className="flex flex-col gap-2">
              <h2 className="text-text-light text-2xl font-bold">
                No orders yet
              </h2>
              <p className="text-text-muted text-sm leading-relaxed">
                Your purchase history will show up here after you buy your first
                book — with order numbers, dates, and totals.
              </p>
            </div>

            {/* Primary CTA */}
            <Link
              to="/books"
              className="btn-primary w-full flex items-center gap-2"
            >
              <BookOpen size={18} />
              Find Your First Book
            </Link>

            {/* Secondary — in case they already have library books somehow */}
            <Link
              to="/library"
              className="text-xs text-text-muted hover:text-golden
              underline-offset-2 hover:underline transition-colors"
            >
              Check your library instead
            </Link>
          </div>
        </div>
      </>
    );
  }

  // Order list
  return (
    <>
      <SEO
        title="My Orders"
        description="Track your order history and purchase status in Kun Bookshop."
        url="/profile/orders"
        noIndex={true}
      />

      <section className="min-h-screen">
        <div className="container-page py-12">
          {/* Page header */}
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-text-light">Order History</h2>
            <span className="text-xs text-golden/85">
              {orders.length} order{orders.length !== 1 ? "s" : ""}{" "}
              {/* Pluralise correctly */}
            </span>
          </div>

          {/* One card per order */}
          <div className="space-y-6">
            {orders.map((order: IOrder) => (
              <div
                key={order._id} // React needs a unique key for each list item
                className="rounded-xl border border-[#d1d1d1] bg-navy overflow-hidden"
              >
                {/* Order header row — number, date, status, total */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b">
                  <div className="flex items-center gap-4">
                    {/* Order number */}
                    <div className="flex items-center gap-1.5 text-xs text-text-muted">
                      <Hash className="w-3.5 h-3.5" /> {/* Hash icon */}
                      <span className="font-mono font-medium text-text-light">
                        {order.orderNumber} {/* e.g. ORD-20260403-ABC123 */}
                      </span>
                    </div>
                    {/* Order date */}
                    <div className="flex items-center gap-1.5 text-xs text-text-muted">
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
                    <span className="text-sm font-semibold text-text-light">
                      ${order.total.toFixed(2)}{" "}
                      {/* Always show 2 decimal places */}
                    </span>
                  </div>
                </div>

                {/* Items list — each book in the order */}
                <div className="divide-y divide-text-light">
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
                      <div
                        key={index}
                        className="flex items-center gap-3 px-5 py-3"
                      >
                        {/* Book cover thumbnail */}
                        {item.coverImage ? (
                          <img
                            src={item.coverImage}
                            alt={item.title}
                            className="w-10 h-14 object-cover rounded-md flex-shrink-0" // Fixed size — no layout shift
                          />
                        ) : (
                          // Fallback placeholder if no cover image
                          <div className="w-10 h-14 rounded-md flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-4 h-4 text-text-muted" />
                          </div>
                        )}
                        {/* Book title and author */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                            {item.title} {/* Snapshotted at purchase time */}
                          </p>
                          <p className="text-xs text-text-muted truncate">
                            {item.author}{" "}
                            {/* Snapshotted — uses book.authorName */}
                          </p>
                        </div>
                        {/* Price paid — snapshotted at purchase, so historical prices are preserved */}
                        <span className="text-sm font-medium text-text-muted flex-shrink-0">
                          ${item.price.toFixed(2)}
                        </span>
                      </div>
                    ),
                  )}
                </div>

                {/* Coupon discount row — only shown if a coupon was applied */}
                {order.couponCode && (
                  <div className="flex items-center justify-between px-5 py-2.5 bg-emerald-500/5 border-t border-text-light">
                    <span className="text-xs text-emerald-500">
                      Coupon applied:{" "}
                      <span className="font-mono font-medium">
                        {order.couponCode}
                      </span>
                    </span>
                    <span className="text-xs font-medium text-emerald-500">
                      −${order.discount.toFixed(2)} {/* Show savings */}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

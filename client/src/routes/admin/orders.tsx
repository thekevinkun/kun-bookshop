// Import React hooks
import { useState } from "react";

// Import the admin orders hook
import { useAdminOrders } from "../../hooks/useAdmin";

// Import icons for pagination
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { IOrder } from "../../types/order";

// The four possible payment statuses — used for the filter buttons
const STATUS_FILTERS = [
  "",
  "completed",
  "pending",
  "failed",
  "refunded",
] as const;

export default function AdminOrders() {
  // Track which status filter is active — empty string means 'All'
  const [status, setStatus] = useState("");

  // Pagination state
  const [page, setPage] = useState(1);

  // Fetch orders with current filter + page
  const { data, isLoading } = useAdminOrders(page, status);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-white text-2xl font-bold">Orders</h1>
        <p className="text-slate-400 text-sm mt-1">
          {data?.total ?? 0} total orders.
        </p>
      </div>

      {/* Status filter buttons */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s || "all"}
            onClick={() => {
              setStatus(s);
              setPage(1); // Reset to page 1 when filter changes
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize
              ${
                status === s
                  ? "bg-teal-500 text-white"
                  : "bg-slate-700 text-slate-400 hover:text-white"
              }`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {/* Orders table */}
      <div className="bg-[#1E293B] rounded-xl border border-slate-700/50 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400">
            Loading orders...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-700">
                <tr>
                  <th className="text-left text-slate-400 font-medium px-6 py-4">
                    Order #
                  </th>
                  <th className="text-left text-slate-400 font-medium px-6 py-4">
                    Customer
                  </th>
                  <th className="text-left text-slate-400 font-medium px-6 py-4">
                    Items
                  </th>
                  <th className="text-left text-slate-400 font-medium px-6 py-4">
                    Total
                  </th>
                  <th className="text-left text-slate-400 font-medium px-6 py-4">
                    Status
                  </th>
                  <th className="text-left text-slate-400 font-medium px-6 py-4">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {data?.orders?.map((order: IOrder) => (
                  <tr
                    key={order._id}
                    className="hover:bg-slate-700/20 transition-colors"
                  >
                    {/* Order number */}
                    <td className="px-6 py-4 text-teal-400 font-mono text-xs">
                      {order.orderNumber}
                    </td>

                    {/* Customer name + email */}
                    <td className="px-6 py-4">
                      <p className="text-white">
                        {order.userId?.firstName} {order.userId?.lastName}
                      </p>
                      <p className="text-slate-400 text-xs">
                        {order.userId?.email}
                      </p>
                    </td>

                    {/* Number of items in this order */}
                    <td className="px-6 py-4 text-slate-300">
                      {order.items?.length} book(s)
                    </td>

                    {/* Total amount paid */}
                    <td className="px-6 py-4 text-white font-medium">
                      ${order.total?.toFixed(2)}
                    </td>

                    {/* Status badge — color coded by status */}
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium capitalize
                        ${
                          order.paymentStatus === "completed"
                            ? "bg-green-500/20 text-green-400"
                            : order.paymentStatus === "pending"
                              ? "bg-amber-500/20 text-amber-400"
                              : order.paymentStatus === "refunded"
                                ? "bg-blue-500/20 text-blue-400"
                                : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data?.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700">
            <p className="text-slate-400 text-sm">
              Page {data.currentPage} of {data.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
                className="p-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page === data.totalPages}
                className="p-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

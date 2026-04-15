// Import React hooks
import { useState } from "react";

// Import our custom admin hooks for fetching stats and revenue data
import { useAdminStats, useAdminRevenue } from "../../hooks/useAdmin";

// Import Recharts components for the revenue line chart
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

// Import icons for the stats cards
import {
  DollarSign,
  BookOpen,
  Users,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";

import type { IOrder } from "../../types/order";

// StatCard component
// Reusable card that displays one headline number
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string; // Tailwind background class for the icon circle
}

const StatCard = ({ title, value, icon, color }: StatCardProps) => {
  return (
    // Card container — dark card with subtle border
    <div className="bg-[#1E293B] rounded-xl p-6 border border-slate-700/50">
      <div className="flex items-center justify-between">
        <div>
          {/* Stat label */}
          <p className="text-slate-400 text-sm font-medium">{title}</p>
          {/* Stat value — large and bold */}
          <p className="text-white text-2xl font-bold mt-1">{value}</p>
        </div>
        {/* Icon circle — color is passed as a prop */}
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

// Dashboard page
export default function AdminDashboard() {
  // Track which day range the user has selected for the revenue chart
  const [days, setDays] = useState(30);

  // Fetch headline stats from the backend
  const { data: stats, isLoading: statsLoading } = useAdminStats();

  // Fetch daily revenue data for the selected day range
  const { data: revenueData, isLoading: revenueLoading } =
    useAdminRevenue(days);

  // Show a simple loading message while the first data fetch is in progress
  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page title */}
      <div>
        <h1 className="text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">
          Welcome back, here's what's happening.
        </p>
      </div>

      {/* ── Stats cards grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={`$${stats?.totalRevenue?.toFixed(2) ?? "0.00"}`}
          icon={<DollarSign size={22} className="text-emerald-400" />}
          color="bg-emerald-500/20"
        />
        <StatCard
          title="Total Books"
          value={stats?.totalBooks ?? 0}
          icon={<BookOpen size={22} className="text-blue-400" />}
          color="bg-blue-500/20"
        />
        <StatCard
          title="Total Users"
          value={stats?.totalUsers ?? 0}
          icon={<Users size={22} className="text-purple-400" />}
          color="bg-purple-500/20"
        />
        <StatCard
          title="Total Orders"
          value={stats?.totalOrders ?? 0}
          icon={<ShoppingBag size={22} className="text-amber-400" />}
          color="bg-amber-500/20"
        />
      </div>

      {/* Revenue chart */}
      <div className="bg-[#1E293B] rounded-xl border border-slate-700/50 p-6">
        {/* Chart header — title + day range selector */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-400" />
            <h2 className="text-white !text-base">Revenue Over Time</h2>
          </div>
          {/* Day range buttons — clicking changes the chart data */}
          <div className="flex gap-2">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)} // Update state to trigger a new data fetch
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors
                  ${
                    days === d
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-700 text-slate-400 hover:text-white"
                  }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>

        {/* Show a loading message while revenue data is fetching */}
        {revenueLoading ? (
          <div className="h-64 flex items-center justify-center">
            <p className="text-slate-400 text-sm">Loading chart...</p>
          </div>
        ) : (
          // ResponsiveContainer makes the chart fill its parent's width
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={revenueData?.revenueData ?? []}>
              {/* Subtle grid lines */}
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              {/* X axis shows the date string from each data point */}
              <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              {/* Y axis shows revenue values */}
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
              {/* Tooltip shown on hover */}
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1E293B",
                  border: "1px solid #475569",
                  borderRadius: 8,
                }}
                labelStyle={{ color: "#f1f5f9" }}
              />
              <Legend />
              {/* The revenue line — teal color matching our design system */}
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#14B8A6"
                strokeWidth={2}
                dot={false} // Hide dots on each data point to keep the line clean
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Recent orders table ── */}
      <div className="bg-[#1E293B] rounded-xl border border-slate-700/50 p-6">
        <h2 className="text-white !text-base mb-4">Recent Orders</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left text-slate-400 font-medium pb-3">
                  Order #
                </th>
                <th className="text-left text-slate-400 font-medium pb-3">
                  Customer
                </th>
                <th className="text-left text-slate-400 font-medium pb-3">
                  Total
                </th>
                <th className="text-left text-slate-400 font-medium pb-3">
                  Status
                </th>
                <th className="text-left text-slate-400 font-medium pb-3">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {stats?.recentOrders?.map((order: IOrder) => (
                <tr
                  key={order._id}
                  className="hover:bg-slate-700/20 transition-colors"
                >
                  {/* Order number in golden so it stands out */}
                  <td className="py-3 text-golden font-mono text-xs">
                    {order.orderNumber}
                  </td>
                  <td className="py-3 text-slate-300">
                    {order.userId?.firstName} {order.userId?.lastName}
                  </td>
                  <td className="py-3 text-white font-medium">
                    ${order.total?.toFixed(2)}
                  </td>
                  <td className="py-3">
                    {/* Status badge — color changes based on payment status */}
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium
                      ${
                        order.paymentStatus === "completed"
                          ? "bg-green-500/20 text-green-400"
                          : order.paymentStatus === "pending"
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="py-3 text-slate-400 text-xs">
                    {/* Format the date into a readable string */}
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

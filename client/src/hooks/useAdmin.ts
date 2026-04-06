// Import useQuery and useMutation from React Query for data fetching and mutations
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Import our configured Axios instance so all requests go to the right base URL
import api from "../lib/api";

// Query Key Constants
// Centralized keys so we can invalidate the right cache after mutations
const STATS_KEY = ["admin", "stats"] as const;
const USERS_KEY = ["admin", "users"] as const;
const ORDERS_KEY = ["admin", "orders"] as const;
const REVENUE_KEY = ["admin", "revenue"] as const;
const ANALYTICS_KEY = ["admin", "analytics"] as const;

// useAdminStats
// Fetches the four headline numbers + 5 recent orders for the dashboard
export const useAdminStats = () => {
  return useQuery({
    queryKey: STATS_KEY,
    queryFn: async () => {
      // GET /api/admin/stats — returns totalRevenue, totalBooks, totalUsers, totalOrders, recentOrders
      const { data } = await api.get("/admin/stats");
      return data;
    },
    staleTime: 60 * 1000, // Cache for 1 minute — stats don't need to be real-time
  });
};

// useAdminUsers
// Fetches a paginated list of all users, with optional search string
export const useAdminUsers = (page = 1, search = "") => {
  return useQuery({
    queryKey: [...USERS_KEY, page, search], // Include page + search in key so each combo is cached separately
    queryFn: async () => {
      // Build query params — only include search if it has a value
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);

      const { data } = await api.get(`/admin/users?${params}`);
      return data; // { users, total, totalPages, currentPage }
    },
    staleTime: 30 * 1000, // Cache for 30 seconds
  });
};

// useUpdateUserRole
// Mutation to toggle a user's role between 'user' and 'admin'
export const useUpdateUserRole = () => {
  const queryClient = useQueryClient(); // Access the query cache to invalidate after mutation

  return useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string;
      role: "user" | "admin";
    }) => {
      // PUT /api/admin/users/:id/role — send the new role in the body
      const { data } = await api.put(`/admin/users/${userId}/role`, { role });
      return data;
    },
    onSuccess: () => {
      // After a successful role change, refetch the users list so the table updates
      queryClient.invalidateQueries({ queryKey: USERS_KEY });
    },
  });
};

// useDeleteUser
// Mutation to hard-delete a user account
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      // DELETE /api/admin/users/:id
      const { data } = await api.delete(`/admin/users/${userId}`);
      return data;
    },
    onSuccess: () => {
      // After deletion, refetch the users list and stats (totalUsers count changes)
      queryClient.invalidateQueries({ queryKey: USERS_KEY });
      queryClient.invalidateQueries({ queryKey: STATS_KEY });
    },
  });
};

// useAdminOrders
// Fetches paginated orders across all users, with optional status filter
export const useAdminOrders = (page = 1, status = "") => {
  return useQuery({
    queryKey: [...ORDERS_KEY, page, status],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (status) params.set("status", status);

      const { data } = await api.get(`/admin/orders?${params}`);
      return data; // { orders, total, totalPages, currentPage }
    },
    staleTime: 30 * 1000,
  });
};

// useAdminRevenue
// Fetches daily revenue data for the chart, supports ?days param
export const useAdminRevenue = (days = 30) => {
  return useQuery({
    queryKey: [...REVENUE_KEY, days], // Different day ranges are cached separately
    queryFn: async () => {
      const { data } = await api.get(`/admin/revenue?days=${days}`);
      return data; // { revenueData: [{ date, revenue, orders }], days }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes — revenue chart doesn't need frequent updates
  });
};

// useAdminAnalytics
// Fetches topBooks, salesByCategory, and topCustomers in one call
export const useAdminAnalytics = () => {
  return useQuery({
    queryKey: ANALYTICS_KEY,
    queryFn: async () => {
      const { data } = await api.get("/admin/analytics");
      return data; // { topBooks, salesByCategory, topCustomers }
    },
    staleTime: 5 * 60 * 1000,
  });
};

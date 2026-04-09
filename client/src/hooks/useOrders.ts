import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";
import type { IOrder } from "../types/order";

// User order history
// Calls GET /api/orders — returns the logged-in user's past orders
export const useOrders = () => {
  return useQuery({
    queryKey: ["orders"], // Cache key — shared with any other order queries
    queryFn: async () => {
      const response = await api.get("/orders"); // GET /api/orders
      return response.data as { orders: IOrder[]; totalPages: number }; // Type the response shape
    },
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes — orders don't change often
  });
};

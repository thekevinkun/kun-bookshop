import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Import our pre-configured axios instance which has the base URL and auth header set up
import api from "../lib/api";

import type { Coupon, CreateCouponInput } from "../types/book";

// This type describes what we send to the backend when validating a coupon
interface ValidateCouponInput {
  code: string; // The coupon code the user typed
  cartTotal: number; // The current cart total (before discount) so backend can calculate savings
}

// This type describes what the backend sends back on a successful validation
interface ValidateCouponResponse {
  coupon: {
    code: string;
    discountType: "percentage" | "fixed";
    discountValue: number;
    maxDiscount?: number;
  };
  discountAmount: number; // How much money is saved
  finalTotal: number; // What the user actually pays
}

// useValidateCoupon — call this hook in CartDrawer to wire up the coupon input field
export const useValidateCoupon = () => {
  return useMutation({
    // The mutation function — posts the code and cartTotal to the backend
    mutationFn: async (
      data: ValidateCouponInput,
    ): Promise<ValidateCouponResponse> => {
      const response = await api.post<ValidateCouponResponse>(
        "/coupons/validate",
        data,
      );
      return response.data; // Return the { coupon, discountAmount, finalTotal } object
    },
    // No onSuccess/onError here — CartDrawer handles those with toast notifications
    // This keeps the hook reusable and the UI logic in the component
  });
};

// Fetches all coupons for the admin table
export const useAdminCoupons = () => {
  return useQuery<Coupon[]>({
    queryKey: ["admin", "coupons"],
    queryFn: async () => {
      const res = await api.get<{ coupons: Coupon[] }>("/admin/coupons");
      return res.data.coupons;
    },
  });
};

// Creates a new coupon
export const useCreateCoupon = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateCouponInput) => {
      const res = await api.post<{ coupon: Coupon }>("/admin/coupons", data);
      return res.data.coupon;
    },
    // Refetch the coupons list after a successful create
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] }),
  });
};

// Toggles a coupon's isActive field
export const useToggleCoupon = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await api.patch<{ coupon: Coupon }>(`/admin/coupons/${id}`, {
        isActive,
      });
      return res.data.coupon;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] }),
  });
};

// Deletes a coupon permanently
export const useDeleteCoupon = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/coupons/${id}`);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] }),
  });
};

// Sends the coupon blast email to all verified users
export const useEmailBlastCoupon = () => {
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post<{
        message: string;
        sent: number;
        failed: number;
      }>(`/admin/coupons/${id}/email-blast`);
      return res.data;
    },
    // No cache invalidation needed — email blast doesn't change coupon data
  });
};

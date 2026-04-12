import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// useValidateCoupon is the mutation hook CartDrawer uses to check coupon codes
import { useValidateCoupon } from "../../hooks/useCoupons";

// Mock the api module — useValidateCoupon calls api.post('/coupons/validate')
vi.mock("@/lib/api", () => ({
  default: {
    post: vi.fn(),
  },
}));

import api from "../../lib/api";

// Fake successful validation response — matches ValidateCouponResponse shape
const fakeValidateResponse = {
  coupon: {
    code: "SAVE20",
    discountType: "percentage",
    discountValue: 20,
  },
  discountAmount: 10.0, // 20% off a $50 cart
  finalTotal: 40.0,
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe("useValidateCoupon", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Initial state
  it("starts with isPending false before mutate is called", () => {
    const { result } = renderHook(() => useValidateCoupon(), {
      wrapper: createWrapper(),
    });
    // useMutation starts idle — isPending is only true during an in-flight call
    expect(result.current.isPending).toBe(false);
  });

  // Successful mutation
  it("calls api.post with the correct endpoint and payload", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: fakeValidateResponse });

    const { result } = renderHook(() => useValidateCoupon(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({ code: "SAVE20", cartTotal: 50.0 });
    });

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/coupons/validate", {
        code: "SAVE20",
        cartTotal: 50.0,
      });
    });
  });

  it("resolves with coupon data on a successful call", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: fakeValidateResponse });

    const { result } = renderHook(() => useValidateCoupon(), {
      wrapper: createWrapper(),
    });

    // Use mutateAsync so we can await the result directly
    let resolved: typeof fakeValidateResponse | undefined;
    await act(async () => {
      resolved = await result.current.mutateAsync({
        code: "SAVE20",
        cartTotal: 50.0,
      });
    });

    expect(resolved?.coupon.code).toBe("SAVE20");
    expect(resolved?.discountAmount).toBe(10.0);
    expect(resolved?.finalTotal).toBe(40.0);
  });

  // Error state
  it("exposes the error when the api call fails", async () => {
    vi.mocked(api.post).mockRejectedValue(new Error("Coupon expired"));

    const { result } = renderHook(() => useValidateCoupon(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      // Use mutate (not mutateAsync) so the rejection doesn't throw in the test
      result.current.mutate({ code: "EXPIRED", cartTotal: 50.0 });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  // isPending during in-flight request
  it("sets isPending to true while the request is in-flight", async () => {
    // Never resolves — keeps the mutation in pending state
    vi.mocked(api.post).mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useValidateCoupon(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({ code: "SAVE20", cartTotal: 50.0 });
    });

    // isPending flips to true as soon as mutate is called
    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });
  });
});

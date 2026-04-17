import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

// Import the component AND the AppliedCoupon type so our mock data matches exactly
import { CouponInput } from "../../components/features";
import type { IAppliedCoupon } from "../../types/order";

// CouponInput calls useValidateCoupon internally — mock the whole hook module
// so no real HTTP requests are made and we control isPending / mutate
vi.mock("@/hooks/useCoupons", () => ({
  useValidateCoupon: vi.fn(() => ({
    // mutate is the function the component calls to trigger validation
    mutate: vi.fn(),
    isPending: false,
  })),
}));

// We also need to import the mock so individual tests can override its return value
import { useValidateCoupon } from "../../hooks/useCoupons";

// A fully-shaped AppliedCoupon that matches the exported interface exactly
const mockAppliedCoupon: IAppliedCoupon = {
  code: "SAVE20",
  discountAmount: 10.0, // how much is saved
  finalTotal: 40.0, // cart total after discount
  discountType: "percentage",
  discountValue: 20,
};

// Helper — builds props with sensible defaults so each test only overrides what it needs
const renderCouponInput = (
  props: Partial<{
    cartTotal: number;
    appliedCoupon: IAppliedCoupon | null;
    onApply: (coupon: IAppliedCoupon) => void;
    onRemove: () => void;
  }> = {},
) =>
  render(
    <CouponInput
      cartTotal={props.cartTotal ?? 50.0}
      appliedCoupon={props.appliedCoupon ?? null}
      onApply={props.onApply ?? vi.fn()}
      onRemove={props.onRemove ?? vi.fn()}
    />,
  );

describe("CouponInput", () => {
  // Default state (no coupon applied)
  it("renders the coupon code input field", () => {
    renderCouponInput();
    expect(screen.getByPlaceholderText(/coupon code/i)).toBeInTheDocument();
  });

  it("renders the Apply button", () => {
    renderCouponInput();
    expect(screen.getByRole("button", { name: /apply/i })).toBeInTheDocument();
  });

  it("Apply button is disabled when the input is empty", () => {
    renderCouponInput();
    // disabled={isPending || !inputValue.trim()} — empty input → disabled
    expect(screen.getByRole("button", { name: /apply/i })).toBeDisabled();
  });

  it("Apply button becomes enabled when the user types a code", async () => {
    renderCouponInput();
    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText(/coupon code/i), "SAVE20");
    expect(screen.getByRole("button", { name: /apply/i })).not.toBeDisabled();
  });

  it("auto-uppercases the typed input", async () => {
    renderCouponInput();
    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText(/coupon code/i), "save20");
    // onChange does .toUpperCase() on every keystroke
    expect(screen.getByPlaceholderText(/coupon code/i)).toHaveValue("SAVE20");
  });

  // Apply action
  it("calls mutate with the trimmed code and cartTotal when Apply is clicked", async () => {
    // Grab the mutate spy from the mocked hook
    const mutateSpy = vi.fn();
    vi.mocked(useValidateCoupon).mockReturnValue({
      mutate: mutateSpy,
      isPending: false,
    } as unknown as ReturnType<typeof useValidateCoupon>);

    renderCouponInput({ cartTotal: 50.0 });
    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText(/coupon code/i), "LAUNCH10");
    await user.click(screen.getByRole("button", { name: /apply/i }));

    expect(mutateSpy).toHaveBeenCalledWith(
      { code: "LAUNCH10", cartTotal: 50.0 },
      expect.any(Object), // the onSuccess/onError callbacks object
    );
  });

  it("calls mutate when the user presses Enter in the input", async () => {
    const mutateSpy = vi.fn();
    vi.mocked(useValidateCoupon).mockReturnValue({
      mutate: mutateSpy,
      isPending: false,
    } as unknown as ReturnType<typeof useValidateCoupon>);

    renderCouponInput();
    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText(/coupon code/i), "LAUNCH10");
    await user.keyboard("{Enter}");

    expect(mutateSpy).toHaveBeenCalledTimes(1);
  });

  it("does NOT call mutate when the input is empty and Apply is clicked", async () => {
    const mutateSpy = vi.fn();
    vi.mocked(useValidateCoupon).mockReturnValue({
      mutate: mutateSpy,
      isPending: false,
    } as unknown as ReturnType<typeof useValidateCoupon>);

    renderCouponInput();
    const user = userEvent.setup();
    // The button is disabled when empty, but guard the assertion anyway
    await user.click(screen.getByRole("button", { name: /apply/i }));
    expect(mutateSpy).not.toHaveBeenCalled();
  });

  // Loading state
  it("shows a loading spinner and disables the button while isPending", () => {
    vi.mocked(useValidateCoupon).mockReturnValue({
      mutate: vi.fn(),
      isPending: true, // simulate in-flight request
    } as unknown as ReturnType<typeof useValidateCoupon>);

    renderCouponInput();
    // Button text changes to "Checking…" and is disabled
    expect(screen.getByRole("button", { name: /checking/i })).toBeDisabled();
  });

  // Applied coupon state
  it("shows the applied coupon pill when appliedCoupon is provided", () => {
    renderCouponInput({ appliedCoupon: mockAppliedCoupon });
    // The pill shows the code and the discount amount
    expect(screen.getByText("SAVE20")).toBeInTheDocument();
    expect(screen.getByText(/−\s*\$10\.00/)).toBeInTheDocument();
  });

  it("hides the input field when a coupon is applied", () => {
    renderCouponInput({ appliedCoupon: mockAppliedCoupon });
    // The pill replaces the input entirely
    expect(
      screen.queryByPlaceholderText(/coupon code/i),
    ).not.toBeInTheDocument();
  });

  it("calls onRemove when the remove button on the pill is clicked", async () => {
    const handleRemove = vi.fn();
    renderCouponInput({
      appliedCoupon: mockAppliedCoupon,
      onRemove: handleRemove,
    });
    const user = userEvent.setup();
    // aria-label="Remove coupon" on the × button
    await user.click(screen.getByRole("button", { name: /remove coupon/i }));
    expect(handleRemove).toHaveBeenCalledTimes(1);
  });
});

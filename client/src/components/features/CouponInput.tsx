// React and hooks
import { useState } from "react";

// Our coupon validation mutation hook
import { useValidateCoupon } from "../../hooks/useCoupons";

// Toast notifications to show success/error to the user
import { toast } from "sonner";

// Lucide icons for the input field
import { Tag, X, Loader2 } from "lucide-react";

// This type describes the validated coupon data the parent (CartDrawer) needs to know about
import type { IAppliedCoupon } from "../../types/order";

// Props this component accepts
interface CouponInputProps {
  cartTotal: number; // Current cart total before any discount
  appliedCoupon: IAppliedCoupon | null; // The currently applied coupon (or null)
  onApply: (coupon: IAppliedCoupon) => void; // Called when a valid coupon is applied
  onRemove: () => void; // Called when user removes the coupon
}

const CouponInput = ({
  cartTotal,
  appliedCoupon,
  onApply,
  onRemove,
}: CouponInputProps) => {
  // Local state for what the user has typed in the input
  const [inputValue, setInputValue] = useState("");

  // The mutation hook — gives us mutate, isPending, etc.
  const { mutate: validateCoupon, isPending } = useValidateCoupon();

  // Called when the user clicks "Apply"
  const handleApply = () => {
    // Don't submit an empty string
    if (!inputValue.trim()) return;

    // Call the backend to validate the coupon
    validateCoupon(
      { code: inputValue.trim(), cartTotal },
      {
        onSuccess: (data) => {
          // Tell the parent component about the applied coupon
          onApply({
            code: data.coupon.code,
            discountType: data.coupon.discountType, // needed by checkout controller
            discountValue: data.coupon.discountValue, // needed by checkout controller
            maxDiscount: data.coupon.maxDiscount, // optional cap
            discountAmount: data.discountAmount,
            finalTotal: data.finalTotal,
          });
          // Clear the input — the applied coupon pill takes over
          setInputValue("");
          toast.success(
            `Coupon "${data.coupon.code}" applied — you save $${data.discountAmount.toFixed(2)}!`,
          );
        },
        onError: (error: unknown) => {
          // Show the backend's error message (e.g. "This coupon has expired")
          const message =
            (error as { response?: { data?: { error?: string } } }).response
              ?.data?.error || "Invalid coupon code";
          toast.error(message);
        },
      },
    );
  };

  // Allow pressing Enter in the input to trigger Apply
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleApply();
  };

  // If a coupon is already applied, show the applied pill instead of the input
  if (appliedCoupon) {
    return (
      <div
        className="flex items-center justify-between rounded-lg 
        bg-emerald-50 border border-emerald-200 px-3 py-2"
      >
        {/* Left side: tag icon + coupon summary */}
        <div className="flex items-center gap-2 text-emerald-700">
          <Tag className="h-4 w-4 shrink-0" />
          <span className="text-sm font-medium">{appliedCoupon.code}</span>
          <span className="text-sm text-emerald-600">
            − ${appliedCoupon.discountAmount.toFixed(2)}
          </span>
        </div>

        {/* Right side: remove button */}
        <button
          onClick={onRemove}
          className="p-0.5 text-error/85 hover:text-error hover:bg-red-500/25 rounded-full transition-colors"
          aria-label="Remove coupon"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // Default state: show the coupon code input + Apply button
  return (
    <div className="flex gap-2">
      {/* Text input for the coupon code */}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value.toUpperCase())} // Auto-uppercase as they type
        onKeyDown={handleKeyDown}
        placeholder="Coupon code"
        className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-base
          focus:outline-none focus:ring-2 focus:ring-golden/70 focus:border-transparent
          placeholder:text-gray-400 uppercase"
        disabled={isPending} // Disable while the request is in-flight
      />

      {/* Apply button */}
      <button
        onClick={handleApply}
        disabled={isPending || !inputValue.trim()}
        className="rounded-lg bg-teal/75 px-4 py-2 text-base font-medium 
          text-text-light hover:bg-teal disabled:opacity-50 
          disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
      >
        {/* Show a spinner while validating */}
        {isPending ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Checking…
          </>
        ) : (
          "Apply"
        )}
      </button>
    </div>
  );
};

export default CouponInput;

// React state hook
import { useState } from "react";

// AdminModal — the same modal wrapper used by BookForm
import { AdminModal } from "../ui";

// Toast notifications
import { toast } from "sonner";

// Our create coupon mutation hook
import { useCreateCoupon } from "../../hooks/useCoupons";
import type { Coupon, CreateCouponInput } from "../../types/order";

import { getDefaultValidUntil } from "../../lib/helpers";

interface CouponFormProps {
  onClose: () => void;
}

const CouponForm = ({ onClose }: CouponFormProps) => {
  // Form field states — mirrors BookForm's individual useState pattern
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">(
    "percentage",
  );
  const [discountValue, setDiscountValue] = useState("");
  const [minPurchase, setMinPurchase] = useState("");
  const [maxDiscount, setMaxDiscount] = useState("");
  // Default validFrom to today, validUntil to 30 days from now
  const [validFrom, setValidFrom] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [validUntil, setValidUntil] = useState(getDefaultValidUntil);
  const [usageLimit, setUsageLimit] = useState("100");
  const [error, setError] = useState("");

  const { mutate: createCoupon, isPending: loading } = useCreateCoupon();

  const handleSubmit = () => {
    setError("");

    // Client-side validation — same pattern as BookForm
    if (!code.trim()) {
      setError("Coupon code is required");
      return;
    }
    if (!discountValue || Number(discountValue) <= 0) {
      setError("Discount value must be greater than 0");
      return;
    }
    if (!usageLimit || Number(usageLimit) < 1) {
      setError("Usage limit must be at least 1");
      return;
    }
    if (!validFrom || !validUntil) {
      setError("Both dates are required");
      return;
    }
    if (new Date(validUntil) <= new Date(validFrom)) {
      setError("Expiry date must be after start date");
      return;
    }

    const payload: CreateCouponInput = {
      code: code.toUpperCase().trim(),
      discountType,
      discountValue: Number(discountValue),
      usageLimit: Number(usageLimit),
      validFrom,
      validUntil,
      // Only include optional fields if the admin filled them in
      ...(minPurchase ? { minPurchase: Number(minPurchase) } : {}),
      ...(maxDiscount && discountType === "percentage"
        ? { maxDiscount: Number(maxDiscount) }
        : {}),
    };

    createCoupon(payload, {
      onSuccess: (coupon: Coupon) => {
        toast.success(`Coupon "${coupon.code}" created!`);
        onClose();
      },
      onError: (err: unknown) => {
        setError(
          (err as { response?: { data?: { error?: string } } }).response?.data
            ?.error ?? "Failed to create coupon",
        );
      },
    });
  };

  return (
    <AdminModal
      title="Create New Coupon"
      onClose={onClose}
      disableClose={loading}
    >
      <div className="space-y-4">
        {/* Coupon code */}
        <div>
          <label className="block text-slate-400 text-sm mb-1">Code *</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="input-field uppercase"
            placeholder="e.g. SAVE20"
          />
        </div>

        {/* Discount type + value side by side */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-400 text-sm mb-1">
              Discount Type *
            </label>
            <select
              value={discountType}
              onChange={(e) =>
                setDiscountType(e.target.value as "percentage" | "fixed")
              }
              className="input-field"
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount ($)</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-1">
              Value {discountType === "percentage" ? "(%)" : "($)"} *
            </label>
            <input
              type="number"
              min="0"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              className="input-field"
              placeholder={discountType === "percentage" ? "20" : "5.00"}
            />
          </div>
        </div>

        {/* Min purchase + max discount side by side */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-400 text-sm mb-1">
              Min Purchase ($) <span className="text-slate-500">optional</span>
            </label>
            <input
              type="number"
              min="0"
              value={minPurchase}
              onChange={(e) => setMinPurchase(e.target.value)}
              className="input-field"
              placeholder="0"
            />
          </div>

          {/* Max discount cap only makes sense for percentage coupons */}
          {discountType === "percentage" && (
            <div>
              <label className="block text-slate-400 text-sm mb-1">
                Max Discount ($){" "}
                <span className="text-slate-500">optional cap</span>
              </label>
              <input
                type="number"
                min="0"
                value={maxDiscount}
                onChange={(e) => setMaxDiscount(e.target.value)}
                className="input-field"
                placeholder="50"
              />
            </div>
          )}
        </div>

        {/* Valid from + valid until side by side */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-400 text-sm mb-1">
              Valid From *
            </label>
            <input
              type="date"
              value={validFrom}
              onChange={(e) => setValidFrom(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-1">
              Valid Until *
            </label>
            <input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className="input-field"
            />
          </div>
        </div>

        {/* Usage limit */}
        <div>
          <label className="block text-slate-400 text-sm mb-1">
            Usage Limit *
          </label>
          <input
            type="number"
            min="1"
            value={usageLimit}
            onChange={(e) => setUsageLimit(e.target.value)}
            className="input-field"
            placeholder="100"
          />
        </div>

        {/* Error message */}
        {error && <p className="text-red-400 text-sm">{error}</p>}

        {/* Submit and cancel — same layout as BookForm */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="btn-ghost flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : "Create Coupon"}
          </button>
        </div>
      </div>
    </AdminModal>
  );
};

export default CouponForm;

// React state hook
import { useState } from "react";

// Icons — same set style as AdminBooks
import {
  Plus,
  Trash2,
  Mail,
  Share2,
  Copy,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

// Toast notifications
import { toast } from "sonner";

// Coupon hooks and types
import {
  useAdminCoupons,
  useToggleCoupon,
  useDeleteCoupon,
  useEmailBlastCoupon,
} from "../../hooks/useCoupons";

// CouponForm modal — same pattern as BookForm in AdminBooks
import { CouponForm } from "../../components/forms";

import type { Coupon } from "../../types/book";

// Share helpers
import { shareOnX, shareOnFacebook, shareOnInstagram } from "../../lib/helpers";

// Main Page
export default function AdminCoupons() {
  // undefined = modal closed, true = modal open (create only — no edit mode for coupons)
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useAdminCoupons();
  const { mutate: toggleCoupon } = useToggleCoupon();
  const { mutate: deleteCoupon } = useDeleteCoupon();
  const { mutate: emailBlast } = useEmailBlastCoupon();

  const handleToggle = (coupon: Coupon) => {
    toggleCoupon(
      { id: coupon._id, isActive: !coupon.isActive },
      {
        onSuccess: () =>
          toast.success(
            `Coupon "${coupon.code}" ${coupon.isActive ? "deactivated" : "activated"}`,
          ),
        onError: () => toast.error("Failed to update coupon"),
      },
    );
  };

  const handleDelete = (coupon: Coupon) => {
    if (
      !window.confirm(`Delete "${coupon.code}"? This action cannot be undone.`)
    )
      return;
    deleteCoupon(coupon._id, {
      onSuccess: () => toast.success(`Coupon "${coupon.code}" deleted`),
      onError: () => toast.error("Failed to delete coupon"),
    });
  };

  const handleEmailBlast = (coupon: Coupon) => {
    // Extra confirmation — this emails every verified user in the database
    if (
      !window.confirm(
        `Send "${coupon.code}" to ALL verified users? This cannot be undone.`,
      )
    )
      return;

    emailBlast(coupon._id, {
      onSuccess: (data) => toast.success(data.message),
      onError: (err: unknown) =>
        toast.error(
          (err as { response?: { data?: { error?: string } } }).response?.data
            ?.error ?? "Email blast failed",
        ),
    });
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`"${code}" copied to clipboard`);
  };

  return (
    <div className="space-y-6">
      {/* Page header — identical structure to AdminBooks */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Coupons</h1>
          <p className="text-slate-400 text-sm mt-1">
            Create and manage discount codes.
          </p>
        </div>
        {/* Opens the CouponForm modal — same as "Add Book" in AdminBooks */}
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} />
          Add Coupon
        </button>
      </div>

      {/* Coupons table — same bg, border, and structure as AdminBooks */}
      <div className="bg-[#1E293B] rounded-xl border border-slate-700/50 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400">
            Loading coupons...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-700">
                <tr>
                  <th className="text-left text-slate-400 font-medium px-6 py-4">
                    Code
                  </th>
                  <th className="text-left text-slate-400 font-medium px-6 py-4">
                    Discount
                  </th>
                  <th className="text-left text-slate-400 font-medium px-6 py-4">
                    Usage
                  </th>
                  <th className="text-left text-slate-400 font-medium px-6 py-4">
                    Valid Until
                  </th>
                  <th className="text-left text-slate-400 font-medium px-6 py-4">
                    Status
                  </th>
                  <th className="text-left text-slate-400 font-medium px-6 py-4">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {data?.map((coupon: Coupon) => {
                  // A coupon is expired if its validUntil date has passed
                  const isExpired = new Date(coupon.validUntil) < new Date();

                  return (
                    <tr
                      key={coupon._id}
                      className="hover:bg-slate-700/20 transition-colors"
                    >
                      {/* Code + copy button */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white tracking-widest">
                            {coupon.code}
                          </span>
                          <button
                            onClick={() => handleCopyCode(coupon.code)}
                            className="p-1 text-slate-400 hover:text-teal-400 hover:bg-teal-500/10 rounded transition-colors"
                            title="Copy code"
                          >
                            <Copy size={13} />
                          </button>
                        </div>
                      </td>

                      {/* Discount details */}
                      <td className="px-6 py-4 text-white">
                        {coupon.discountType === "percentage"
                          ? `${coupon.discountValue}%`
                          : `$${coupon.discountValue}`}
                        {coupon.maxDiscount && (
                          <span className="text-slate-500 text-xs ml-1">
                            (max ${coupon.maxDiscount})
                          </span>
                        )}
                        {coupon.minPurchase > 0 && (
                          <p className="text-slate-500 text-xs mt-0.5">
                            Min ${coupon.minPurchase}
                          </p>
                        )}
                      </td>

                      {/* Usage count + progress bar */}
                      <td className="px-6 py-4">
                        <p className="text-slate-300 text-xs mb-1">
                          {coupon.usedCount} / {coupon.usageLimit}
                        </p>
                        <div className="w-24 h-1.5 rounded-full bg-slate-700">
                          <div
                            className={`h-1.5 rounded-full ${
                              coupon.usedCount / coupon.usageLimit >= 0.9
                                ? "bg-red-400"
                                : "bg-teal-400"
                            }`}
                            style={{
                              width: `${Math.min(
                                (coupon.usedCount / coupon.usageLimit) * 100,
                                100,
                              )}%`,
                            }}
                          />
                        </div>
                      </td>

                      {/* Expiry date */}
                      <td className="px-6 py-4 text-slate-300">
                        {new Date(coupon.validUntil).toLocaleDateString()}
                      </td>

                      {/* Status badge — same style as AdminBooks */}
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            isExpired
                              ? "bg-slate-500/20 text-slate-400"
                              : coupon.isActive
                                ? "bg-green-500/20 text-green-400"
                                : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {isExpired
                            ? "Expired"
                            : coupon.isActive
                              ? "Active"
                              : "Inactive"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          {/* Toggle active/inactive */}
                          <button
                            onClick={() => handleToggle(coupon)}
                            title={coupon.isActive ? "Deactivate" : "Activate"}
                            className="p-2 text-slate-400 hover:text-teal-400 hover:bg-teal-500/10 rounded-lg transition-colors"
                          >
                            {coupon.isActive ? (
                              <ToggleRight size={15} />
                            ) : (
                              <ToggleLeft size={15} />
                            )}
                          </button>

                          {/* Email blast */}
                          <button
                            onClick={() => handleEmailBlast(coupon)}
                            disabled={!coupon.isActive || isExpired}
                            title="Email all verified users"
                            className="p-2 text-slate-400 hover:text-teal-400 hover:bg-teal-500/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Mail size={15} />
                          </button>

                          {/* Share on X */}
                          <button
                            onClick={() => shareOnX(coupon)}
                            title="Share on X"
                            className="p-2 text-slate-400 hover:text-teal-400 hover:bg-teal-500/10 rounded-lg transition-colors"
                          >
                            <Share2 size={15} />
                          </button>

                          {/* Share on Facebook */}
                          <button
                            onClick={() => shareOnFacebook(coupon)}
                            title="Share on Facebook"
                            className="p-2 text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 rounded-lg transition-colors"
                          >
                            <Share2 size={15} />
                          </button>

                          {/* Copy caption for Instagram */}
                          <button
                            onClick={() => shareOnInstagram(coupon)}
                            title="Copy Instagram caption"
                            className="p-2 text-slate-400 hover:text-pink-400 hover:bg-pink-500/10 rounded-lg transition-colors"
                          >
                            <Copy size={15} />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(coupon)}
                            title="Delete coupon"
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {/* Empty state row */}
                {!isLoading && data?.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-slate-500"
                    >
                      No coupons yet. Click "Add Coupon" to create your first
                      one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CouponForm modal — same pattern as BookForm in AdminBooks */}
      {showForm && <CouponForm onClose={() => setShowForm(false)} />}
    </div>
  );
}

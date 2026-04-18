import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import type { UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, KeyRound, Eye, EyeOff } from "lucide-react";
import { useChangePassword } from "../../hooks/useAuth"; // Our new mutation hook
import SEO from "../../components/common/SEO";
import { toast } from "sonner";

// Zod v4 validator (client-side duplicate — never import from server)
const requiredString = (field: string) =>
  z.string().min(1, `${field} is required`);

const changePasswordSchema = z
  .object({
    currentPassword: requiredString("Current password"),
    newPassword: requiredString("New password")
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirmNewPassword: requiredString("Confirm password"),
  })
  .refine(
    (data) => data.newPassword === data.confirmNewPassword, // Passwords must match
    { message: "Passwords do not match", path: ["confirmNewPassword"] }, // Attach error to confirm field
  )
  .refine(
    (data) => data.currentPassword !== data.newPassword, // New password must differ from old
    {
      message: "New password must differ from current password",
      path: ["newPassword"],
    },
  );

type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

// Reusable password field with show/hide toggle
const PasswordField = ({
  label,
  fieldKey,
  show,
  onToggle,
  error,
  register,
}: {
  label: string;
  fieldKey: keyof ChangePasswordForm;
  show: boolean;
  onToggle: () => void;
  error?: string;
  register: UseFormRegister<ChangePasswordForm>;
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-medium text-text-muted">{label}</label>
    <div className="relative">
      <input
        {...register(fieldKey)} // Register with RHF
        type={show ? "text" : "password"} // Toggle between plain text and masked input
        className="w-full px-3 py-2 pr-10 rounded-lg border border-[#d1d1d1] text-sm text-text-light focus:outline-none focus:ring-2 focus:ring-golden-500/50"
      />
      {/* Show/hide toggle button */}
      <button
        type="button" // Prevent form submission on click
        onClick={onToggle} // Toggle the visibility state
        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-light transition-colors"
        aria-label={show ? "Hide password" : "Show password"} // Accessibility
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
    {error && <p className="text-xs text-rose-400">{error}</p>}
  </div>
);

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { mutate: changePassword, isPending } = useChangePassword();

  // Track which fields have their text visible — each field has its own toggle
  const [showCurrent, setShowCurrent] = useState(false); // Toggle for current password field
  const [showNew, setShowNew] = useState(false); // Toggle for new password field
  const [showConfirm, setShowConfirm] = useState(false); // Toggle for confirm field

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = (values: ChangePasswordForm) => {
    changePassword(values, {
      onSuccess: () => {
        toast.success("Password changed successfully");
        reset(); // Clear the form — don't leave passwords in the DOM
        navigate("/profile"); // Return to profile
      },
      onError: (error: unknown) => {
        // The backend returns { error: 'Incorrect current password' } on wrong password
        const message =
          (error as { response?: { data?: { error?: string } } }).response?.data
            ?.error || "Failed to change password. Please try again.";
        toast.error(message); // Surface the backend message directly
      },
    });
  };

  return (
    <>
      <SEO
        title="Change Password"
        description="Update your account password to keep your Kun Bookshop account secure."
        url="/profile/password"
        noIndex={true}
      />

      <main className="min-h-[90vh]">
        <div className="py-12">
          <div className="container-page max-w-2xl mx-auto flex flex-col">
            <button
              className="btn-ghost btn-sm flex items-center gap-1 self-start mb-4"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft size={15} /> Back
            </button>

            <h2 className="text-base mb-6">Change Password</h2>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-5"
            >
              <PasswordField
                label="Current Password"
                fieldKey="currentPassword"
                show={showCurrent}
                onToggle={() => setShowCurrent((v) => !v)}
                error={errors.currentPassword?.message}
                register={register}
              />
              <PasswordField
                label="New Password"
                fieldKey="newPassword"
                show={showNew}
                onToggle={() => setShowNew((v) => !v)}
                error={errors.newPassword?.message}
                register={register}
              />
              <PasswordField
                label="Confirm New Password"
                fieldKey="confirmNewPassword"
                show={showConfirm}
                onToggle={() => setShowConfirm((v) => !v)}
                error={errors.confirmNewPassword?.message}
                register={register}
              />

              {/* Password requirements hint */}
              <p className="text-xs text-text-muted">
                Min. 8 characters, at least one uppercase letter and one number.
              </p>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center gap-2 btn-primary btn-sm"
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <KeyRound className="w-4 h-4" />
                  )}
                  {isPending ? "Saving…" : "Change Password"}
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/profile")}
                  className="btn-ghost btn-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}

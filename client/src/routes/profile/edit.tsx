import { useEffect } from "react";
import { useForm } from "react-hook-form"; // Form state management
import { zodResolver } from "@hookform/resolvers/zod"; // Bridges RHF with Zod validation
import { z } from "zod"; // Zod v4
import { useNavigate } from "react-router-dom"; // To redirect after save
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useAuthStore } from "../../store/auth"; // Read current user from Zustand
import { useUpdateProfile } from "../../hooks/useAuth"; // Our new mutation hook
import { toast } from "sonner"; // Already installed — for success/error toasts

// Zod v4 validator (client-side duplicate — never import from server)
const requiredString = (field: string) =>
  z.string().min(1, `${field} is required`); // Zod v4 pattern

const editProfileSchema = z.object({
  firstName: requiredString("First name"), // Cannot be empty
  lastName: requiredString("Last name"), // Cannot be empty
  emailPreferences: z.object({
    marketing: z.boolean(), // Marketing and promotional emails
    orderUpdates: z.boolean(), // Order status notifications
    newReleases: z.boolean(), // New book announcements
    priceDrops: z.boolean(), // Price drop alerts
  }),
});

type EditProfileForm = z.infer<typeof editProfileSchema>; // Derive TypeScript type from schema

export default function EditProfilePage() {
  const { user } = useAuthStore(); // Current user from Zustand — pre-fills the form
  const navigate = useNavigate(); // Redirect to profile after saving
  const { mutate: updateProfile, isPending } = useUpdateProfile(); // Mutation hook

  // Set up the form with Zod validation and default values from the current user
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditProfileForm>({
    resolver: zodResolver(editProfileSchema), // Validate against our Zod schema
    defaultValues: {
      firstName: user?.firstName ?? "", // Pre-fill with current name
      lastName: user?.lastName ?? "",
      emailPreferences: {
        marketing: user?.emailPreferences?.marketing ?? true, // Default true — opt-in
        orderUpdates: user?.emailPreferences?.orderUpdates ?? true,
        newReleases: user?.emailPreferences?.newReleases ?? true,
        priceDrops: user?.emailPreferences?.priceDrops ?? false, // Default false — less common
      },
    },
  });

  // If the user object updates (e.g. after a successful save), reset the form to reflect new values
  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        emailPreferences: {
          marketing: user.emailPreferences?.marketing ?? true,
          orderUpdates: user.emailPreferences?.orderUpdates ?? true,
          newReleases: user.emailPreferences?.newReleases ?? true,
          priceDrops: user.emailPreferences?.priceDrops ?? false,
        },
      });
    }
  }, [user, reset]); // Re-run when user data changes

  // Called by RHF after validation passes
  const onSubmit = (values: EditProfileForm) => {
    updateProfile(values, {
      onSuccess: () => {
        toast.success("Profile updated"); // Show a success toast
        navigate("/profile"); // Return to the profile page
      },
      onError: () => {
        toast.error("Failed to update profile. Please try again."); // Show an error toast
      },
    });
  };

  return (
    <div className="min-h-[90vh]">
      <div className="py-12">
        <div className="container-page max-w-2xl mx-auto flex flex-col">
          <button
            className="btn-ghost btn-sm flex items-center gap-1 self-start mb-4"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={15} /> Back
          </button>

          <h2 className="text-base mb-6">Edit Profile</h2>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-5"
          >
            {/* Name fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-muted">
                  First Name
                </label>
                <input
                  {...register("firstName")} // Register with RHF — handles value + onChange
                  className="w-full px-3 py-2 rounded-lg border border-text-light bg-navy text-sm text-text-light 
                    focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                />
                {errors.firstName && (
                  <p className="text-xs text-rose-400">
                    {errors.firstName.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-muted">
                  Last Name
                </label>
                <input
                  {...register("lastName")}
                  className="w-full px-3 py-2 rounded-lg border border-text-light bg-navy text-sm 
                    text-text-light focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                />
                {errors.lastName && (
                  <p className="text-xs text-rose-400">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            {/* Email preference toggles */}
            <div className="flex flex-col gap-3">
              <p className="text-xs font-medium text-text-muted">
                Email Preferences
              </p>
              <div className="rounded-xl border border-text-light divide-y divide-text-light">
                {/* Each preference is a labelled checkbox row */}
                {(
                  [
                    {
                      key: "marketing",
                      label: "Marketing & promotions",
                      desc: "Sales, deals, and featured picks",
                    },
                    {
                      key: "orderUpdates",
                      label: "Order updates",
                      desc: "Confirmations and receipts",
                    },
                    {
                      key: "newReleases",
                      label: "New releases",
                      desc: "When new books are added",
                    },
                    {
                      key: "priceDrops",
                      label: "Price drops",
                      desc: "When a wishlisted book goes on sale",
                    },
                  ] as const
                ).map(({ key, label, desc }) => (
                  <label
                    key={key}
                    className="flex items-center justify-between px-4 py-3 cursor-pointer transition-colors"
                  >
                    <div>
                      <p className="text-sm text-text-light">
                        {label}
                      </p>
                      <p className="text-xs text-text-muted">
                        {desc}
                      </p>
                    </div>
                    {/* Native checkbox — styled as a toggle via Tailwind accent-teal-500 */}
                    <input
                      type="checkbox"
                      {...register(`emailPreferences.${key}`)} // Nested field registration
                      className="w-4 h-4 rounded accent-teal-500 cursor-pointer"
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={isPending} // Disable while mutation is in flight
                className="flex items-center gap-2 btn-primary btn-sm"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" /> // Spinner while saving
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isPending ? "Saving…" : "Save Changes"}
              </button>

              <button
                type="button"
                onClick={() => navigate("/profile")} // Cancel — go back without saving
                className="btn-ghost btn-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

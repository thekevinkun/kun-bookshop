import { useEffect, useRef, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import Cropper from "react-easy-crop"; // The crop library
import { ArrowLeft, Camera, Loader2, Save, Trash2, X } from "lucide-react";
import { useAuthStore } from "../../store/auth";
import {
  useUpdateProfile,
  useUploadAvatar,
  useRemoveAvatar,
} from "../../hooks/useAuth";
import SEO from "../../components/common/SEO";
import { toast } from "sonner";

// Shape of the crop area returned by react-easy-crop after user adjusts
interface CropArea {
  x: number; // Left offset in pixels within the original image
  y: number; // Top offset in pixels within the original image
  width: number; // Width of the cropped region in pixels
  height: number; // Height of the cropped region in pixels
}

// Zod schema
const requiredString = (field: string) =>
  z.string().min(1, `${field} is required`);

const editProfileSchema = z.object({
  firstName: requiredString("First name"),
  lastName: requiredString("Last name"),
  emailPreferences: z.object({
    marketing: z.boolean(),
    orderUpdates: z.boolean(),
    newReleases: z.boolean(),
    priceDrops: z.boolean(),
  }),
});

type EditProfileForm = z.infer<typeof editProfileSchema>;

const EMAIL_PREFERENCES = [
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
] as const;

// Helper: crop image on canvas

// Takes the original image src and the pixel crop area from react-easy-crop,
// draws only the cropped region onto an offscreen canvas, and returns a Blob.
// This Blob is what we send to the backend — the server never sees the full image.
const getCroppedBlob = (
  imageSrc: string,
  pixelCrop: CropArea,
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const image = new Image(); // Create an offscreen image element
    image.src = imageSrc; // Point it at the data URL from the file reader

    image.onload = () => {
      // Create an offscreen canvas exactly the size of the crop area
      const canvas = document.createElement("canvas");
      canvas.width = pixelCrop.width; // Canvas width = cropped region width
      canvas.height = pixelCrop.height; // Canvas height = cropped region height

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context not available"));
        return;
      }

      // Draw only the cropped region from the source image onto the canvas
      // drawImage(source, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
      ctx.drawImage(
        image,
        pixelCrop.x, // Start x in source image
        pixelCrop.y, // Start y in source image
        pixelCrop.width, // Width to read from source
        pixelCrop.height, // Height to read from source
        0, // Draw at canvas origin x
        0, // Draw at canvas origin y
        pixelCrop.width, // Draw at full canvas width
        pixelCrop.height, // Draw at full canvas height
      );

      // Export the canvas content as a JPEG Blob at 92% quality
      // JPEG is smaller than PNG for photos — good for avatars
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Canvas toBlob failed"));
            return;
          }
          resolve(blob); // This is what gets uploaded to the server
        },
        "image/jpeg",
        0.92, // Quality — 0.92 is visually lossless for avatars
      );
    };

    image.onerror = () =>
      reject(new Error("Failed to load image for cropping"));
  });
};

// Component

export default function EditProfilePage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { mutate: updateProfile, isPending } = useUpdateProfile();
  const { mutate: uploadAvatar, isPending: isUploading } = useUploadAvatar();
  const { mutate: removeAvatar, isPending: isRemoving } = useRemoveAvatar();

  // File input ref — we trigger it programmatically on avatar click
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Crop modal state
  const [modalOpen, setModalOpen] = useState(false); // Is the crop modal visible?
  const [imageSrc, setImageSrc] = useState<string | null>(null); // Data URL of the selected file
  const [crop, setCrop] = useState({ x: 0, y: 0 }); // Current pan position in the cropper
  const [zoom, setZoom] = useState(1); // Current zoom level (1 = no zoom)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(
    null,
  ); // Final crop coords

  // Preview state — set after user clicks "Done" in the crop step
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null); // Blob ready to upload
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // Object URL for <img> preview
  const [cropStep, setCropStep] = useState<"crop" | "preview">("crop"); // Which modal screen

  // RHF setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditProfileForm>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      emailPreferences: {
        marketing: user?.emailPreferences?.marketing ?? true,
        orderUpdates: user?.emailPreferences?.orderUpdates ?? true,
        newReleases: user?.emailPreferences?.newReleases ?? true,
        priceDrops: user?.emailPreferences?.priceDrops ?? false,
      },
    },
  });

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
  }, [user, reset]);

  // Cleanup object URLs to prevent memory leaks when the component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl); // Free the blob URL from memory
    };
  }, [previewUrl]);

  // Called by the hidden file input when the user selects a file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Read the file as a data URL so react-easy-crop can display it
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string); // Store the data URL
      setCrop({ x: 0, y: 0 }); // Reset pan to center
      setZoom(1); // Reset zoom to default
      setCropStep("crop"); // Always start at the crop step
      setModalOpen(true); // Open the modal
    };
    reader.readAsDataURL(file);

    // Reset the input value so the same file can be re-selected if user cancels
    e.target.value = "";
  };

  // Called by react-easy-crop every time the crop area changes
  // We only need the pixel values — not the percentage values
  const onCropComplete = useCallback((_: unknown, croppedPixels: CropArea) => {
    setCroppedAreaPixels(croppedPixels); // Save the latest crop coordinates
  }, []);

  // Called when the user clicks "Done" in the crop step
  const handleCropDone = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      // Render the cropped area onto an offscreen canvas and get a Blob
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels);

      // Create a temporary object URL so we can show a preview <img>
      const url = URL.createObjectURL(blob);

      setPreviewBlob(blob); // Save the blob — we'll upload this
      setPreviewUrl(url); // Save the URL — we'll display this
      setCropStep("preview"); // Switch to the preview screen
    } catch {
      toast.error("Failed to process image. Please try another file.");
    }
  };

  // User wants to re-crop — go back to the crop step without losing the source image
  const handleRecrop = () => {
    setCropStep("crop"); // Go back to cropper
    // previewBlob and previewUrl stay in state — they'll be overwritten on next "Done"
  };

  // User confirms the preview — upload to backend
  const handleSaveAvatar = () => {
    if (!previewBlob) return;

    uploadAvatar(previewBlob, {
      onSuccess: () => {
        toast.success("Avatar updated!"); // Navbar already updated via Zustand
        handleCloseModal(); // Close and clean up
      },
      onError: () => {
        toast.error("Failed to upload avatar. Please try again.");
      },
    });
  };

  // User wants to remove their avatar entirely — back to initials
  const handleRemoveAvatar = () => {
    removeAvatar(undefined, {
      onSuccess: () => {
        // Also clear any local preview state so the initials show immediately
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
        }
        setPreviewBlob(null);
        toast.success("Avatar removed.");
      },
      onError: () => {
        toast.error("Failed to remove avatar. Please try again.");
      },
    });
  };

  // Close modal and reset all crop state
  const handleCloseModal = () => {
    setModalOpen(false);
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setCropStep("crop");
    // Revoke the preview URL before clearing it
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setPreviewBlob(null);
  };

  // Profile form submit
  const onSubmit = (values: EditProfileForm) => {
    updateProfile(values, {
      onSuccess: () => {
        toast.success("Profile updated");
        navigate("/profile");
      },
      onError: () => {
        toast.error("Failed to update profile. Please try again.");
      },
    });
  };

  // Derived display values for the avatar circle
  // Show previewUrl if user just cropped but hasn't saved yet,
  // otherwise show the real avatar from Zustand
  const displayAvatar = previewUrl ?? user?.avatar ?? null;
  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`;

  return (
    <>
      <SEO
        title="Edit Profile"
        description="Update your personal information and account details in Kun Bookshop."
        url="/profile/edit"
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

            <h2 className="text-base mb-6">Edit Profile</h2>

            {/* Avatar section */}
            <div className="flex flex-col items-center gap-3 mb-8">
              {/* Clickable avatar circle */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="group relative w-24 h-24 rounded-full overflow-hidden
                  border-2 border-golden/40 hover:border-golden/80
                  transition-all duration-200 cursor-pointer focus:outline-none
                  focus-visible:ring-2 focus-visible:ring-golden/60"
                            aria-label="Change profile photo"
              >
                {displayAvatar ? (
                  <img
                    src={displayAvatar}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center
                    bg-white/5 text-text-light text-xl font-bold tracking-wide"
                  >
                    {initials}
                  </div>
                )}

                {/* Camera overlay on hover */}
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center
                  bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                >
                  <Camera size={20} className="text-white" />
                  <span className="text-white text-[10px] font-medium mt-1">
                    Change
                  </span>
                </div>
              </button>

              <p className="text-[11px] text-text-muted">
                JPG, PNG or WebP · Max 5MB
              </p>

              {/* Remove button — only shown when the user actually has an avatar saved */}
              {/* Shown for the real saved avatar, not for a local preview that hasn't been uploaded yet */}
              {user?.avatar && !previewUrl && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={isRemoving}
                  className="flex items-center gap-1.5 text-xs text-text-muted
                  hover:text-error transition-colors disabled:opacity-50"
                >
                  {isRemoving ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Trash2 size={12} />
                  )}
                  {isRemoving ? "Removing…" : "Remove photo"}
                </button>
              )}

              {/* Hidden native file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Profile form */}
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-5"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-text-muted">
                    First Name
                  </label>
                  <input
                    {...register("firstName")}
                    className="w-full px-3 py-2 rounded-lg border border-[#d1d1d1] bg-navy text-sm text-text-light
                      focus:outline-none focus:ring-2 focus:ring-golden/80"
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
                    className="w-full px-3 py-2 rounded-lg border border-[#d1d1d1] bg-navy text-sm text-text-light
                      focus:outline-none focus:ring-2 focus:ring-golden/80"
                  />
                  {errors.lastName && (
                    <p className="text-xs text-rose-400">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <p className="text-xs font-medium text-text-muted">
                  Email Preferences
                </p>
                <div className="rounded-xl border border-[#d1d1d1] divide-y divide-text-light">
                  {EMAIL_PREFERENCES.map(({ key, label, desc }) => (
                    <label
                      key={key}
                      className="flex items-center justify-between px-4 py-3 cursor-pointer transition-colors"
                    >
                      <div>
                        <p className="text-sm text-text-light">{label}</p>
                        <p className="text-xs text-text-muted">{desc}</p>
                      </div>
                      <input
                        type="checkbox"
                        {...register(`emailPreferences.${key}`)}
                        className="w-4 h-4 rounded accent-teal cursor-pointer"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center gap-2 btn-primary btn-sm"
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isPending ? "Saving…" : "Save Changes"}
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

      {/* Crop / Preview Modal */}
      {modalOpen && (
        // Backdrop — click outside closes the modal
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4
            bg-black/70 backdrop-blur-sm"
          onClick={handleCloseModal}
        >
          {/* Modal panel — stop click propagation so clicking inside doesn't close it */}
          <div
            className="relative w-full max-w-md bg-card border border-white/10
              rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div
              className="flex items-center justify-between px-5 py-4
              border-b border-white/10"
            >
              <h3 className="text-sm font-semibold text-text-light">
                {cropStep === "crop" ? "Adjust your photo" : "Preview"}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-text-muted hover:text-text-light transition-colors
                  p-1 rounded-lg hover:bg-white/5"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* CROP STEP */}
            {cropStep === "crop" && imageSrc && (
              <>
                {/* Cropper container — fixed height so the modal doesn't jump */}
                <div className="relative w-full" style={{ height: 340 }}>
                  <Cropper
                    image={imageSrc} // The data URL from FileReader
                    crop={crop} // Controlled pan position
                    zoom={zoom} // Controlled zoom level
                    aspect={1} // 1:1 square crop — perfect for circular avatars
                    cropShape="round" // Shows a circular crop guide overlay
                    showGrid={false} // No grid lines — cleaner look
                    onCropChange={setCrop} // Update pan on drag
                    onZoomChange={setZoom} // Update zoom on pinch/scroll
                    onCropComplete={onCropComplete} // Fires with pixel coords on every change
                    style={{
                      // Override react-easy-crop defaults to match our dark theme
                      containerStyle: { background: "#0a1628" },
                      mediaStyle: { borderRadius: 0 },
                    }}
                  />
                </div>

                {/* Zoom slider */}
                <div className="px-5 pt-4 pb-2 flex items-center gap-3">
                  <span className="text-xs text-text-muted w-8 text-right">
                    {/* Smaller icon for min zoom */}
                    <Camera size={13} />
                  </span>
                  <input
                    type="range"
                    min={1} // Minimum zoom — no zoom
                    max={3} // Maximum zoom — 3x
                    step={0.01} // Smooth sliding
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="flex-1 h-1 accent-golden cursor-pointer"
                    aria-label="Zoom"
                  />
                  <span className="text-xs text-text-muted w-8">
                    {/* Larger icon for max zoom */}
                    <Camera size={18} />
                  </span>
                </div>

                <p className="text-center text-xs text-text-muted pb-3">
                  Drag to reposition · scroll or pinch to zoom
                </p>

                {/* Crop step actions */}
                <div className="flex items-center justify-between px-5 pb-5 pt-1 gap-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="btn-ghost btn-sm flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCropDone} // Render canvas and move to preview step
                    className="btn-primary btn-sm flex-1"
                  >
                    Done
                  </button>
                </div>
              </>
            )}

            {/* PREVIEW STEP */}
            {cropStep === "preview" && previewUrl && (
              <>
                {/* Preview area */}
                <div className="flex flex-col items-center gap-5 px-5 py-8">
                  {/* Large circular preview — shows exactly what will be saved */}
                  <div
                    className="w-36 h-36 rounded-full overflow-hidden
                    border-2 border-golden/40 shadow-lg shadow-black/40"
                  >
                    <img
                      src={previewUrl}
                      alt="Avatar preview"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <p className="text-sm text-text-muted text-center">
                    Looking good? Save it, or go back to adjust.
                  </p>
                </div>

                {/* Preview step actions */}
                <div className="flex items-center justify-between px-5 pb-5 gap-3">
                  {/* Re-crop — go back without losing the source image */}
                  <button
                    type="button"
                    onClick={handleRecrop}
                    className="btn-ghost btn-sm flex items-center gap-1.5 flex-1"
                  >
                    <Trash2 size={14} />
                    Re-crop
                  </button>

                  {/* Save — upload the blob to the backend */}
                  <button
                    type="button"
                    onClick={handleSaveAvatar}
                    disabled={isUploading}
                    className="btn-primary btn-sm flex items-center gap-1.5 flex-1"
                  >
                    {isUploading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Save size={14} />
                    )}
                    {isUploading ? "Saving…" : "Save Avatar"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

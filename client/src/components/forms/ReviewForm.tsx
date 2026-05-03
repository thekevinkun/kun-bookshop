import { useState } from "react";

// Import all our review hooks
import { useCreateReview, useUpdateReview } from "../../hooks/useReviews";

import { Star } from "lucide-react";

import { toast } from "sonner";

// StarPicker — interactive star rating input
const StarPicker = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) => {
  // Track which star the user is hovering over so we can preview the rating
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)} // Set the rating when clicked
          onMouseEnter={() => setHovered(star)} // Preview on hover
          onMouseLeave={() => setHovered(0)} // Clear preview on leave
          className="transition-transform hover:scale-110"
        >
          <Star
            size={20}
            className={
              star <= (hovered || value)
                ? "text-amber-400 fill-amber-400" // Filled — selected or hovered
                : "text-slate-600" // Empty
            }
          />
        </button>
      ))}
    </div>
  );
};

// ReviewForm — create or edit a review
interface ReviewFormProps {
  bookId: string;
  // If existingReview is provided we're editing, otherwise creating
  existingReview?: { _id: string; rating: number; comment: string } | null;
  onCancel?: () => void;
}

const ReviewForm = ({ bookId, existingReview, onCancel }: ReviewFormProps) => {
  const isEditing = !!existingReview;

  // Form state — pre-fill if editing
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [comment, setComment] = useState(existingReview?.comment ?? "");
  const [error, setError] = useState("");

  const { mutate: createReview, isPending: isCreating } =
    useCreateReview(bookId);
  const { mutate: updateReview, isPending: isUpdating } =
    useUpdateReview(bookId);

  const isPending = isCreating || isUpdating;

  const handleSubmit = () => {
    setError("");

    // Client-side validation before hitting the server
    if (rating === 0) {
      setError("Please select a star rating.");
      return;
    }
    if (comment.trim().length < 10) {
      setError("Review must be at least 10 characters.");
      return;
    }

    if (isEditing) {
      // Update existing review
      updateReview(
        { reviewId: existingReview._id, rating, comment },
        {
          onSuccess: () => {
            toast.success("Review updated successfully");
            onCancel?.();
          },
          onError: (err: unknown) => {
            const message =
              (err as { response?: { data?: { error?: string } } }).response
                ?.data?.error ?? "Failed to update review";

            toast.error(message);
            setError(message);
          },
        },
      );
      onCancel?.(); // Close edit mode after submitting
    } else {
      // Create new review
      createReview(
        { rating, comment },
        {
          onSuccess: () => {
            toast.success("Review submitted successfully");

            // Reset form after successful submission
            setRating(0);
            setComment("");
          },
          onError: (err: unknown) => {
            const message =
              (err as { response?: { data?: { error?: string } } }).response
                ?.data?.error ?? "Failed to submit review";

            toast.error(message);
            setError(message);
          },
        },
      );
    }
  };

  return (
    <div className="bg-[#0F172A] rounded-xl p-4 border border-slate-700/50 space-y-3">
      <p className="text-slate-300 text-sm font-semibold">
        {isEditing ? "Edit your review" : "Write a review"}
      </p>

      {/* Star picker */}
      <StarPicker value={rating} onChange={setRating} />

      {/* Comment textarea */}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={4}
        placeholder="Share your thoughts about this book... (min 10 characters)"
        className="input-field resize-none text-sm"
      />

      {/* Error message */}
      {error && <p className="text-red-400 text-xs">{error}</p>}

      {/* Action buttons */}
      <div className="flex gap-2">
        {isEditing && (
          <button onClick={onCancel} className="btn-ghost text-sm px-4 py-2">
            Cancel
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="btn-primary text-sm px-4 py-2 disabled:opacity-50"
        >
          {isPending
            ? "Submitting..."
            : isEditing
              ? "Save Changes"
              : "Submit Review"}
        </button>
      </div>
    </div>
  );
};

export default ReviewForm;

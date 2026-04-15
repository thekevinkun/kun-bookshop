import { useState } from "react";

// Import icons
import { Star, ThumbsUp, Pencil, Trash2 } from "lucide-react";

// Import all our review hooks
import { useDeleteReview, useMarkHelpful } from "../hooks/useReviews";

import { ReviewForm } from "../components/forms";

// Import type for review
import type { IReview } from "../types/book";

// ReviewCard — single review row 7
interface ReviewCardProps {
  review: IReview;
  bookId: string;
  currentUserId?: string;
  currentUserRole?: string;
}

const ReviewCard = ({
  review,
  bookId,
  currentUserId,
  currentUserRole,
}: ReviewCardProps) => {
  // Track whether this card is in edit mode
  const [isEditing, setIsEditing] = useState(false);

  const { mutate: deleteReview } = useDeleteReview(bookId);
  const { mutate: markHelpful } = useMarkHelpful(bookId);

  // Is the logged-in user the one who wrote this review?
  const isOwner = currentUserId && review.userId?._id === currentUserId;
  const isAdmin = currentUserRole === "admin";
  const hasVoted = !!(
    currentUserId &&
    review.helpfulVoters?.some((id) => String(id) === currentUserId)
  );

  const handleDelete = () => {
    if (window.confirm("Delete this review?")) {
      deleteReview(review._id);
    }
  };

  // If in edit mode, show the ReviewForm pre-filled with existing data
  if (isEditing) {
    return (
      <ReviewForm
        bookId={bookId}
        existingReview={{
          _id: review._id,
          rating: review.rating,
          comment: review.comment,
        }}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-2 pb-4 border-b border-slate-700/50 last:border-0">
      {/* Review header — user info + star rating */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Avatar — photo if available, initials otherwise */}
          {review.userId?.avatar ? (
            <img
              src={review.userId.avatar}
              alt={review.userId.firstName}
              className="w-8 h-8 rounded-full object-cover border border-golden/85"
            />
          ) : (
            <div
              className="w-8 h-8 rounded-full bg-golden/50 border border-golden/85
                text-text-light flex items-center justify-center text-xs font-bold"
            >
              {review.userId?.firstName?.[0]}
              {review.userId?.lastName?.[0]}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <p className="text-slate-200 text-sm font-semibold">
                {review.userId?.firstName} {review.userId?.lastName}
              </p>
              {/* Verified badge — only shown if the reviewer purchased the book */}
              {isOwner && (
                <span className="px-1.5 py-0.5 bg-teal/85 text-text-white text-xs rounded">
                  You
                </span>
              )}
            </div>
            <p className="text-text-muted text-xs">
              {new Date(review.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Star rating display */}
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={12}
              className={
                i < review.rating
                  ? "text-amber-400 fill-amber-400"
                  : "text-bg-hover fill-bg-hover"
              }
            />
          ))}
        </div>
      </div>

      {/* Review comment */}
      <p className="text-slate-400 text-sm leading-relaxed">{review.comment}</p>

      {/* Review footer — helpful vote + edit/delete for owner */}
      <div className="flex items-center justify-between mt-1">
        {/* Helpful button */}
        <button
          onClick={() => markHelpful(review._id)}
          title={hasVoted ? "You already voted" : ""}
          className={`flex items-center gap-1.5 text-xs transition-colors
            ${
              hasVoted
                ? "text-teal/80 hover:text-text-muted"
                : "text-text-muted hover:text-teal/80"
            }
          `}
        >
          <ThumbsUp size={13} />
          Helpful ({review.helpfulCount})
        </button>

        {/* Edit + Delete — only for the review owner or an admin */}
        {(isOwner || isAdmin) && (
          <div className="flex items-center gap-2">
            {isOwner && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1 text-text-muted hover:text-golden/80
                  text-xs transition-colors"
              >
                <Pencil size={12} />
                Edit
              </button>
            )}
            <button
              onClick={handleDelete}
              className="flex items-center gap-1 text-text-muted hover:text-error
                text-xs transition-colors"
            >
              <Trash2 size={12} />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewCard;

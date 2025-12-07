"use client";

import { Review } from "@/hooks/use-recipe-reviews";
import { Star, Trash2 } from "lucide-react";
import { useState } from "react";

interface ReviewFormProps {
  userReview: Review | null;
  onSubmit: (rating: number, comment: string) => Promise<boolean>;
  onDelete: () => Promise<boolean>;
  isAuthenticated: boolean;
}

export default function ReviewForm({
  userReview,
  onSubmit,
  onDelete,
  isAuthenticated,
}: ReviewFormProps) {
  const [rating, setRating] = useState(userReview?.rating || 0);
  const [comment, setComment] = useState(userReview?.comment || "");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    setSubmitting(true);
    const ok = await onSubmit(rating, comment);
    setSubmitting(false);

    if (ok) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError("Failed to submit review");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete your review?")) return;

    setDeleting(true);
    const ok = await onDelete();
    setDeleting(false);

    if (ok) {
      setRating(0);
      setComment("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError("Failed to delete review");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-center">
        <p className="text-sm text-blue-900">Please sign in to leave a review</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border p-4 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">
        {userReview ? "Edit Your Review" : "Leave a Review"}
      </h3>

      {/* Star Rating Input */}
      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-gray-700">Rating</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="transition hover:scale-110"
              aria-label={`${star} stars`}
            >
              <Star
                className={`h-8 w-8 ${
                  star <= rating
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300 hover:text-yellow-300"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Comment Input */}
      <div className="mb-4">
        <label htmlFor="comment" className="mb-2 block text-sm font-medium text-gray-700">
          Comment (optional)
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this recipe..."
          className="h-24 w-full rounded-lg border px-3 py-2 text-sm"
          maxLength={500}
        />
        <p className="mt-1 text-xs text-gray-500">{comment.length}/500</p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
          {userReview ? "Review updated successfully!" : "Review submitted successfully!"}
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting || rating === 0}
          className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "Submitting..." : userReview ? "Update Review" : "Submit Review"}
        </button>

        {userReview && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-red-600 hover:bg-red-100 disabled:opacity-50"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        )}
      </div>
    </form>
  );
}

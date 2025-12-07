"use client";

import { Review, ReviewStats } from "@/hooks/use-recipe-reviews";
import { Star, User } from "lucide-react";

interface ReviewListProps {
  reviews: Review[];
  stats: ReviewStats;
  loading?: boolean;
}

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "lg" ? "h-6 w-6" : size === "md" ? "h-5 w-5" : "h-4 w-4";

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClass} ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
        />
      ))}
    </div>
  );
}

export default function ReviewList({ reviews, stats, loading }: ReviewListProps) {
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-lg bg-gray-200" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="rounded-lg bg-gray-50 p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="mb-2 flex items-end gap-2">
              <span className="text-4xl font-bold text-gray-900">{stats.averageRating}</span>
              <span className="text-sm text-gray-600">/ 5.0</span>
            </div>
            <StarRating rating={Math.round(stats.averageRating)} size="md" />
            <p className="mt-2 text-sm text-gray-600">
              Based on {stats.totalReviews} review{stats.totalReviews !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-1 text-right">
            {[5, 4, 3, 2, 1].map((stars) => (
              <div key={stars} className="flex items-center gap-2 text-sm">
                <span className="w-8 text-right text-gray-600">{stars} ⭐</span>
                <div className="h-2 w-24 rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-yellow-400"
                    style={{
                      width: `${stats.totalReviews > 0 ? (stats.ratingDistribution[stars] / stats.totalReviews) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="w-8 text-left text-gray-600">{stats.ratingDistribution[stars]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-gray-500">No reviews yet. Be the first to review this recipe!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-lg border p-4 shadow-sm">
              <div className="mb-2 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {review.User?.fullname || review.User?.username || "Anonymous"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <StarRating rating={review.rating} />
              </div>

              {review.comment && (
                <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700">{review.comment}</p>
              )}

              {review.updated_at !== review.created_at && (
                <p className="mt-2 text-xs text-gray-500 italic">
                  (edited {new Date(review.updated_at).toLocaleDateString()})
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

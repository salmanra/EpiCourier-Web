"use client";

import { useRecipeReviews } from "@/hooks/use-recipe-reviews";
import ReviewForm from "@/components/ui/ReviewForm";
import ReviewList from "@/components/ui/ReviewList";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function RecipeReviewsSection({ recipeId }: { recipeId: number }) {
  const { reviews, userReview, stats, loading, userId, submitReview, deleteReview } =
    useRecipeReviews(recipeId);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };

    checkAuth();
  }, [supabase]);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-6 text-2xl font-bold">Reviews & Ratings</h2>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Reviews List */}
          <div className="lg:col-span-2">
            <ReviewList reviews={reviews} stats={stats} loading={loading} />
          </div>

          {/* Review Form */}
          <div>
            <ReviewForm
              userReview={userReview}
              onSubmit={submitReview}
              onDelete={deleteReview}
              isAuthenticated={isAuthenticated}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

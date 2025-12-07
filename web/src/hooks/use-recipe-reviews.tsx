"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export interface Review {
  id: number;
  user_id: number;
  recipe_id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
  User?: {
    username: string | null;
    fullname: string | null;
  };
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>; // { 1: count, 2: count, ... }
}

/**
 * Hook to manage recipe reviews from Supabase.
 * Fetches all reviews for a recipe and provides methods to submit/update reviews.
 */
export function useRecipeReviews(recipeId: number) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [stats, setStats] = useState<ReviewStats>({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // Fetch user ID and reviews on mount
  useEffect(() => {
    const fetchUserAndReviews = async () => {
      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setUserId(null);
          setLoading(false);
          return;
        }

        // Get user ID from the User table
        const { data: userData, error: userError } = await supabase
          .from("User")
          .select("id")
          .eq("email", user.email)
          .maybeSingle();

        if (userError || !userData) {
          console.warn("Could not fetch user record:", userError);
          setLoading(false);
          return;
        }

        setUserId(userData.id);

        // Fetch all reviews for this recipe with user info
        const { data: reviewData, error: reviewError } = await supabase
          .from("Review")
          .select(
            `
            id,
            user_id,
            recipe_id,
            rating,
            comment,
            created_at,
            updated_at,
            User:user_id(username, fullname)
          `
          )
          .eq("recipe_id", recipeId)
          .order("created_at", { ascending: false });

        if (reviewError) {
          console.error("Error fetching reviews:", reviewError);
          setError("Failed to load reviews");
          setReviews([]);
        } else {
          const allReviews = reviewData || [];
          setReviews(allReviews as Review[]);

          // Find user's own review
          const own = allReviews.find((r) => r.user_id === userData.id);
          setUserReview(own || null);

          // Calculate stats
          if (allReviews.length > 0) {
            const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
            let sum = 0;

            allReviews.forEach((r) => {
              distribution[r.rating]++;
              sum += r.rating;
            });

            setStats({
              averageRating: Math.round((sum / allReviews.length) * 10) / 10,
              totalReviews: allReviews.length,
              ratingDistribution: distribution,
            });
          }
          setError(null);
        }
      } catch (err) {
        console.error("Unexpected error in useRecipeReviews:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndReviews();
  }, [recipeId, supabase]);

  /**
   * Submit or update a review for the recipe.
   */
  const submitReview = async (rating: number, comment: string): Promise<boolean> => {
    if (userId === null) {
      console.warn("User not authenticated; cannot submit review");
      return false;
    }

    if (rating < 1 || rating > 5) {
      console.error("Rating must be between 1 and 5");
      return false;
    }

    try {
      if (userReview) {
        // Update existing review
        const { error } = await supabase
          .from("Review")
          .update({
            rating,
            comment: comment || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userReview.id);

        if (error) {
          console.error("Error updating review:", error);
          return false;
        }
      } else {
        // Insert new review
        const { error } = await supabase.from("Review").insert({
          user_id: userId,
          recipe_id: recipeId,
          rating,
          comment: comment || null,
        });

        if (error) {
          console.error("Error submitting review:", error);
          return false;
        }
      }

      // Refresh reviews
      const { data: refreshedData } = await supabase
        .from("Review")
        .select(
          `
          id,
          user_id,
          recipe_id,
          rating,
          comment,
          created_at,
          updated_at,
          User:user_id(username, fullname)
        `
        )
        .eq("recipe_id", recipeId)
        .order("created_at", { ascending: false });

      if (refreshedData) {
        setReviews(refreshedData as Review[]);

        const own = refreshedData.find((r) => r.user_id === userId);
        setUserReview(own || null);

        // Recalculate stats
        if (refreshedData.length > 0) {
          const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
          let sum = 0;

          refreshedData.forEach((r) => {
            distribution[r.rating]++;
            sum += r.rating;
          });

          setStats({
            averageRating: Math.round((sum / refreshedData.length) * 10) / 10,
            totalReviews: refreshedData.length,
            ratingDistribution: distribution,
          });
        }
      }

      return true;
    } catch (err) {
      console.error("Unexpected error submitting review:", err);
      return false;
    }
  };

  /**
   * Delete user's review for the recipe.
   */
  const deleteReview = async (): Promise<boolean> => {
    if (userReview === null) {
      return false;
    }

    try {
      const { error } = await supabase.from("Review").delete().eq("id", userReview.id);

      if (error) {
        console.error("Error deleting review:", error);
        return false;
      }

      setUserReview(null);

      // Refresh reviews
      const { data: refreshedData } = await supabase
        .from("Review")
        .select(
          `
          id,
          user_id,
          recipe_id,
          rating,
          comment,
          created_at,
          updated_at,
          User:user_id(username, fullname)
        `
        )
        .eq("recipe_id", recipeId)
        .order("created_at", { ascending: false });

      if (refreshedData) {
        setReviews(refreshedData as Review[]);

        // Recalculate stats
        if (refreshedData.length > 0) {
          const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
          let sum = 0;

          refreshedData.forEach((r) => {
            distribution[r.rating]++;
            sum += r.rating;
          });

          setStats({
            averageRating: Math.round((sum / refreshedData.length) * 10) / 10,
            totalReviews: refreshedData.length,
            ratingDistribution: distribution,
          });
        } else {
          setStats({
            averageRating: 0,
            totalReviews: 0,
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          });
        }
      }

      return true;
    } catch (err) {
      console.error("Unexpected error deleting review:", err);
      return false;
    }
  };

  return {
    reviews,
    userReview,
    stats,
    loading,
    error,
    userId,
    submitReview,
    deleteReview,
  };
}

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

/**
 * Hook to manage user favorites from Supabase.
 * Fetches all favorite recipe IDs for the logged-in user and provides methods to toggle favorites.
 */
export function useUserFavorites() {
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);

  const supabase = createClient();

  // Fetch user and favorites on mount
  useEffect(() => {
    const fetchUserAndFavorites = async () => {
      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setUserId(null);
          setFavorites(new Set());
          setLoading(false);
          return;
        }

        // Get user ID from the User table (auth.user.id is UUID, we need the public.User.id)
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

        // Fetch all favorites for this user
        const { data: favData, error: favError } = await supabase
          .from("Favorite")
          .select("recipe_id")
          .eq("user_id", userData.id);

        if (favError) {
          console.error("Error fetching favorites:", favError);
          const errorMsg = typeof favError === "object" && favError !== null && "message" in favError 
            ? (favError as any).message 
            : "Failed to fetch favorites";
          setError(errorMsg);
          // If table doesn't exist, treat as empty favorites (not an error)
          if (errorMsg.includes("Favorite") || errorMsg.includes("does not exist")) {
            setFavorites(new Set());
          }
        } else {
          const favSet = new Set(favData?.map((f) => f.recipe_id) ?? []);
          setFavorites(favSet);
          setError(null);
        }
      } catch (err) {
        console.error("Unexpected error in useUserFavorites:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndFavorites();
  }, [supabase]);

  /**
   * Toggle favorite status for a recipe.
   * If recipe is favorited, remove it; otherwise add it.
   */
  const toggleFavorite = async (recipeId: number): Promise<boolean> => {
    if (userId === null) {
      console.warn("User not authenticated; cannot toggle favorite");
      return false;
    }

    try {
      const isFavorited = favorites.has(recipeId);

      if (isFavorited) {
        // Remove favorite
        const { error } = await supabase
          .from("Favorite")
          .delete()
          .eq("user_id", userId)
          .eq("recipe_id", recipeId);

        if (error) {
          console.error("Error removing favorite:", error);
          const errorMsg = typeof error === "object" && error !== null && "message" in error 
            ? (error as any).message 
            : "Failed to remove favorite";
          setError(errorMsg);
          return false;
        }

        const newFavs = new Set(favorites);
        newFavs.delete(recipeId);
        setFavorites(newFavs);
        setError(null);
      } else {
        // Add favorite
        const { error } = await supabase.from("Favorite").insert({
          user_id: userId,
          recipe_id: recipeId,
        });

        if (error) {
          console.error("Error adding favorite:", error);
          const errorMsg = typeof error === "object" && error !== null && "message" in error 
            ? (error as any).message 
            : "Failed to add favorite";
          setError(errorMsg);
          return false;
        }

        const newFavs = new Set(favorites);
        newFavs.add(recipeId);
        setFavorites(newFavs);
        setError(null);
      }

      return true;
    } catch (err) {
      console.error("Unexpected error toggling favorite:", err);
      return false;
    }
  };

  return {
    favorites,
    loading,
    error,
    userId,
    toggleFavorite,
    isFavorited: (recipeId: number) => favorites.has(recipeId),
  };
}

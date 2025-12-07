"use client";

import { useUserFavorites } from "@/hooks/use-user-favorites";
import { Heart, Loader } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface FavoriteRecipe {
  id: number;
  name: string;
  image_url?: string;
}

export default function FavoritesSidebar() {
  const { favorites, loading } = useUserFavorites();
  const [favoriteRecipes, setFavoriteRecipes] = useState<FavoriteRecipe[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);

  // Fetch recipe details for all favorites
  useEffect(() => {
    const fetchFavoriteRecipes = async () => {
      if (favorites.size === 0) {
        setFavoriteRecipes([]);
        return;
      }

      setLoadingRecipes(true);
      try {
        const recipeIds = Array.from(favorites);
        const { data, error } = await supabase
          .from("Recipe")
          .select("id, name, image_url")
          .in("id", recipeIds);

        if (error) {
          console.warn("Error fetching favorite recipes:", error);
          setFavoriteRecipes([]);
        } else {
          setFavoriteRecipes(data || []);
        }
      } catch (err) {
        console.warn("Error fetching favorite recipes:", err);
      } finally {
        setLoadingRecipes(false);
      }
    };

    fetchFavoriteRecipes();
  }, [favorites]);

  if (loading) {
    return (
      <div className="w-full rounded-lg border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-center gap-2">
          <Loader className="h-5 w-5 animate-spin" />
          <p className="text-sm text-gray-600">Loading favorites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-fit rounded-lg border bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Heart className="h-5 w-5 text-red-500" />
        <h2 className="text-lg font-semibold text-gray-900">My Favorites</h2>
      </div>

      {loadingRecipes ? (
        <div className="flex items-center justify-center gap-2 py-4">
          <Loader className="h-4 w-4 animate-spin" />
          <p className="text-xs text-gray-500">Loading...</p>
        </div>
      ) : favoriteRecipes.length === 0 ? (
        <p className="text-sm text-gray-500">No favorites yet. Heart a recipe to get started!</p>
      ) : (
        <div className="space-y-3">
          {favoriteRecipes.map((recipe) => (
            <div
              key={recipe.id}
              className="group flex gap-3 rounded-lg p-2 transition hover:bg-gray-50"
            >
              {recipe.image_url && (
                <img
                  src={recipe.image_url}
                  alt={recipe.name}
                  className="h-12 w-12 rounded-md object-cover"
                />
              )}
              <div className="flex-1 overflow-hidden">
                <a
                  href={`/dashboard/recipes/${recipe.id}`}
                  className="block text-sm font-medium text-gray-900 hover:text-blue-600"
                >
                  <p className="truncate">{recipe.name}</p>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-4 text-xs text-gray-400">
        {favorites.size} favorite{favorites.size !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

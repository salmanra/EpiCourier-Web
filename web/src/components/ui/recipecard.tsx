"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Recipe } from "../../types/data";
import AddMealModal from "@/components/ui/AddMealModal";
import { Heart, Star, Check } from "lucide-react";
import { useUserFavorites } from "@/hooks/use-user-favorites";
import { useRecipeComparison } from "@/context/ComparisonContext";
import { supabase } from "@/lib/supabaseClient";

export default function RecipeCard({ recipe }: { recipe: Recipe }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isFavorited, toggleFavorite } = useUserFavorites();
  const { isSelected, toggleRecipe, maxRecipes, selectedRecipes } = useRecipeComparison();
  const [toggling, setToggling] = useState(false);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState(0);

  const liked = isFavorited(recipe.id);
  const selected = isSelected(recipe.id);
  const canSelect = selected || selectedRecipes.length < maxRecipes;

  // Fetch average rating for this recipe
  useEffect(() => {
    const fetchRating = async () => {
      try {
        const { data } = await supabase
          .from("Review")
          .select("rating")
          .eq("recipe_id", recipe.id);

        if (data && data.length > 0) {
          const sum = data.reduce((acc, r) => acc + r.rating, 0);
          const avg = Math.round((sum / data.length) * 10) / 10;
          setAvgRating(avg);
          setReviewCount(data.length);
        }
      } catch (err) {
        // silently fail
      }
    };

    fetchRating();
  }, [recipe.id]);

  const handleToggleLike = async () => {
    setToggling(true);
    try {
      await toggleFavorite(recipe.id);
    } catch (err) {
      // silently fail
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="relative flex flex-col rounded-lg border p-4 shadow-sm transition hover:shadow-lg">
      {/* Heart button (top-right) */}
      <button
        disabled={toggling}
        aria-pressed={liked}
        aria-label={liked ? "Unfavorite recipe" : "Favorite recipe"}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleToggleLike();
        }}
        className="absolute right-3 top-3 z-10 rounded-full bg-white p-1 shadow hover:scale-105 disabled:opacity-50"
        title={liked ? "Unfavorite" : "Favorite"}
      >
        <Heart
          className={`h-5 w-5 transition-colors ${
            liked ? "text-red-500" : "text-gray-400"
          }`}
        />
      </button>

      {/* Checkbox button (top-left) */}
      <button
        disabled={!canSelect}
        aria-pressed={selected}
        aria-label={selected ? "Deselect for comparison" : "Select for comparison"}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleRecipe(recipe);
        }}
        className={`absolute left-3 top-3 z-10 rounded-full p-1 shadow transition ${
          selected ? "bg-blue-600" : "bg-white"
        } ${canSelect ? "hover:scale-105 cursor-pointer" : "opacity-50 cursor-not-allowed"}`}
        title={selected ? "Deselect" : "Select for comparison"}
      >
        <Check
          className={`h-5 w-5 ${selected ? "text-white" : "text-gray-400"}`}
        />
      </button>

      <Link
        className="flex flex-col rounded-lg p-0"
        href={`/dashboard/recipes/${recipe.id}`}
      >
        {recipe.image_url && (
          <Image
            src={recipe.image_url}
            alt={recipe.name ?? "recipe"}
            width={120}
            height={120}
            className="mb-2 self-center rounded-lg object-cover"
          />
        )}
        <h3 className="text-lg font-semibold">{recipe.name}</h3>
        <p className="line-clamp-2 text-sm text-gray-600">{recipe.description}</p>
      </Link>

      {/* Rating Badge */}
      {avgRating !== null && (
        <div className="my-2 flex items-center gap-1">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium text-gray-900">{avgRating}</span>
          </div>
          <span className="text-xs text-gray-500">({reviewCount})</span>
        </div>
      )}

      <button
        onClick={(e) => {
          e.preventDefault();
          setIsModalOpen(true);
        }}
        className="mt-3 w-full rounded bg-blue-600 py-2 text-white hover:bg-blue-700"
      >
        + Add to Calendar
      </button>

      {isModalOpen && (
        <AddMealModal
          recipe={{ id: recipe.id, name: recipe.name ?? "Unnamed Recipe" }}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}

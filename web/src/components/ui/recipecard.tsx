"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Recipe } from "../../types/data";
import AddMealModal from "@/components/ui/AddMealModal";
import { Heart } from "lucide-react";
import { useUserFavorites } from "@/hooks/use-user-favorites";

export default function RecipeCard({ recipe }: { recipe: Recipe }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isFavorited, toggleFavorite } = useUserFavorites();
  const [toggling, setToggling] = useState(false);

  const liked = isFavorited(recipe.id);

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
      <button
        onClick={(e) => {
          e.preventDefault(); // 防止 Link 觸發跳轉
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

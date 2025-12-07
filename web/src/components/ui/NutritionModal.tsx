"use client";

import { Recipe } from "@/types/data";
import { X } from "lucide-react";
import NutritionSummary from "./NutritionSummary";
import { useRecipeNutrition } from "@/hooks/use-recipe-nutrition";

interface NutritionModalProps {
  recipes: Recipe[];
  isOpen: boolean;
  onClose: () => void;
}

export default function NutritionModal({ recipes, isOpen, onClose }: NutritionModalProps) {
  const recipeIds = recipes.map((r) => r.id);
  const { nutrition, loading, error } = useRecipeNutrition(recipeIds);

  if (!isOpen || recipes.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-auto rounded-lg bg-white shadow-lg">
        <div className="sticky top-0 flex items-center justify-between border-b bg-white p-4">
          <h2 className="text-lg font-bold">Nutrition Summary</h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
              Unable to load nutrition data. Please check your database connection.
            </div>
          )}

          {!error && <NutritionSummary nutrition={nutrition} loading={loading} showRecipeDetails={true} />}

          <div className="mt-6 flex justify-end">
            <button onClick={onClose} className="rounded-lg bg-gray-200 px-4 py-2 hover:bg-gray-300">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

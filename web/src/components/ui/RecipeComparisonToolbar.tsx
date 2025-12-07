"use client";

import { useRecipeComparison } from "@/context/ComparisonContext";
import { Trash2, Eye } from "lucide-react";
import { useState } from "react";
import RecipeComparisonModal from "./RecipeComparisonModal";

export default function RecipeComparisonToolbar() {
  const { selectedRecipes, clearSelection, maxRecipes } = useRecipeComparison();
  const [showModal, setShowModal] = useState(false);

  if (selectedRecipes.length === 0) {
    return null;
  }

  return (
    <>
      <div className="sticky bottom-0 left-0 right-0 border-t bg-white shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-gray-700">
              Selected for comparison: <span className="font-bold">{selectedRecipes.length}</span>
              <span className="text-gray-500">/{maxRecipes}</span>
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowModal(true)}
              disabled={selectedRecipes.length < 2}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Eye className="h-4 w-4" />
              View Comparison
            </button>

            <button
              onClick={clearSelection}
              className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-red-600 hover:bg-red-100"
            >
              <Trash2 className="h-4 w-4" />
              Clear
            </button>
          </div>
        </div>
      </div>

      <RecipeComparisonModal
        recipes={selectedRecipes}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}

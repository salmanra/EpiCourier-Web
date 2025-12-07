"use client";

import { createContext, useContext, useState } from "react";
import { Recipe } from "@/types/data";

interface ComparisonContextType {
  selectedRecipes: Recipe[];
  isSelected: (recipeId: number) => boolean;
  toggleRecipe: (recipe: Recipe) => void;
  clearSelection: () => void;
  maxRecipes: number;
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

export function ComparisonProvider({ children }: { children: React.ReactNode }) {
  const [selectedRecipes, setSelectedRecipes] = useState<Recipe[]>([]);
  const MAX_RECIPES = 3;

  const isSelected = (recipeId: number) => {
    return selectedRecipes.some((r) => r.id === recipeId);
  };

  const toggleRecipe = (recipe: Recipe) => {
    if (isSelected(recipe.id)) {
      setSelectedRecipes(selectedRecipes.filter((r) => r.id !== recipe.id));
    } else if (selectedRecipes.length < MAX_RECIPES) {
      setSelectedRecipes([...selectedRecipes, recipe]);
    }
  };

  const clearSelection = () => {
    setSelectedRecipes([]);
  };

  return (
    <ComparisonContext.Provider
      value={{
        selectedRecipes,
        isSelected,
        toggleRecipe,
        clearSelection,
        maxRecipes: MAX_RECIPES,
      }}
    >
      {children}
    </ComparisonContext.Provider>
  );
}

export function useRecipeComparison() {
  const context = useContext(ComparisonContext);
  if (!context) {
    throw new Error("useRecipeComparison must be used within ComparisonProvider");
  }
  return context;
}

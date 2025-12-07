"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export interface NutritionData {
  calories_kcal: number;
  protein_g: number;
  carbs_g: number;
  sugars_g: number;
  agg_fats_g: number;
  cholesterol_mg: number;
  agg_minerals_mg: number;
  vit_a_microg: number;
  total_vit_b_mg: number;
  vit_c_mg: number;
  vit_d_microg: number;
  vit_e_mg: number;
  vit_k_microg: number;
}

export interface RecipeNutrition {
  recipeId: number;
  recipeName: string;
  nutrition: NutritionData;
}

export interface AggregatedNutrition {
  total: NutritionData;
  average: NutritionData;
  recipes: RecipeNutrition[];
}

const NUTRITION_FIELDS = [
  "calories_kcal",
  "protein_g",
  "carbs_g",
  "sugars_g",
  "agg_fats_g",
  "cholesterol_mg",
  "agg_minerals_mg",
  "vit_a_microg",
  "total_vit_b_mg",
  "vit_c_mg",
  "vit_d_microg",
  "vit_e_mg",
  "vit_k_microg",
];

/**
 * Hook to fetch and calculate nutrition data for recipes.
 */
export function useRecipeNutrition(recipeIds: number[]) {
  const [nutrition, setNutrition] = useState<AggregatedNutrition | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (recipeIds.length === 0) {
      setNutrition(null);
      return;
    }

    const fetchNutrition = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch recipes with their ingredient mappings
        const { data: recipeData, error: recipeError } = await supabase
          .from("Recipe")
          .select("id, name")
          .in("id", recipeIds);

        if (recipeError || !recipeData) {
          setError("Failed to fetch recipes");
          return;
        }

        // For each recipe, calculate total nutrition
        const recipesWithNutrition: RecipeNutrition[] = [];
        const totals: Partial<NutritionData> = {};
        NUTRITION_FIELDS.forEach((field) => {
          totals[field as keyof NutritionData] = 0;
        });

        for (const recipe of recipeData) {
          // Fetch ingredients for this recipe
          const { data: ingredients, error: ingError } = await supabase
            .from("Recipe-Ingredient_Map")
            .select(
              `
              relative_unit_100,
              Ingredient:ingredient_id(
                calories_kcal,
                protein_g,
                carbs_g,
                sugars_g,
                agg_fats_g,
                cholesterol_mg,
                agg_minerals_mg,
                vit_a_microg,
                agg_vit_b_mg,
                vit_c_mg,
                vit_d_microg,
                vit_e_mg,
                vit_k_microg
              )
            `
            )
            .eq("recipe_id", recipe.id);

          if (ingError) {
            console.warn(`Failed to fetch ingredients for recipe ${recipe.id}:`, ingError);
            continue;
          }

          // Calculate nutrition for this recipe
          const recipeNutrition: NutritionData = {
            calories_kcal: 0,
            protein_g: 0,
            carbs_g: 0,
            sugars_g: 0,
            agg_fats_g: 0,
            cholesterol_mg: 0,
            agg_minerals_mg: 0,
            vit_a_microg: 0,
            total_vit_b_mg: 0,
            vit_c_mg: 0,
            vit_d_microg: 0,
            vit_e_mg: 0,
            vit_k_microg: 0,
          };

          if (ingredients && ingredients.length > 0) {
            ingredients.forEach((map: any) => {
              const ingredient = map.Ingredient;
              const ratio = (map.relative_unit_100 || 100) / 100;

              recipeNutrition.calories_kcal += (ingredient?.calories_kcal || 0) * ratio;
              recipeNutrition.protein_g += (ingredient?.protein_g || 0) * ratio;
              recipeNutrition.carbs_g += (ingredient?.carbs_g || 0) * ratio;
              recipeNutrition.sugars_g += (ingredient?.sugars_g || 0) * ratio;
              recipeNutrition.agg_fats_g += (ingredient?.agg_fats_g || 0) * ratio;
              recipeNutrition.cholesterol_mg += (ingredient?.cholesterol_mg || 0) * ratio;
              recipeNutrition.agg_minerals_mg += (ingredient?.agg_minerals_mg || 0) * ratio;
              recipeNutrition.vit_a_microg += (ingredient?.vit_a_microg || 0) * ratio;
              recipeNutrition.total_vit_b_mg += (ingredient?.agg_vit_b_mg || 0) * ratio;
              recipeNutrition.vit_c_mg += (ingredient?.vit_c_mg || 0) * ratio;
              recipeNutrition.vit_d_microg += (ingredient?.vit_d_microg || 0) * ratio;
              recipeNutrition.vit_e_mg += (ingredient?.vit_e_mg || 0) * ratio;
              recipeNutrition.vit_k_microg += (ingredient?.vit_k_microg || 0) * ratio;
            });
          }

          recipesWithNutrition.push({
            recipeId: recipe.id,
            recipeName: recipe.name || "Unknown",
            nutrition: recipeNutrition,
          });

          // Add to totals
          Object.keys(recipeNutrition).forEach((key) => {
            totals[key as keyof NutritionData] =
              (totals[key as keyof NutritionData] || 0) +
              recipeNutrition[key as keyof NutritionData];
          });
        }

        // Calculate averages
        const count = recipesWithNutrition.length || 1;
        const average: NutritionData = {
          calories_kcal: (totals.calories_kcal || 0) / count,
          protein_g: (totals.protein_g || 0) / count,
          carbs_g: (totals.carbs_g || 0) / count,
          sugars_g: (totals.sugars_g || 0) / count,
          agg_fats_g: (totals.agg_fats_g || 0) / count,
          cholesterol_mg: (totals.cholesterol_mg || 0) / count,
          agg_minerals_mg: (totals.agg_minerals_mg || 0) / count,
          vit_a_microg: (totals.vit_a_microg || 0) / count,
          total_vit_b_mg: (totals.total_vit_b_mg || 0) / count,
          vit_c_mg: (totals.vit_c_mg || 0) / count,
          vit_d_microg: (totals.vit_d_microg || 0) / count,
          vit_e_mg: (totals.vit_e_mg || 0) / count,
          vit_k_microg: (totals.vit_k_microg || 0) / count,
        };

        setNutrition({
          total: totals as NutritionData,
          average,
          recipes: recipesWithNutrition,
        });
      } catch (err) {
        console.error("Error fetching nutrition data:", err);
        setError("Failed to calculate nutrition");
      } finally {
        setLoading(false);
      }
    };

    fetchNutrition();
  }, [recipeIds]);

  return { nutrition, loading, error };
}

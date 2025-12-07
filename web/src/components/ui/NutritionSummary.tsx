"use client";

import { AggregatedNutrition, NutritionData } from "@/hooks/use-recipe-nutrition";
import { BarChart3, Zap, Droplet, Wind } from "lucide-react";

interface NutritionSummaryProps {
  nutrition: AggregatedNutrition | null;
  loading?: boolean;
  showRecipeDetails?: boolean;
}

const NUTRITION_LABELS: Record<keyof NutritionData, { label: string; unit: string; icon: React.ReactNode }> = {
  calories_kcal: { label: "Calories", unit: "kcal", icon: <Zap className="h-4 w-4" /> },
  protein_g: { label: "Protein", unit: "g", icon: <Wind className="h-4 w-4" /> },
  carbs_g: { label: "Carbs", unit: "g", icon: <BarChart3 className="h-4 w-4" /> },
  sugars_g: { label: "Sugars", unit: "g", icon: <Droplet className="h-4 w-4" /> },
  agg_fats_g: { label: "Total Fat", unit: "g", icon: <Wind className="h-4 w-4" /> },
  cholesterol_mg: { label: "Cholesterol", unit: "mg", icon: <Droplet className="h-4 w-4" /> },
  agg_minerals_mg: { label: "Minerals", unit: "mg", icon: <BarChart3 className="h-4 w-4" /> },
  vit_a_microg: { label: "Vitamin A", unit: "µg", icon: <Wind className="h-4 w-4" /> },
  total_vit_b_mg: { label: "Vitamin B", unit: "mg", icon: <Wind className="h-4 w-4" /> },
  vit_c_mg: { label: "Vitamin C", unit: "mg", icon: <Zap className="h-4 w-4" /> },
  vit_d_microg: { label: "Vitamin D", unit: "µg", icon: <Wind className="h-4 w-4" /> },
  vit_e_mg: { label: "Vitamin E", unit: "mg", icon: <Wind className="h-4 w-4" /> },
  vit_k_microg: { label: "Vitamin K", unit: "µg", icon: <Wind className="h-4 w-4" /> },
};

function NutritionRow({
  field,
  value,
  label,
  unit,
  icon,
}: {
  field: keyof NutritionData;
  value: number;
  label: string;
  unit: string;
  icon: React.ReactNode;
}) {
  const displayValue = Math.round(value * 10) / 10;
  
  return (
    <div className="flex items-center justify-between border-b py-3 px-2 hover:bg-gray-50">
      <div className="flex items-center gap-2">
        <div className="text-gray-500">{icon}</div>
        <span className="font-medium text-gray-700">{label}</span>
      </div>
      <div className="text-right">
        <span className="font-semibold text-gray-900">{displayValue}</span>
        <span className="ml-1 text-sm text-gray-500">{unit}</span>
      </div>
    </div>
  );
}

export default function NutritionSummary({
  nutrition,
  loading,
  showRecipeDetails = false,
}: NutritionSummaryProps) {
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 rounded bg-gray-200" />
        ))}
      </div>
    );
  }

  if (!nutrition) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-center text-gray-500">
        Select recipes to view nutrition summary
      </div>
    );
  }

  const mainNutrients: (keyof NutritionData)[] = [
    "calories_kcal",
    "protein_g",
    "carbs_g",
    "agg_fats_g",
  ];

  const microNutrients: (keyof NutritionData)[] = [
    "sugars_g",
    "cholesterol_mg",
    "vit_a_microg",
    "total_vit_b_mg",
    "vit_c_mg",
    "vit_d_microg",
    "vit_e_mg",
    "vit_k_microg",
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-blue-50 p-4">
          <p className="text-sm text-blue-600 font-medium">Total Calories</p>
          <p className="mt-1 text-2xl font-bold text-blue-900">
            {Math.round(nutrition.total.calories_kcal)}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            {nutrition.recipes.length} recipe{nutrition.recipes.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="rounded-lg bg-green-50 p-4">
          <p className="text-sm text-green-600 font-medium">Total Protein</p>
          <p className="mt-1 text-2xl font-bold text-green-900">
            {Math.round(nutrition.total.protein_g * 10) / 10}g
          </p>
          <p className="text-xs text-green-600 mt-1">
            {Math.round((nutrition.total.protein_g / nutrition.total.calories_kcal) * 100 * 4 || 0)}% of calories
          </p>
        </div>

        <div className="rounded-lg bg-orange-50 p-4">
          <p className="text-sm text-orange-600 font-medium">Total Carbs</p>
          <p className="mt-1 text-2xl font-bold text-orange-900">
            {Math.round(nutrition.total.carbs_g * 10) / 10}g
          </p>
          <p className="text-xs text-orange-600 mt-1">
            {Math.round((nutrition.total.carbs_g / nutrition.total.calories_kcal) * 100 * 4 || 0)}% of calories
          </p>
        </div>

        <div className="rounded-lg bg-red-50 p-4">
          <p className="text-sm text-red-600 font-medium">Total Fat</p>
          <p className="mt-1 text-2xl font-bold text-red-900">
            {Math.round(nutrition.total.agg_fats_g * 10) / 10}g
          </p>
          <p className="text-xs text-red-600 mt-1">
            {Math.round((nutrition.total.agg_fats_g / nutrition.total.calories_kcal) * 100 * 9 || 0)}% of calories
          </p>
        </div>
      </div>

      {/* Main Nutrients */}
      <div className="rounded-lg border shadow-sm">
        <h3 className="border-b bg-gray-50 px-4 py-3 font-semibold text-gray-900">
          Total Nutrition (All Recipes)
        </h3>
        <div>
          {mainNutrients.map((field) => {
            const meta = NUTRITION_LABELS[field];
            return (
              <NutritionRow
                key={field}
                field={field}
                value={nutrition.total[field]}
                label={meta.label}
                unit={meta.unit}
                icon={meta.icon}
              />
            );
          })}
        </div>
      </div>

      {/* Average Nutrients */}
      <div className="rounded-lg border shadow-sm">
        <h3 className="border-b bg-gray-50 px-4 py-3 font-semibold text-gray-900">
          Average Nutrition (Per Recipe)
        </h3>
        <div>
          {mainNutrients.map((field) => {
            const meta = NUTRITION_LABELS[field];
            return (
              <NutritionRow
                key={field}
                field={field}
                value={nutrition.average[field]}
                label={meta.label}
                unit={meta.unit}
                icon={meta.icon}
              />
            );
          })}
        </div>
      </div>

      {/* Micronutrients */}
      <div className="rounded-lg border shadow-sm">
        <h3 className="border-b bg-gray-50 px-4 py-3 font-semibold text-gray-900">
          Micronutrients (Total)
        </h3>
        <div>
          {microNutrients.map((field) => {
            const meta = NUTRITION_LABELS[field];
            return (
              <NutritionRow
                key={field}
                field={field}
                value={nutrition.total[field]}
                label={meta.label}
                unit={meta.unit}
                icon={meta.icon}
              />
            );
          })}
        </div>
      </div>

      {/* Recipe Details */}
      {showRecipeDetails && nutrition.recipes.length > 0 && (
        <div className="rounded-lg border shadow-sm">
          <h3 className="border-b bg-gray-50 px-4 py-3 font-semibold text-gray-900">
            Per Recipe Breakdown
          </h3>
          <div className="space-y-4 p-4">
            {nutrition.recipes.map((recipe) => (
              <div key={recipe.recipeId} className="rounded-lg bg-gray-50 p-4">
                <h4 className="mb-3 font-semibold text-gray-900">{recipe.recipeName}</h4>
                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                  {mainNutrients.map((field) => {
                    const meta = NUTRITION_LABELS[field];
                    const value = Math.round(recipe.nutrition[field] * 10) / 10;
                    return (
                      <div key={field} className="text-sm">
                        <p className="text-gray-600">{meta.label}</p>
                        <p className="font-semibold text-gray-900">
                          {value}
                          <span className="ml-1 text-xs text-gray-500">{meta.unit}</span>
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

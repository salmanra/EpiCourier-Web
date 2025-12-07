"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

interface RecipeCount {
  recipe: {
    id: number;
    name: string;
    image_url: string | null;
    green_score: number | null;
  };
  count: number;
}

export default function InsightsPage() {
  const [recipeCounts, setRecipeCounts] = useState<RecipeCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecipeCounts = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/insights/recipe-counts");
        if (!response.ok) {
          throw new Error("Failed to fetch recipe counts");
        }
        const data = await response.json();
        setRecipeCounts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecipeCounts();
  }, []);

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Insights</h1>
        <p className="mt-2 text-gray-600">
          Visualize your meal history and track your favorite recipes
        </p>
      </div>

      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-gray-800">
          Recipe History
        </h2>
        <p className="mb-6 text-sm text-gray-600">
          All recipes you&apos;ve added to your calendar, sorted by frequency
        </p>

        {isLoading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : recipeCounts.length === 0 ? (
          <p className="text-center text-gray-500">
            No recipes in your calendar yet. Start planning meals to see insights!
          </p>
        ) : (
          <div className="space-y-3">
            {recipeCounts.map(({ recipe, count }) => (
              <div
                key={recipe.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  {recipe.image_url ? (
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md">
                      <Image
                        src={recipe.image_url}
                        alt={recipe.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-md bg-gray-200">
                      <span className="text-2xl text-gray-400">🍽️</span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {recipe.name}
                    </h3>
                    {recipe.green_score !== null && (
                      <p className="text-sm text-gray-500">
                        Green Score: {recipe.green_score}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-blue-100 px-4 py-2 text-lg font-semibold text-blue-700">
                    {count}
                  </span>
                  <span className="text-sm text-gray-500">
                    {count === 1 ? "time" : "times"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

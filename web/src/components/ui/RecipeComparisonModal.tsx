"use client";

import { Recipe } from "@/types/data";
import { X } from "lucide-react";
import Image from "next/image";
interface RecipeComparisonModalProps {
  recipes: Recipe[];
  isOpen: boolean;
  onClose: () => void;
}

export default function RecipeComparisonModal({
  recipes,
  isOpen,
  onClose,
}: RecipeComparisonModalProps) {
  if (!isOpen || recipes.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-6xl max-h-[90vh] overflow-auto rounded-lg bg-white shadow-lg">
        <div className="sticky top-0 flex items-center justify-between border-b bg-white p-6">
          <h2 className="text-2xl font-bold">Compare Recipes</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="py-3 px-4 text-left font-semibold text-gray-900">Attribute</th>
                  {recipes.map((recipe) => (
                    <th key={recipe.id} className="py-3 px-4 text-center">
                      <div className="flex flex-col items-center gap-2">
                        {recipe.image_url && (
                          <Image
                            src={recipe.image_url}
                            alt={recipe.name ?? ""}
                            width={80}
                            height={80}
                            className="rounded-lg object-cover"
                          />
                        )}
                        <p className="font-semibold text-gray-900">{recipe.name}</p>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Prep Time */}
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-700">Prep Time</td>
                  {recipes.map((recipe) => (
                    <td key={recipe.id} className="py-3 px-4 text-center text-gray-900">
                      {recipe.min_prep_time ?? "N/A"} mins
                    </td>
                  ))}
                </tr>

                {/* Green Score */}
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-700">Green Score</td>
                  {recipes.map((recipe) => (
                    <td key={recipe.id} className="py-3 px-4 text-center">
                      <span
                        className={`rounded-full px-3 py-1 text-sm font-semibold ${
                          (recipe.green_score ?? 0) >= 7
                            ? "bg-green-100 text-green-800"
                            : (recipe.green_score ?? 0) >= 5
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {recipe.green_score ?? "N/A"}/10
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Description */}
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-700">Description</td>
                  {recipes.map((recipe) => (
                    <td
                      key={recipe.id}
                      className="py-3 px-4 text-sm text-gray-600 line-clamp-3"
                    >
                      {recipe.description ?? "N/A"}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Quick Info Cards */}
          <div className="mt-8 grid gap-4">
            <h3 className="text-lg font-semibold">Recipe Details</h3>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {recipes.map((recipe) => (
                <div key={recipe.id} className="rounded-lg border p-4 shadow-sm">
                  <h4 className="mb-3 font-semibold text-gray-900">{recipe.name}</h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-medium text-gray-700">ID:</span>{" "}
                      <span className="text-gray-600">{recipe.id}</span>
                    </p>
                    <p>
                      <span className="font-medium text-gray-700">Prep Time:</span>{" "}
                      <span className="text-gray-600">{recipe.min_prep_time} mins</span>
                    </p>
                    <p>
                      <span className="font-medium text-gray-700">Green Score:</span>{" "}
                      <span className="text-gray-600">{recipe.green_score}/10</span>
                    </p>
                    <p>
                      <span className="font-medium text-gray-700">Created:</span>{" "}
                      <span className="text-gray-600">
                        {new Date(recipe.created_at).toLocaleDateString()}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Close Button */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={onClose}
              className="rounded-lg bg-gray-200 px-6 py-2 font-medium hover:bg-gray-300"
            >
              Close Comparison
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface TopRecipe {
  id: number;
  name: string;
  totalCount: number;
}

interface TrendData {
  week: string;
  [recipeName: string]: string | number;
}

interface RecipeTrendsData {
  topRecipes: TopRecipe[];
  trends: TrendData[];
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function RecipeTrendsChart() {
  const [data, setData] = useState<RecipeTrendsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const response = await fetch("/api/insights/recipe-trends");
        if (response.ok) {
          const trendsData = await response.json();
          setData(trendsData);
        }
      } catch (error) {
        console.error("Error fetching recipe trends:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrends();
  }, []);

  if (isLoading) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <p className="text-center text-gray-500">Loading recipe trends...</p>
      </div>
    );
  }

  if (!data || data.trends.length === 0) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-gray-800">
          Recipe Popularity Over Time
        </h2>
        <p className="text-center text-gray-500">
          Not enough data yet. Add more meals to your calendar to see trends!
        </p>
      </div>
    );
  }

  // Format week labels for display
  const formattedTrends = data.trends.map((trend) => ({
    ...trend,
    weekLabel: new Date(trend.week).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold text-gray-800">
        Recipe Popularity Over Time
      </h2>
      <p className="mb-6 text-sm text-gray-600">
        Weekly trends for your top 5 most popular recipes over the past 6 months
      </p>

      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={formattedTrends}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="weekLabel"
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
              label={{
                value: "Meals per Week",
                angle: -90,
                position: "insideLeft",
                style: { fontSize: 12, fill: "#6b7280" },
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
                fontSize: 12,
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12 }}
              iconType="line"
            />
            {data.topRecipes.map((recipe, index) => (
              <Line
                key={recipe.id}
                type="monotone"
                dataKey={recipe.name}
                stroke={COLORS[index]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top recipes summary */}
      <div className="mt-6 border-t pt-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">
          Top 5 Recipes (All Time)
        </h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {data.topRecipes.map((recipe, index) => (
            <div
              key={recipe.id}
              className="flex items-center gap-2 rounded-md border border-gray-200 p-2"
            >
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: COLORS[index] }}
              />
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-gray-900">
                  {recipe.name}
                </p>
                <p className="text-xs text-gray-500">
                  {recipe.totalCount} {recipe.totalCount === 1 ? "time" : "times"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

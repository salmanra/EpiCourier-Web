import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

async function getPublicUserId(supabase: SupabaseClient<Database>): Promise<number> {
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    throw new Error("User not authenticated");
  }

  if (!authUser.email) {
    throw new Error("Authenticated user does not have an email.");
  }

  const { data: publicUsers, error: profileError } = await supabase
    .from("User")
    .select("id")
    .eq("email", authUser.email)
    .limit(1);

  if (profileError) {
    console.error("Error fetching public user profile:", profileError.message);
    throw new Error("Error fetching user profile.");
  }

  if (!publicUsers || publicUsers.length === 0) {
    throw new Error("Public user profile not found.");
  }

  const publicUser = publicUsers[0];
  return publicUser.id;
}

/**
 * GET /api/insights/recipe-trends
 * Returns time-series data for top recipes over the past 6 months
 */
export async function GET() {
  const supabase = await createClient();
  let publicUserId: number;

  try {
    publicUserId = await getPublicUserId(supabase);
  } catch (err: unknown) {
    let errorMessage = "Unauthorized";
    if (err instanceof Error) {
      errorMessage = err.message;
    }
    console.warn("GET /api/insights/recipe-trends auth error:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 401 });
  }

  // Get date from 6 months ago
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const sixMonthsAgoStr = sixMonthsAgo.toISOString().split("T")[0];

  // Fetch all calendar entries for the user in the past 6 months with recipe info
  const { data, error } = await supabase
    .from("Calendar")
    .select(
      `
      date,
      recipe_id,
      Recipe: recipe_id(
        id,
        name
      )
    `
    )
    .eq("user_id", publicUserId)
    .gte("date", sixMonthsAgoStr)
    .order("date", { ascending: true });

  if (error) {
    console.error("Error fetching recipe trends:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ topRecipes: [], trends: [] });
  }

  // First, find the top 5 most frequently used recipes
  const recipeCounts = new Map<number, { name: string; count: number }>();

  data.forEach((entry) => {
    if (entry.recipe_id && entry.Recipe) {
      const existing = recipeCounts.get(entry.recipe_id);
      if (existing) {
        existing.count += 1;
      } else {
        recipeCounts.set(entry.recipe_id, {
          name: entry.Recipe.name,
          count: 1,
        });
      }
    }
  });

  // Get top 5 recipes
  const topRecipes = Array.from(recipeCounts.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([id, info]) => ({
      id,
      name: info.name,
      totalCount: info.count,
    }));

  const topRecipeIds = new Set(topRecipes.map((r) => r.id));

  // Group by week for time series data
  const weeklyData = new Map<
    string,
    Map<number, number>
  >();

  data.forEach((entry) => {
    if (entry.recipe_id && topRecipeIds.has(entry.recipe_id)) {
      // Get week start date (Monday)
      const date = new Date(entry.date);
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      const weekStart = new Date(date.setDate(diff));
      const weekKey = weekStart.toISOString().split("T")[0];

      if (!weeklyData.has(weekKey)) {
        weeklyData.set(weekKey, new Map());
      }

      const weekMap = weeklyData.get(weekKey)!;
      const currentCount = weekMap.get(entry.recipe_id) || 0;
      weekMap.set(entry.recipe_id, currentCount + 1);
    }
  });

  // Convert to array format for charting
  const trends = Array.from(weeklyData.entries())
    .map(([week, recipeCounts]) => {
      const dataPoint: any = { week };
      topRecipes.forEach((recipe) => {
        dataPoint[recipe.name] = recipeCounts.get(recipe.id) || 0;
      });
      return dataPoint;
    })
    .sort((a, b) => a.week.localeCompare(b.week));

  return NextResponse.json({ topRecipes, trends });
}

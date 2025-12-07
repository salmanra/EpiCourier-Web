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
 * GET /api/insights/recipe-counts
 * Returns recipes with count of how many times user added them to calendar
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
    console.warn("GET /api/insights/recipe-counts auth error:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 401 });
  }

  // Fetch all calendar entries for the user with recipe details
  const { data, error } = await supabase
    .from("Calendar")
    .select(
      `
      recipe_id,
      Recipe: recipe_id(
        id,
        name,
        image_url,
        green_score
      )
    `
    )
    .eq("user_id", publicUserId);

  if (error) {
    console.error("Error fetching recipe counts:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json([]);
  }

  // Count recipes manually
  const recipeCounts = new Map<
    number,
    { recipe: any; count: number }
  >();

  data.forEach((entry) => {
    if (entry.recipe_id && entry.Recipe) {
      const existing = recipeCounts.get(entry.recipe_id);
      if (existing) {
        existing.count += 1;
      } else {
        recipeCounts.set(entry.recipe_id, {
          recipe: entry.Recipe,
          count: 1,
        });
      }
    }
  });

  // Convert to array and sort by count (descending)
  const result = Array.from(recipeCounts.values()).sort(
    (a, b) => b.count - a.count
  );

  return NextResponse.json(result);
}

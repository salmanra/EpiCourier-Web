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
 * GET /api/insights/activity
 * Returns daily meal completion counts for the past year (GitHub-style heatmap data)
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
    console.warn("GET /api/insights/activity auth error:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 401 });
  }

  // Get date from 1 year ago
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const oneYearAgoStr = oneYearAgo.toISOString().split("T")[0];

  // Fetch all calendar entries for the user in the past year
  const { data, error } = await supabase
    .from("Calendar")
    .select("date, status")
    .eq("user_id", publicUserId)
    .gte("date", oneYearAgoStr)
    .order("date", { ascending: true });

  if (error) {
    console.error("Error fetching activity data:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json([]);
  }

  // Count meals by date
  const activityMap = new Map<string, { total: number; completed: number }>();

  data.forEach((entry) => {
    const existing = activityMap.get(entry.date);
    if (existing) {
      existing.total += 1;
      if (entry.status) {
        existing.completed += 1;
      }
    } else {
      activityMap.set(entry.date, {
        total: 1,
        completed: entry.status ? 1 : 0,
      });
    }
  });

  // Convert to array format
  const result = Array.from(activityMap.entries()).map(([date, counts]) => ({
    date,
    total: counts.total,
    completed: counts.completed,
  }));

  return NextResponse.json(result);
}

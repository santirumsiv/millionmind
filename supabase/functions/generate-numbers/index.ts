// Million Mind — generate-numbers Edge Function
//
// Auth: requires JWT (set in supabase/config.toml).
// Body: { algorithm: AlgorithmId }
// Behavior:
//   1. Resolve user → profile.tier
//   2. Reject if tier doesn't include the algorithm  → 403
//   3. Atomically increment usage_limits; reject if over weekly cap → 429
//   4. Run algorithm with inputs from cache / drawings
//   5. Persist to generated_combinations
//   6. Return combination + remaining_this_week + disclaimer

import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders, corsResponse } from "../_shared/cors.ts";
import {
  type AlgorithmId,
  type TierId,
  TIER_ALGORITHMS,
  TIER_WEEKLY_CAP,
  minimumTierFor,
  tierIncludesAlgorithm,
} from "../_shared/tiers.ts";
import { DISCLAIMER_FULL } from "../_shared/disclaimer.ts";
import {
  type NumberStat,
  type DrawingRow,
  generate,
  needsDrawings,
  needsStats,
} from "../_shared/algorithms.ts";

const VALID_ALGORITHMS = new Set<AlgorithmId>([
  "random",
  "hot",
  "cold",
  "gap",
  "pattern",
  "markov",
  "monte_carlo",
]);

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isoWeekStart(d: Date = new Date()): string {
  // Monday-anchored week start, UTC. Format YYYY-MM-DD.
  const day = d.getUTCDay() || 7;
  const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day + 1));
  return monday.toISOString().slice(0, 10);
}

function nextMondayIso(): string {
  const now = new Date();
  const day = now.getUTCDay() || 7;
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + (8 - day)));
  return next.toISOString();
}

async function fetchStats(client: SupabaseClient): Promise<NumberStat[]> {
  const { data, error } = await client
    .from("number_stats")
    .select("number, ball_type, frequency, last_drawn, gap_days");
  if (error) throw error;
  return (data ?? []) as NumberStat[];
}

async function fetchRecentDrawings(client: SupabaseClient, limit = 200): Promise<DrawingRow[]> {
  const { data, error } = await client
    .from("drawings")
    .select("draw_date, n1, n2, n3, n4, n5, powerball")
    .order("draw_date", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as DrawingRow[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return corsResponse();
  if (req.method !== "POST") {
    return jsonResponse({ code: "INVALID_INPUT", message: "POST required" }, 405);
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader = req.headers.get("Authorization") ?? "";

  // User-scoped client (validates JWT).
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) {
    return jsonResponse({ code: "UNAUTHORIZED", message: "Invalid or missing token" }, 401);
  }
  const userId = userData.user.id;

  // Parse body
  let body: { algorithm?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ code: "INVALID_INPUT", message: "Body must be JSON" }, 400);
  }
  const algorithm = body.algorithm as AlgorithmId | undefined;
  if (!algorithm || !VALID_ALGORITHMS.has(algorithm)) {
    return jsonResponse({ code: "INVALID_INPUT", message: "Unknown algorithm", field: "algorithm" }, 400);
  }

  // Service-role client for trusted reads/writes.
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Tier lookup
  const { data: profile, error: profileErr } = await adminClient
    .from("profiles")
    .select("tier")
    .eq("id", userId)
    .single();
  if (profileErr || !profile) {
    return jsonResponse({ code: "INTERNAL", message: "Profile not found" }, 500);
  }
  const tier = profile.tier as TierId;

  // Tier gate
  if (!tierIncludesAlgorithm(tier, algorithm)) {
    return jsonResponse(
      {
        code: "TIER_LOCKED",
        message: `Algorithm '${algorithm}' requires '${minimumTierFor(algorithm)}' tier or higher.`,
        required_tier: minimumTierFor(algorithm),
      },
      403,
    );
  }

  // Weekly cap (atomic via SQL function)
  const cap = TIER_WEEKLY_CAP[tier];
  const weekStart = isoWeekStart();
  const { data: capRow, error: capErr } = await adminClient.rpc("increment_usage_if_allowed", {
    p_user_id: userId,
    p_week_start: weekStart,
    p_cap: cap,
  });
  if (capErr) {
    return jsonResponse({ code: "INTERNAL", message: capErr.message }, 500);
  }
  if (capRow === null) {
    return jsonResponse(
      { code: "RATE_LIMITED", message: "Weekly generation cap reached", resets_at: nextMondayIso() },
      429,
    );
  }
  const newCount = capRow as number;
  const remaining = cap === null ? "unlimited" : Math.max(0, cap - newCount);

  // Fetch inputs
  const [stats, drawings] = await Promise.all([
    needsStats(algorithm) ? fetchStats(adminClient) : Promise.resolve([] as NumberStat[]),
    needsDrawings(algorithm) ? fetchRecentDrawings(adminClient) : Promise.resolve([] as DrawingRow[]),
  ]);

  // Generate
  const combo = generate(algorithm, { stats, drawings });

  // Persist
  const { error: insertErr } = await adminClient.from("generated_combinations").insert({
    user_id: userId,
    white_balls: combo.white_balls,
    powerball: combo.powerball,
    algorithm_used: algorithm,
  });
  if (insertErr) {
    // Don't fail the whole request — generation already ran. Log + return.
    console.error("Failed to persist combination:", insertErr);
  }

  return jsonResponse({
    white_balls: combo.white_balls,
    powerball: combo.powerball,
    algorithm,
    generated_at: new Date().toISOString(),
    remaining_this_week: remaining,
    disclaimer: DISCLAIMER_FULL,
  });
});

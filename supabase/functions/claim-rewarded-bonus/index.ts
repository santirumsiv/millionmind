// Million Mind — Rewarded-ad bonus claim
//
// Free users can watch up to 5 rewarded video ads per ISO week to
// unlock +1 generation each. The ad SDK fires a reward callback
// client-side; the client then calls THIS endpoint to record the
// bonus server-side. No reward is granted unless this returns 200.
//
// Auth: requires JWT (verified). The client sends no body.
//
// Returns:
//   200 { bonus_count: 1..5, remaining_bonus_uses: 4..0 }   on success
//   429 { code: "BONUS_CAP_REACHED" }                       at cap
//   403 { code: "PRO_USERS_DONT_NEED_THIS" }                if tier=pro

import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders, corsResponse } from "../_shared/cors.ts";

const FREE_REWARDED_CAP = 5;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isoWeekStart(d: Date = new Date()): string {
  const day = d.getUTCDay() || 7;
  const monday = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day + 1),
  );
  return monday.toISOString().slice(0, 10);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return corsResponse();
  if (req.method !== "POST") return jsonResponse({ error: "POST required" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader = req.headers.get("Authorization") ?? "";

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) {
    return jsonResponse({ code: "UNAUTHORIZED", message: "Invalid token" }, 401);
  }
  const userId = userData.user.id;

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Pro users don't need to watch ads — short-circuit.
  const { data: profile } = await adminClient
    .from("profiles")
    .select("tier")
    .eq("id", userId)
    .single();
  if (profile?.tier === "pro") {
    return jsonResponse(
      { code: "PRO_USERS_DONT_NEED_THIS", message: "Pro tier already has unlimited generations." },
      403,
    );
  }

  const weekStart = isoWeekStart();
  const { data: row, error: rpcErr } = await adminClient.rpc("claim_rewarded_bonus", {
    p_user_id: userId,
    p_week_start: weekStart,
    p_cap: FREE_REWARDED_CAP,
  });

  if (rpcErr) return jsonResponse({ code: "INTERNAL", message: rpcErr.message }, 500);
  if (row === null) {
    return jsonResponse(
      {
        code: "BONUS_CAP_REACHED",
        message: `You've already redeemed ${FREE_REWARDED_CAP} ad bonuses this week. Resets Monday.`,
      },
      429,
    );
  }

  const bonusCount = row as number;
  return jsonResponse({
    bonus_count: bonusCount,
    remaining_bonus_uses: Math.max(0, FREE_REWARDED_CAP - bonusCount),
  });
});

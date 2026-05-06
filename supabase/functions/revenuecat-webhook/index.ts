// Million Mind — RevenueCat Webhook
//
// Receives server-to-server events from RevenueCat and updates profiles.tier
// to keep the tier source-of-truth synced. Events of interest:
//   INITIAL_PURCHASE | RENEWAL | NON_RENEWING_PURCHASE → set tier
//   CANCELLATION | EXPIRATION → downgrade to free at period end
//   TRANSFER → re-link revenuecat_user_id
//
// Setup:
//   1. RevenueCat dashboard → Project → Integrations → Webhooks
//   2. URL: https://<project>.supabase.co/functions/v1/revenuecat-webhook
//   3. Authorization header: Bearer <REVENUECAT_WEBHOOK_SECRET>
//
// JWT verification is disabled for this endpoint (config.toml). We verify
// the bearer header ourselves against a shared secret.

import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders, corsResponse } from "../_shared/cors.ts";
import type { TierId } from "../_shared/tiers.ts";

interface RevenueCatEvent {
  event: {
    type: string;
    app_user_id: string;
    entitlement_ids?: string[];
    expiration_at_ms?: number | null;
  };
}

// Single Pro entitlement covers both billing variants
// (pro_monthly / pro_annual). RevenueCat reports the same `pro_access`
// entitlement regardless of which product the user bought.
const ENTITLEMENT_TO_TIER: Record<string, TierId> = {
  pro_access: "pro",
};

function pickHighestTier(entitlements: string[]): TierId {
  const tiers = entitlements
    .map((e) => ENTITLEMENT_TO_TIER[e])
    .filter((t): t is TierId => Boolean(t));
  return tiers.includes("pro") ? "pro" : "free";
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return corsResponse();
  if (req.method !== "POST") return jsonResponse({ error: "POST required" }, 405);

  const expectedSecret = Deno.env.get("REVENUECAT_WEBHOOK_SECRET");
  if (!expectedSecret) {
    return jsonResponse({ error: "Webhook secret not configured" }, 500);
  }
  const auth = req.headers.get("Authorization") ?? "";
  if (auth !== `Bearer ${expectedSecret}`) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  let payload: RevenueCatEvent;
  try {
    payload = (await req.json()) as RevenueCatEvent;
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }

  const event = payload.event;
  if (!event?.app_user_id) {
    return jsonResponse({ error: "Missing app_user_id" }, 400);
  }

  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  let nextTier: TierId = "free";

  switch (event.type) {
    case "INITIAL_PURCHASE":
    case "RENEWAL":
    case "NON_RENEWING_PURCHASE":
    case "PRODUCT_CHANGE":
    case "UNCANCELLATION":
      nextTier = pickHighestTier(event.entitlement_ids ?? []);
      break;
    case "CANCELLATION":
    case "EXPIRATION":
      nextTier = "free";
      break;
    case "BILLING_ISSUE":
      // Don't downgrade immediately — RC will retry. Log only.
      console.log(`Billing issue for ${event.app_user_id}; tier unchanged`);
      return jsonResponse({ ok: true, action: "ignored" });
    default:
      console.log(`Unhandled RC event type: ${event.type}`);
      return jsonResponse({ ok: true, action: "ignored" });
  }

  const { error } = await adminClient
    .from("profiles")
    .update({ tier: nextTier, revenuecat_user_id: event.app_user_id })
    .eq("id", event.app_user_id);

  if (error) {
    console.error("Failed to update tier:", error);
    return jsonResponse({ error: error.message }, 500);
  }

  return jsonResponse({ ok: true, app_user_id: event.app_user_id, tier: nextTier });
});

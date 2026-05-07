// Million Mind — check-geo Edge Function
//
// Checks the requesting client's geolocation against the geo-blocked
// US states list. Used at signup by both the web app and the mobile
// app to enforce state-level restrictions (Utah, Hawaii, etc.) — see
// section 9.4 of LAUNCH_PLAN.md for the legal rationale.
//
// JWT verification is disabled because this runs BEFORE signup. The
// caller is by definition unauthenticated. There is no sensitive
// data returned — just whether the requester's region is blocked.
//
// Implementation reads Cloudflare's geolocation headers, which Supabase
// Edge Functions receive automatically from the Deno Deploy runtime
// fronted by Cloudflare. Headers used:
//   cf-ipcountry        — ISO 3166-1 alpha-2 (e.g. "US")
//   cf-region-code      — ISO 3166-2 subdivision code (e.g. "UT")
//   x-vercel-ip-country / x-vercel-ip-country-region — fallback
//
// Fail-open semantics: if we can't determine country/region, we return
// blocked=false so infrastructure problems don't block legitimate
// signups. Documented good-faith effort is the legal posture, not
// absolute enforcement.

import { corsHeaders, corsResponse } from "../_shared/cors.ts";

// Mirror of GEO_BLOCKED_US_STATES in packages/shared/src/constants.ts.
// Keep in sync — the shared package isn't reachable from Deno.
const BLOCKED_US_STATES = ["UT", "HI"];

const STATE_NAMES: Record<string, string> = {
  UT: "Utah",
  HI: "Hawaii",
  AL: "Alabama",
  AK: "Alaska",
  MS: "Mississippi",
  NV: "Nevada",
};

interface GeoResponse {
  blocked: boolean;
  country: string | null;
  state: string | null;
  message: string | null;
}

Deno.serve((req: Request) => {
  if (req.method === "OPTIONS") return corsResponse();

  const country =
    req.headers.get("cf-ipcountry") ??
    req.headers.get("x-vercel-ip-country") ??
    null;
  const state =
    req.headers.get("cf-region-code") ??
    req.headers.get("x-vercel-ip-country-region") ??
    null;

  const normCountry = country ? country.toUpperCase() : null;
  const normState = state ? state.toUpperCase() : null;

  const isBlockedUSState =
    normCountry === "US" &&
    normState !== null &&
    BLOCKED_US_STATES.includes(normState);

  const body: GeoResponse = {
    blocked: isBlockedUSState,
    country: normCountry,
    state: normState,
    message: isBlockedUSState
      ? `Million Mind is not currently available to residents of ${STATE_NAMES[normState!] ?? normState}. We're working through state-level licensing — check back later.`
      : null,
  };

  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

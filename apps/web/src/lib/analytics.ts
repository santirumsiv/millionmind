"use client";

import posthog from "posthog-js";

/**
 * Analytics events. With the web-only ads-only pivot, the surface is
 * narrower than before — no auth-tied events, no subscription events.
 */
export type AnalyticsEvent =
  | { name: "first_generation"; algorithm: string; game: string }
  | {
      name: "generation_requested";
      algorithm: string;
      game: string;
      premium: boolean;
    }
  | { name: "quota_exhausted" }
  | { name: "premium_required"; algorithm: string }
  | { name: "ad_view_started" }
  | { name: "ad_view_completed" }
  | { name: "ad_view_skipped" }
  | { name: "grant_cap_reached" }
  | { name: "legal_gate_shown" }
  | { name: "legal_gate_accepted" };

let initialized = false;

export function initAnalytics(): void {
  if (initialized || typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";
  posthog.init(key, {
    api_host: host,
    person_profiles: "identified_only",
    capture_pageview: true,
    capture_pageleave: true,
    persistence: "localStorage+cookie",
  });
  initialized = true;
}

export function track(event: AnalyticsEvent): void {
  if (!initialized) return;
  const { name, ...props } = event;
  posthog.capture(name, props);
}

const FIRST_GEN_KEY = "mm:first_generation_seen";

export function trackFirstGenerationOnce(algorithm: string, game: string): void {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(FIRST_GEN_KEY)) return;
  track({ name: "first_generation", algorithm, game });
  window.localStorage.setItem(FIRST_GEN_KEY, "1");
}

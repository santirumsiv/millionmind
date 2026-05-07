"use client";

import posthog from "posthog-js";

/**
 * Strongly-typed event surface — keep in sync with the mobile wrapper at
 * apps/mobile/src/lib/analytics.ts. The 8 priority events from the launch
 * plan are listed here; add new ones as a discriminated union member.
 */
export type AnalyticsEvent =
  | { name: "signup_completed"; provider?: "email" | "apple" | "google" }
  | { name: "first_generation"; algorithm: string; game: string }
  | {
      name: "generation_requested";
      algorithm: string;
      game: string;
      set_count: number;
      tier: string;
    }
  | {
      name: "tier_locked_hit";
      feature: string;
      attempted_algorithm?: string;
    }
  | {
      name: "upgrade_cta_clicked";
      source:
        | "demo"
        | "analytics"
        | "history"
        | "home"
        | "account"
        | "generate";
    }
  | { name: "subscription_started"; variant: "monthly" | "annual" }
  | { name: "rewarded_ad_completed" }
  | { name: "notifications_enabled_toggled"; enabled: boolean };

export type IdentifyProps = {
  tier?: string;
  pro_billing_variant?: string;
  signup_date?: string;
  auth_provider?: string;
  notifications_enabled?: boolean;
};

let initialized = false;

export function initAnalytics(): void {
  if (initialized || typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return; // graceful no-op when not configured
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

export function identify(userId: string, props: IdentifyProps = {}): void {
  if (!initialized) return;
  posthog.identify(userId, props);
}

export function resetAnalytics(): void {
  if (!initialized) return;
  posthog.reset();
}

const FIRST_GEN_FLAG = "mm:first_generation_seen";

/**
 * Fire `first_generation` exactly once per device per user. Persists in
 * localStorage; safe across refreshes. Same idea on mobile via AsyncStorage.
 */
export function trackFirstGenerationOnce(
  userId: string,
  algorithm: string,
  game: string,
): void {
  if (typeof window === "undefined") return;
  const key = `${FIRST_GEN_FLAG}:${userId}`;
  if (window.localStorage.getItem(key)) return;
  track({ name: "first_generation", algorithm, game });
  window.localStorage.setItem(key, "1");
}

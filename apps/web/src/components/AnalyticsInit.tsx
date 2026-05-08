"use client";

import { useEffect } from "react";
import { initAnalytics } from "@/lib/analytics";

/**
 * Tiny client component that initializes analytics on mount. Replaces
 * the old AnalyticsProvider (which also wired the Supabase auth listener
 * — no longer relevant). PostHog auto-generates an anonymous device id.
 */
export function AnalyticsInit() {
  useEffect(() => {
    initAnalytics();
  }, []);
  return null;
}

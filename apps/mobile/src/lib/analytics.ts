import PostHog from "posthog-react-native";
import * as Sentry from "@sentry/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Strongly-typed event surface — keep in sync with the web wrapper at
 * apps/web/src/lib/analytics.ts. The 8 priority events from the launch
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

let posthog: PostHog | null = null;

export function initAnalytics(): void {
  if (posthog) return;

  // Sentry
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (dsn) {
    Sentry.init({
      dsn,
      tracesSampleRate: 0.2,
      enableAutoSessionTracking: true,
    });
  }

  // PostHog
  const key = process.env.EXPO_PUBLIC_POSTHOG_KEY;
  if (!key) return; // graceful no-op when not configured
  const host =
    process.env.EXPO_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";
  posthog = new PostHog(key, {
    host,
    captureAppLifecycleEvents: true,
    flushAt: 20,
    flushInterval: 30_000,
  });
}

export function track(event: AnalyticsEvent): void {
  if (!posthog) return;
  const { name, ...props } = event;
  posthog.capture(name, props);
}

export function identify(userId: string, props: IdentifyProps = {}): void {
  if (!posthog) return;
  posthog.identify(userId, props);
}

export function resetAnalytics(): void {
  if (!posthog) return;
  posthog.reset();
}

const FIRST_GEN_PREFIX = "mm:first_generation_seen:";
const SIGNUP_PREFIX = "mm:signup_completed_seen:";

/** Fire `first_generation` exactly once per user per device. */
export async function trackFirstGenerationOnce(
  userId: string,
  algorithm: string,
  game: string,
): Promise<void> {
  const key = `${FIRST_GEN_PREFIX}${userId}`;
  const seen = await AsyncStorage.getItem(key);
  if (seen) return;
  track({ name: "first_generation", algorithm, game });
  await AsyncStorage.setItem(key, "1");
}

/** Fire `signup_completed` exactly once per user per device on first sign-in. */
export async function trackSignupCompletedOnce(
  userId: string,
  provider: "email" | "apple" | "google" = "email",
): Promise<void> {
  const key = `${SIGNUP_PREFIX}${userId}`;
  const seen = await AsyncStorage.getItem(key);
  if (seen) return;
  track({ name: "signup_completed", provider });
  await AsyncStorage.setItem(key, "1");
}

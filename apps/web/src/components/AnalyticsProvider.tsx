"use client";

import { useEffect } from "react";
import { initAnalytics, identify, resetAnalytics, track } from "@/lib/analytics";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const SIGNUP_FLAG = "mm:signup_completed_seen";

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initAnalytics();
    const supabase = createSupabaseBrowserClient();

    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) await identifyFromUser(user.id);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        void identifyFromUser(session.user.id, /* fromSignIn */ true);
      } else if (event === "SIGNED_OUT") {
        resetAnalytics();
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  return <>{children}</>;
}

async function identifyFromUser(
  userId: string,
  fromSignIn = false,
): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { data } = await supabase
    .from("profiles")
    .select("tier, pro_billing_variant, created_at, notifications_enabled")
    .eq("id", userId)
    .maybeSingle();
  identify(userId, {
    tier: data?.tier ?? "free",
    pro_billing_variant: data?.pro_billing_variant ?? undefined,
    signup_date: data?.created_at ?? undefined,
    notifications_enabled: data?.notifications_enabled ?? undefined,
  });

  // Fire signup_completed exactly once per user per device. The first
  // SIGNED_IN we see is treated as the signup completion, which works
  // uniformly across email confirmation and (future) OAuth flows.
  if (fromSignIn && typeof window !== "undefined") {
    const key = `${SIGNUP_FLAG}:${userId}`;
    if (!window.localStorage.getItem(key)) {
      track({ name: "signup_completed", provider: "email" });
      window.localStorage.setItem(key, "1");
    }
  }
}

"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { GEO_BLOCKED_US_STATES } from "@millionmind/shared";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Server-side geo-block enforcement for sign-up. Reads the Vercel /
 * Cloudflare geolocation headers attached to the incoming request.
 * Fail-open: if the headers aren't present (local dev, weird proxy)
 * we don't block, since "documented good-faith effort" is the goal.
 */
async function isRegionBlocked(): Promise<{ blocked: boolean; state: string | null }> {
  const h = await headers();
  const country = (
    h.get("x-vercel-ip-country") ??
    h.get("cf-ipcountry") ??
    ""
  ).toUpperCase();
  const state = (
    h.get("x-vercel-ip-country-region") ??
    h.get("cf-region-code") ??
    ""
  ).toUpperCase();
  if (country !== "US" || !state) return { blocked: false, state: null };
  const blocked = (GEO_BLOCKED_US_STATES as readonly string[]).includes(state);
  return { blocked, state };
}

export async function signInWithEmail(formData: FormData): Promise<{ error?: string }> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: error.message };
  }
  redirect("/home");
}

export async function signUpWithEmail(formData: FormData): Promise<{ error?: string; info?: string }> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const geo = await isRegionBlocked();
  if (geo.blocked) {
    return {
      error: `Million Mind is not currently available to residents of your state (${geo.state}). We're working through state-level licensing — check back later.`,
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo:
        process.env.NEXT_PUBLIC_SITE_URL
          ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
          : undefined,
    },
  });
  if (error) {
    return { error: error.message };
  }
  return { info: "Check your email for a confirmation link." };
}

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function resetPassword(formData: FormData): Promise<{ error?: string; info?: string }> {
  const email = String(formData.get("email") ?? "");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: process.env.NEXT_PUBLIC_SITE_URL
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset`
      : undefined,
  });
  if (error) return { error: error.message };
  return { info: "Reset link sent. Check your email." };
}

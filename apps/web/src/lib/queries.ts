"use client";

import { useQuery } from "@tanstack/react-query";
import { createSupabaseBrowserClient } from "./supabase/client";
import type {
  Drawing,
  GeneratedCombination,
  NumberStats,
  Profile,
  TierId,
} from "@millionmind/shared";

export function useProfile() {
  const supabase = createSupabaseBrowserClient();
  return useQuery({
    queryKey: ["profile"],
    queryFn: async (): Promise<Profile | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data as Profile;
    },
  });
}

export function useUsageThisWeek() {
  const supabase = createSupabaseBrowserClient();
  return useQuery({
    queryKey: ["usage"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { count: 0 };
      const weekStart = isoMondayUtc();
      const { data } = await supabase
        .from("usage_limits")
        .select("generations_count")
        .eq("user_id", user.id)
        .eq("week_start", weekStart)
        .maybeSingle();
      return { count: data?.generations_count ?? 0 };
    },
  });
}

export function useRecentDrawings(limit = 30) {
  const supabase = createSupabaseBrowserClient();
  return useQuery({
    queryKey: ["drawings", "recent", limit],
    queryFn: async (): Promise<Drawing[]> => {
      const { data, error } = await supabase
        .from("drawings")
        .select("*")
        .order("draw_date", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as Drawing[];
    },
    staleTime: 5 * 60_000,
  });
}

export function useNumberStats() {
  const supabase = createSupabaseBrowserClient();
  return useQuery({
    queryKey: ["numberStats"],
    queryFn: async (): Promise<NumberStats[]> => {
      const { data, error } = await supabase.from("number_stats").select("*");
      if (error) throw error;
      return (data ?? []) as NumberStats[];
    },
    staleTime: 60_000,
  });
}

export function useMyCombinations(limit = 30) {
  const supabase = createSupabaseBrowserClient();
  return useQuery({
    queryKey: ["myCombinations", limit],
    queryFn: async (): Promise<GeneratedCombination[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("generated_combinations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as GeneratedCombination[];
    },
  });
}

function isoMondayUtc(): string {
  const d = new Date();
  const day = d.getUTCDay() || 7;
  const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day + 1));
  return monday.toISOString().slice(0, 10);
}

export function tierLabel(tier: TierId): string {
  return { free: "Explorer", starter: "Analyst", pro: "Strategist", elite: "Data Scientist" }[tier];
}

import type { AlgorithmId } from "./algorithms";
import type { TierId } from "./tiers";

export interface Drawing {
  id: number;
  draw_date: string;
  n1: number;
  n2: number;
  n3: number;
  n4: number;
  n5: number;
  powerball: number;
  multiplier: number;
  created_at: string;
}

export interface NumberStats {
  number: number;
  ball_type: "white" | "powerball";
  frequency: number;
  last_drawn: string | null;
  gap_days: number | null;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string | null;
  tier: TierId;
  revenuecat_user_id: string | null;
  created_at: string;
}

export interface GeneratedCombination {
  id: string;
  user_id: string;
  white_balls: [number, number, number, number, number];
  powerball: number;
  algorithm_used: AlgorithmId;
  created_at: string;
}

export interface UsageLimit {
  user_id: string;
  week_start: string;
  generations_count: number;
}

export interface GenerationResult {
  white_balls: [number, number, number, number, number];
  powerball: number;
  algorithm: AlgorithmId;
  generated_at: string;
  remaining_this_week: number | "unlimited";
  disclaimer: string;
}

export interface GenerationRequest {
  algorithm: AlgorithmId;
}

export type ApiError =
  | { code: "TIER_LOCKED"; message: string; required_tier: TierId }
  | { code: "RATE_LIMITED"; message: string; resets_at: string }
  | { code: "UNAUTHORIZED"; message: string }
  | { code: "INVALID_INPUT"; message: string; field?: string }
  | { code: "INTERNAL"; message: string };

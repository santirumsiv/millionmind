"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  AlgorithmId,
  GameId,
  Combination,
  DrawingRow,
  NumberStat,
} from "@millionmind/shared";

export interface QuotaState {
  free_remaining: number;
  free_reset_in: number;
  premium_uses: number;
  grants_used_this_hour: number;
  grants_remaining_this_hour: number;
}

export interface GenerateResult extends Combination {
  algorithm: AlgorithmId;
  game: GameId;
  generated_at: string;
  quota: QuotaState;
  disclaimer: string;
}

export interface ApiError {
  code: string;
  message: string;
  quota?: QuotaState;
}

export class ApiCallError extends Error {
  constructor(public detail: ApiError, public status: number) {
    super(detail.message);
    this.name = "ApiCallError";
  }
}

async function asJson<T>(res: Response): Promise<T> {
  const body = await res.json();
  if (!res.ok) throw new ApiCallError(body as ApiError, res.status);
  return body as T;
}

// ─── Quota ─────────────────────────────────────────────────────────

export function useQuota() {
  return useQuery<QuotaState>({
    queryKey: ["quota"],
    queryFn: async () => asJson<QuotaState>(await fetch("/api/quota")),
    refetchInterval: 30_000,
    staleTime: 10_000,
  });
}

// ─── Generate ──────────────────────────────────────────────────────

export function useGenerate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { algorithm: AlgorithmId; game: GameId }) =>
      asJson<GenerateResult>(
        await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(vars),
        }),
      ),
    onSuccess: (res) => {
      qc.setQueryData(["quota"], res.quota);
    },
  });
}

// ─── Ad-grant ──────────────────────────────────────────────────────

export function useAdGrant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () =>
      asJson<{ granted: number; quota: QuotaState }>(
        await fetch("/api/ad-grant", { method: "POST" }),
      ),
    onSuccess: (res) => {
      qc.setQueryData(["quota"], res.quota);
    },
  });
}

// ─── Stats ─────────────────────────────────────────────────────────

export interface StatsResponse {
  game: GameId;
  total_drawings: number;
  stats: NumberStat[];
  top_pairs: Array<{ a: number; b: number; count: number }>;
}

export function useStats(game: GameId) {
  return useQuery<StatsResponse>({
    queryKey: ["stats", game],
    queryFn: async () => asJson<StatsResponse>(await fetch(`/api/stats?game=${game}`)),
    staleTime: 5 * 60_000,
  });
}

// ─── Drawings ──────────────────────────────────────────────────────

export interface DrawingsResponse {
  game: GameId;
  total_drawings: number;
  rows: DrawingRow[];
}

export function useDrawings(game: GameId, limit = 30) {
  return useQuery<DrawingsResponse>({
    queryKey: ["drawings", game, limit],
    queryFn: async () =>
      asJson<DrawingsResponse>(await fetch(`/api/drawings?game=${game}&limit=${limit}`)),
    staleTime: 5 * 60_000,
  });
}

// ─── Per-device generation history (localStorage only) ─────────────

const HISTORY_KEY = "mm:generation_history";
const HISTORY_MAX = 50;

export interface LocalGenerationEntry extends Combination {
  algorithm: AlgorithmId;
  game: GameId;
  generated_at: string;
}

export function readLocalHistory(): LocalGenerationEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as LocalGenerationEntry[]) : [];
  } catch {
    return [];
  }
}

export function appendLocalHistory(entry: LocalGenerationEntry): void {
  if (typeof window === "undefined") return;
  const current = readLocalHistory();
  const next = [entry, ...current].slice(0, HISTORY_MAX);
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

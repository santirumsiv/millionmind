"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CaGameId,
  CaStatsResponse,
  CaGenerateResponse,
  CaDrawingsResponse,
} from "@millionmind/shared";
import { ApiCallError, type QuotaState } from "@/lib/queries";

async function asJson<T>(res: Response): Promise<T> {
  const body = await res.json();
  if (!res.ok) throw new ApiCallError(body, res.status);
  return body as T;
}

export function useCaStats(game: CaGameId) {
  return useQuery<CaStatsResponse>({
    queryKey: ["ca-stats", game],
    queryFn: async () => asJson<CaStatsResponse>(await fetch(`/api/ca/${game}/stats`)),
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function useCaDrawings(game: CaGameId, limit: number) {
  return useQuery<CaDrawingsResponse>({
    queryKey: ["ca-drawings", game, limit],
    queryFn: async () =>
      asJson<CaDrawingsResponse>(await fetch(`/api/ca/${game}/drawings?limit=${limit}`)),
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export interface CaGenerateResult extends CaGenerateResponse {
  quota: QuotaState;
}

export function useCaGenerate(game: CaGameId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { mode: string; count: number }) =>
      asJson<CaGenerateResult>(
        await fetch(`/api/ca/${game}/generate`, {
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

/**
 * CA backend adapter — server-only. **LEGACY / not wired by default.**
 *
 * Analytics, Generate, and History now compute from the in-codebase draw
 * history (apps/web/data/ca-*.json) via lib/ca-runner.ts + the shared CA engine
 * — no Python services required (same model as the US games). This adapter is
 * kept for the option of proxying the live Python backends instead; to use it,
 * point the stats/generate routes back at caStats/caGenerate.
 *
 * Each Canadian game is served by its own Python service with a different
 * framework, port, and JSON shape:
 *
 *   - lotto649   → FastAPI  (default :8000)  — ships ~4,385 real draws
 *   - lottomax   → Flask    (default :5050)  — loads from an uploaded PDF
 *   - dailygrand → Flask    (default :5051)  — multi-game; loads from CSV/PDF
 *
 * This module calls those services and maps their responses into the normalized
 * `CaStatsResponse` / `CaGenerateResponse` contract from `@millionmind/shared`.
 * The Python backends are NOT modified — all the per-game shape differences are
 * absorbed here. Base URLs are configurable via env so the services can live
 * anywhere in deployment.
 */

import {
  CA_GAMES,
  type CaGameId,
  type CaStatsResponse,
  type CaGenerateResponse,
  type CaTicket,
  type CaPoolStats,
  caDisclaimerFor,
} from "@millionmind/shared";

export interface CaBackendConfig {
  baseUrl: string;
  /** Generation modes the backend's recommender accepts. */
  modes: string[];
}

export const CA_BACKENDS: Record<CaGameId, CaBackendConfig> = {
  lotto649: {
    baseUrl: process.env.CA_LOTTO649_API_URL ?? "http://localhost:8000",
    modes: ["balanced", "hot", "overdue", "random"],
  },
  lottomax: {
    baseUrl: process.env.CA_LOTTOMAX_API_URL ?? "http://localhost:5050",
    modes: ["balanced", "hot", "cold", "overdue", "pairs"],
  },
  dailygrand: {
    baseUrl: process.env.CA_DAILYGRAND_API_URL ?? "http://localhost:5051",
    modes: ["auto", "balanced", "hot", "cold", "overdue"],
  },
};

export class CaBackendError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: "BACKEND_DOWN" | "NO_DATA" | "BACKEND_ERROR" = "BACKEND_ERROR",
  ) {
    super(message);
    this.name = "CaBackendError";
  }
}

const TIMEOUT_MS = 15_000;

async function call<T>(
  game: CaGameId,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const base = CA_BACKENDS[game].baseUrl;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      ...init,
      signal: controller.signal,
      headers: { Accept: "application/json", ...(init?.headers ?? {}) },
      cache: "no-store",
    });
  } catch {
    throw new CaBackendError(
      `${CA_GAMES[game].name} service is not reachable at ${base}. Is the backend running?`,
      503,
      "BACKEND_DOWN",
    );
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text };
  }

  if (!res.ok) {
    const msg =
      (body && typeof body === "object" && "error" in body
        ? String((body as { error: unknown }).error)
        : `Backend returned ${res.status}`) ?? `Backend returned ${res.status}`;
    // Both Flask backends return 400 "No data loaded ..." until a file is uploaded.
    const code = /no data|upload/i.test(msg) ? "NO_DATA" : "BACKEND_ERROR";
    throw new CaBackendError(msg, res.status, code);
  }
  return body as T;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function emptyPool(pool: number): CaPoolStats {
  return { pool, frequency: {}, hot: [], cold: [], overdue: [] };
}

/** Extract numeric ids from a hot/cold/overdue list that may be ints or objects. */
function idList(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === "number") return item;
      if (item && typeof item === "object") {
        const o = item as Record<string, unknown>;
        const v = o.number ?? o.n ?? o.value ?? o.ball;
        return typeof v === "number" ? v : Number(v);
      }
      return Number(item);
    })
    .filter((n) => Number.isFinite(n));
}

function numberArray(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === "number") return item;
      if (item && typeof item === "object" && "number" in (item as object)) {
        return Number((item as { number: unknown }).number);
      }
      return Number(item);
    })
    .filter((n) => Number.isFinite(n));
}

function notesArray(raw: unknown, explanation: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof explanation === "string" && explanation) return [explanation];
  return [];
}

// ─── Stats ───────────────────────────────────────────────────────────────────

export async function caStats(game: CaGameId): Promise<CaStatsResponse> {
  const def = CA_GAMES[game];
  if (game === "lotto649") return stats649(game);

  // lottomax + dailygrand share the Flask `summary_stats` shape.
  const path = game === "dailygrand" ? `/api/games/${def.code}/stats` : "/api/stats";
  const raw = await call<Record<string, unknown>>(game, path);

  const frequency = (raw.frequency ?? {}) as Record<string, number>;
  const main: CaPoolStats = {
    pool: def.mainMax,
    frequency,
    hot: idList(raw.hot_numbers),
    cold: idList(raw.cold_numbers),
    overdue: idList(raw.overdue_numbers),
  };

  let bonus: (CaPoolStats & { label: string }) | null = null;
  if (def.bonusSeparatePool && raw.bonus && typeof raw.bonus === "object") {
    const b = raw.bonus as Record<string, unknown>;
    bonus = {
      label: def.bonusLabel,
      pool: def.bonusMax,
      frequency: (b.frequency ?? {}) as Record<string, number>,
      hot: idList(b.hot),
      cold: idList(b.cold),
      overdue: idList(b.overdue),
    };
  }

  const dateRange =
    raw.date_range && typeof raw.date_range === "object"
      ? (raw.date_range as { start: string; end: string })
      : null;

  const extras: Record<string, unknown> = {};
  for (const k of ["sum_stats", "balance", "dow", "cluster_mean"]) {
    if (k in raw) extras[k] = raw[k];
  }

  return {
    game,
    loaded: true,
    total_drawings: Number(raw.total_draws ?? 0),
    date_range: dateRange,
    main,
    bonus,
    pairs: [],
    extras,
  };
}

/** 649 spreads stats across two FastAPI endpoints with no per-number freq in /stats. */
async function stats649(game: CaGameId): Promise<CaStatsResponse> {
  const def = CA_GAMES[game];
  const statsBody = await call<Record<string, unknown>>(game, "/api/stats");
  const total = Number(statsBody.total_draws ?? 0);
  // /api/frequencies windows to the most-recent N draws; window=5000 ≥ full history.
  const freqBody = await call<{
    total_draws: number;
    entries: Array<{ number: number; count: number; label: string }>;
  }>(game, `/api/frequencies?window=${Math.min(5000, Math.max(total, 50))}`);

  const frequency: Record<string, number> = {};
  const hot: number[] = [];
  const cold: number[] = [];
  for (const e of freqBody.entries ?? []) {
    frequency[String(e.number)] = e.count;
    if (e.label === "hot") hot.push(e.number);
    else if (e.label === "cold") cold.push(e.number);
  }

  const main: CaPoolStats = { pool: def.mainMax, frequency, hot, cold, overdue: [] };

  const extras: Record<string, unknown> = {};
  for (const k of ["chi_squared", "sum_distribution", "odd_even_distribution", "high_low_distribution"]) {
    if (k in statsBody) extras[k] = statsBody[k];
  }

  return {
    game,
    loaded: true,
    total_drawings: total,
    date_range: null, // 6/49 service does not expose a date range
    main,
    bonus: null, // 6/49 bonus is drawn from the main pool — no separate bonus stats
    pairs: [],
    extras,
  };
}

// ─── Generate ──────────────────────────────────────────────────────────────────

export async function caGenerate(
  game: CaGameId,
  mode: string,
  count: number,
): Promise<CaGenerateResponse> {
  const def = CA_GAMES[game];
  const n = Math.min(20, Math.max(1, count));

  let rawTickets: Array<Record<string, unknown>> = [];

  if (game === "lotto649") {
    const body = await call<{ tickets: Array<Record<string, unknown>> }>(
      game,
      "/api/recommend",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          strategy: mode,
          window: 200,
          num_tickets: n,
          allow_consecutive: true,
        }),
      },
    );
    rawTickets = body.tickets ?? [];
  } else if (game === "lottomax") {
    const body = await call<{ tickets: Array<Record<string, unknown>> }>(
      game,
      "/api/recommend",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ n_tickets: n, mode }),
      },
    );
    rawTickets = body.tickets ?? [];
  } else {
    const body = await call<{ combinations: Array<Record<string, unknown>> }>(
      game,
      `/api/games/${def.code}/combinations`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ n_combinations: n, mode }),
      },
    );
    rawTickets = body.combinations ?? [];
  }

  const tickets: CaTicket[] = rawTickets.map((t) => {
    const main = numberArray(t.numbers);
    const bonusRaw = t.bonus;
    const bonus =
      bonusRaw != null && Number.isFinite(Number(bonusRaw)) ? Number(bonusRaw) : null;
    const meta: Record<string, unknown> = {};
    for (const k of ["score", "category", "strategy", "sum", "odd_count", "even_count", "bonus_class", "bonus_label", "encore"]) {
      if (k in t) meta[k] = t[k];
    }
    return {
      main,
      // For 6/49 & Lotto Max the bonus is drawn from the main pool; the recommender
      // may suggest one. Daily Grand's bonus comes from its separate 1–7 pool.
      bonus,
      notes: notesArray(t.notes, t.explanation),
      meta,
    };
  });

  return { game, mode, tickets, disclaimer: caDisclaimerFor(game) };
}

export function emptyStats(game: CaGameId): CaStatsResponse {
  const def = CA_GAMES[game];
  return {
    game,
    loaded: false,
    total_drawings: 0,
    date_range: null,
    main: emptyPool(def.mainMax),
    bonus: def.bonusSeparatePool
      ? { ...emptyPool(def.bonusMax), label: def.bonusLabel }
      : null,
    pairs: [],
    extras: {},
  };
}

// Million Mind — Canadian algorithm engine (portable implementation)
//
// Pure functions that turn a game's draw history (CaDrawingRow[]) into stats,
// co-occurring pairs, and statistically-flavoured ticket generations. The CA
// counterpart of algorithms-impl.ts — but generalized to a variable main count
// (Lotto Max 7, 6/49 6, Daily Grand 5) plus a bonus drawn either from the main
// pool (Max/649) or a separate pool (Daily Grand's Grand Number 1–7).
//
// No DB, no platform deps. Consumed server-side by apps/web/src/lib/ca-runner.ts
// reading the in-codebase apps/web/data/ca-*.json — so CA stats and generation
// are independent of the Python backends (exactly like the US games).
//
// IMPORTANT: None of this predicts winners. Lottery draws are independent
// random events; these produce valid, plausibly-distributed combinations only.

import {
  CA_GAMES,
  type CaGameId,
  type CaDrawingRow,
  type CaPoolStats,
  type CaStatsResponse,
  type CaTicket,
  type CaPair,
} from "./ca-games";

const HOT_COLD_COUNT = 10;

// ─── small RNG helpers ───────────────────────────────────────────────────────

function uniformInt(maxExclusive: number): number {
  return Math.floor(Math.random() * maxExclusive);
}

function weightedSampleDistinct(
  pool: readonly number[],
  weights: readonly number[],
  k: number,
): number[] {
  const items = pool.map((value, i) => ({ value, weight: Math.max(0, weights[i] ?? 0) }));
  const out: number[] = [];
  for (let i = 0; i < k && items.length > 0; i++) {
    const total = items.reduce((s, it) => s + it.weight, 0);
    let idx: number;
    if (total <= 0) {
      idx = uniformInt(items.length);
    } else {
      let r = Math.random() * total;
      idx = items.length - 1;
      for (let j = 0; j < items.length; j++) {
        r -= items[j]!.weight;
        if (r <= 0) {
          idx = j;
          break;
        }
      }
    }
    out.push(items[idx]!.value);
    items.splice(idx, 1);
  }
  return out;
}

function daysBetween(fromIso: string, toIso: string): number {
  const from = Date.parse(fromIso);
  const to = Date.parse(toIso);
  if (Number.isNaN(from) || Number.isNaN(to)) return 0;
  return Math.max(0, Math.floor((to - from) / 86_400_000));
}

// ─── per-number stats ──────────────────────────────────────────────────────────

export interface CaNumberStat {
  number: number;
  frequency: number;
  last_drawn: string | null;
  gap_days: number;
}

function poolStats(
  rows: CaDrawingRow[],
  min: number,
  max: number,
  pick: (row: CaDrawingRow) => number[],
  asOfIso: string,
): CaNumberStat[] {
  const freq = new Map<number, number>();
  const last = new Map<number, string>();
  for (const row of rows) {
    for (const n of pick(row)) {
      freq.set(n, (freq.get(n) ?? 0) + 1);
      const prev = last.get(n);
      if (!prev || row.draw_date > prev) last.set(n, row.draw_date);
    }
  }
  const stats: CaNumberStat[] = [];
  for (let n = min; n <= max; n++) {
    const lastDrawn = last.get(n) ?? null;
    stats.push({
      number: n,
      frequency: freq.get(n) ?? 0,
      last_drawn: lastDrawn,
      gap_days: lastDrawn ? daysBetween(lastDrawn, asOfIso) : Number.MAX_SAFE_INTEGER,
    });
  }
  return stats;
}

function toPoolStats(stats: CaNumberStat[], pool: number, topN = HOT_COLD_COUNT): CaPoolStats {
  const frequency: Record<string, number> = {};
  for (const s of stats) frequency[String(s.number)] = s.frequency;
  const byFreqDesc = [...stats].sort((a, b) => b.frequency - a.frequency);
  const byFreqAsc = [...stats].sort((a, b) => a.frequency - b.frequency);
  const byGapDesc = [...stats].sort((a, b) => b.gap_days - a.gap_days);
  const n = Math.min(topN, stats.length);
  return {
    pool,
    frequency,
    hot: byFreqDesc.slice(0, n).map((s) => s.number),
    cold: byFreqAsc.slice(0, n).map((s) => s.number),
    overdue: byGapDesc.slice(0, n).map((s) => s.number),
  };
}

// ─── co-occurring pairs ────────────────────────────────────────────────────────

export function computeCaTopPairs(rows: CaDrawingRow[], topN = 20): CaPair[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const m = [...row.main].sort((a, b) => a - b);
    for (let i = 0; i < m.length; i++) {
      for (let j = i + 1; j < m.length; j++) {
        const key = `${m[i]}-${m[j]}`;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
  }
  return [...counts.entries()]
    .map(([key, count]) => {
      const [a, b] = key.split("-").map(Number);
      return { a: a!, b: b!, count };
    })
    .sort((x, y) => y.count - x.count)
    .slice(0, topN);
}

/** Full co-occurrence matrix keyed `a-b` (a<b) — used by the "pairs" generator. */
function pairMatrix(rows: CaDrawingRow[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const m = [...row.main].sort((a, b) => a - b);
    for (let i = 0; i < m.length; i++) {
      for (let j = i + 1; j < m.length; j++) {
        const key = `${m[i]}-${m[j]}`;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
  }
  return counts;
}

function pairKey(a: number, b: number): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

// ─── public: full stats response ───────────────────────────────────────────────

export function computeCaStats(
  game: CaGameId,
  rows: CaDrawingRow[],
  asOfIso: string,
): CaStatsResponse {
  const def = CA_GAMES[game];
  const mainStats = poolStats(rows, def.mainMin, def.mainMax, (r) => r.main, asOfIso);

  let bonus: (CaPoolStats & { label: string }) | null = null;
  if (def.bonusSeparatePool) {
    const bonusStats = poolStats(rows, def.bonusMin, def.bonusMax, (r) => [r.bonus], asOfIso);
    bonus = {
      label: def.bonusLabel,
      ...toPoolStats(bonusStats, def.bonusMax, Math.min(HOT_COLD_COUNT, def.bonusMax)),
    };
  }

  const dates = rows.map((r) => r.draw_date).sort();
  return {
    game,
    loaded: rows.length > 0,
    total_drawings: rows.length,
    date_range: dates.length ? { start: dates[0]!, end: dates[dates.length - 1]! } : null,
    main: toPoolStats(mainStats, def.mainMax),
    bonus,
    pairs: computeCaTopPairs(rows, 24),
    extras: {},
  };
}

// ─── ticket generation ──────────────────────────────────────────────────────────

function sumPercentiles(rows: CaDrawingRow[]): { low: number; high: number } {
  if (rows.length === 0) return { low: 0, high: Number.MAX_SAFE_INTEGER };
  const sums = rows.map((r) => r.main.reduce((s, n) => s + n, 0)).sort((a, b) => a - b);
  const at = (p: number) => sums[Math.min(sums.length - 1, Math.floor(sums.length * p))]!;
  return { low: at(0.15), high: at(0.85) };
}

function describe(main: number[], bonusLabel: string, bonus: number | null): {
  notes: string[];
  meta: Record<string, unknown>;
} {
  const sum = main.reduce((s, n) => s + n, 0);
  const odd = main.filter((n) => n % 2 === 1).length;
  const even = main.length - odd;
  const notes = [`Sum ${sum}`, `${odd} odd / ${even} even`];
  const meta: Record<string, unknown> = { sum, odd_count: odd, even_count: even };
  if (bonus != null) meta.bonus_label = bonusLabel;
  return { notes, meta };
}

/** Pick the bonus. Separate pool → weighted from its own pool; shared pool →
 *  one extra number from the main pool that isn't already chosen. */
function pickBonus(
  game: CaGameId,
  mode: string,
  main: number[],
  bonusStats: CaNumberStat[],
  mainStats: CaNumberStat[],
): number {
  const def = CA_GAMES[game];
  if (def.bonusSeparatePool) {
    const pool = bonusStats.map((s) => s.number);
    const weights = bonusStats.map((s) => modeWeight(mode, s, bonusStats));
    return weightedSampleDistinct(pool, weights, 1)[0] ?? def.bonusMin;
  }
  // Shared pool (Max/649): a distinct main-pool number not in `main`.
  const remaining = mainStats.filter((s) => !main.includes(s.number));
  const pool = remaining.map((s) => s.number);
  const weights = remaining.map((s) => modeWeight(mode, s, mainStats));
  return weightedSampleDistinct(pool, weights, 1)[0] ?? def.mainMin;
}

function modeWeight(mode: string, s: CaNumberStat, all: CaNumberStat[]): number {
  switch (mode) {
    case "hot":
      return Math.max(1, s.frequency);
    case "cold": {
      const max = Math.max(...all.map((x) => x.frequency)) + 1;
      return Math.max(1, max - s.frequency);
    }
    case "overdue":
      return Math.pow(Math.max(1, s.gap_days === Number.MAX_SAFE_INTEGER ? 1 : s.gap_days), 1.4);
    default:
      return 1;
  }
}

function generateOne(
  game: CaGameId,
  mode: string,
  mainStats: CaNumberStat[],
  bonusStats: CaNumberStat[],
  pairs: Map<string, number>,
  sumBand: { low: number; high: number },
): CaTicket {
  const def = CA_GAMES[game];
  const pool = mainStats.map((s) => s.number);
  let main: number[];

  if (mode === "pairs") {
    main = generatePairsMain(def.mainCount, mainStats, pairs);
  } else if (mode === "balanced") {
    main = generateBalancedMain(def.mainCount, mainStats, sumBand);
  } else {
    const weights = mainStats.map((s) => modeWeight(mode, s, mainStats));
    main = weightedSampleDistinct(pool, weights, def.mainCount);
  }
  main.sort((a, b) => a - b);

  const bonus = pickBonus(game, mode, main, bonusStats, mainStats);
  const { notes, meta } = describe(main, def.bonusLabel, bonus);
  const modeLabel = def.generationModes.find((m) => m.id === mode)?.label ?? mode;
  return { main, bonus, notes: [modeLabel, ...notes], meta: { ...meta, strategy: mode } };
}

/** Seed by frequency, then grow by strongest co-occurrence with the chosen set. */
function generatePairsMain(
  count: number,
  mainStats: CaNumberStat[],
  pairs: Map<string, number>,
): number[] {
  const pool = mainStats.map((s) => s.number);
  const seed = weightedSampleDistinct(pool, mainStats.map((s) => Math.max(1, s.frequency)), 1)[0]!;
  const picked = [seed];
  while (picked.length < count) {
    const candidates = pool.filter((n) => !picked.includes(n));
    // weight each candidate by total co-occurrence with the picked set (+1 smoothing)
    const weights = candidates.map((c) =>
      picked.reduce((sum, p) => sum + (pairs.get(pairKey(p, c)) ?? 0), 0) + 1,
    );
    const next = weightedSampleDistinct(candidates, weights, 1)[0]!;
    picked.push(next);
  }
  return picked;
}

/** Blend frequency and overdue-gap evenly, and prefer a historically-central sum. */
function generateBalancedMain(
  count: number,
  mainStats: CaNumberStat[],
  sumBand: { low: number; high: number },
): number[] {
  const pool = mainStats.map((s) => s.number);
  const maxFreq = Math.max(1, ...mainStats.map((s) => s.frequency));
  const maxGap = Math.max(
    1,
    ...mainStats.map((s) => (s.gap_days === Number.MAX_SAFE_INTEGER ? 0 : s.gap_days)),
  );
  const weights = mainStats.map((s) => {
    const f = s.frequency / maxFreq;
    const g = (s.gap_days === Number.MAX_SAFE_INTEGER ? 0 : s.gap_days) / maxGap;
    return 0.5 + f + g; // base + frequency + overdue, evenly weighted
  });
  let best: number[] | null = null;
  for (let attempt = 0; attempt < 40; attempt++) {
    const pick = weightedSampleDistinct(pool, weights, count);
    const sum = pick.reduce((s, n) => s + n, 0);
    if (sum >= sumBand.low && sum <= sumBand.high) return pick;
    if (!best) best = pick;
  }
  return best ?? weightedSampleDistinct(pool, weights, count);
}

export interface CaGenerateInput {
  game: CaGameId;
  mode: string;
  count: number;
  rows: CaDrawingRow[];
  asOfIso: string;
}

/** Modes auto-cycles through for the "auto" strategy. */
const AUTO_CYCLE = ["balanced", "hot", "cold", "overdue", "pairs"];

export function generateCaTickets(input: CaGenerateInput): CaTicket[] {
  const { game, mode, count, rows, asOfIso } = input;
  const def = CA_GAMES[game];
  const mainStats = poolStats(rows, def.mainMin, def.mainMax, (r) => r.main, asOfIso);
  const bonusStats = def.bonusSeparatePool
    ? poolStats(rows, def.bonusMin, def.bonusMax, (r) => [r.bonus], asOfIso)
    : mainStats;
  const pairs = pairMatrix(rows);
  const sumBand = sumPercentiles(rows);

  const n = Math.min(20, Math.max(1, count));
  const tickets: CaTicket[] = [];
  for (let i = 0; i < n; i++) {
    const resolved = mode === "auto" ? AUTO_CYCLE[i % AUTO_CYCLE.length]! : mode;
    tickets.push(generateOne(game, resolved, mainStats, bonusStats, pairs, sumBand));
  }
  return tickets;
}

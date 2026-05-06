// Server-side algorithm implementations. Run inside Supabase Edge Functions
// (Deno runtime). Pure functions — receive cached stats / drawings as input,
// return a candidate combination. No DB calls inside; the caller fetches
// inputs and writes results.
//
// IMPORTANT: None of these algorithms predict winners. They produce
// statistically-flavored *generations* of valid lottery combinations.
//
// This file mirrors packages/shared/src/algorithms-impl.ts. Keep them
// in sync — the Deno-side uses .ts import extensions; the Node-side does not.

import type { AlgorithmId } from "./tiers.ts";
import { GAMES, gameSpecialRange, gameWhiteRange, type GameId } from "./games.ts";

export interface NumberStat {
  number: number;
  ball_type: "white" | "powerball";
  frequency: number;
  last_drawn: string | null;
  gap_days: number | null;
}

export interface DrawingRow {
  draw_date: string;
  n1: number;
  n2: number;
  n3: number;
  n4: number;
  n5: number;
  powerball: number;
}

export interface Combination {
  white_balls: [number, number, number, number, number];
  powerball: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────
const WHITE_RANGE_CACHE: Partial<Record<GameId, number[]>> = {};
const SPECIAL_RANGE_CACHE: Partial<Record<GameId, number[]>> = {};
function whiteRangeFor(game: GameId): number[] {
  return (WHITE_RANGE_CACHE[game] ??= gameWhiteRange(game));
}
function specialRangeFor(game: GameId): number[] {
  return (SPECIAL_RANGE_CACHE[game] ??= gameSpecialRange(game));
}

function uniformInt(maxExclusive: number): number {
  return Math.floor(Math.random() * maxExclusive);
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = uniformInt(i + 1);
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function weightedSample(
  pool: readonly number[],
  weights: readonly number[],
  k: number,
): number[] {
  if (pool.length !== weights.length) {
    throw new Error("pool / weights length mismatch");
  }
  const items = pool.map((value, i) => ({ value, weight: weights[i]! }));
  const out: number[] = [];
  for (let i = 0; i < k; i++) {
    const total = items.reduce((s, it) => s + it.weight, 0);
    if (total <= 0) {
      const idx = uniformInt(items.length);
      out.push(items[idx]!.value);
      items.splice(idx, 1);
      continue;
    }
    let r = Math.random() * total;
    let pickedIdx = 0;
    for (let j = 0; j < items.length; j++) {
      r -= items[j]!.weight;
      if (r <= 0) {
        pickedIdx = j;
        break;
      }
    }
    out.push(items[pickedIdx]!.value);
    items.splice(pickedIdx, 1);
  }
  return out;
}

function sortAscFive(nums: number[]): [number, number, number, number, number] {
  const sorted = nums.slice().sort((a, b) => a - b);
  return [sorted[0]!, sorted[1]!, sorted[2]!, sorted[3]!, sorted[4]!];
}

// ─── 1. RANDOM ───────────────────────────────────────────────────────
function randomCombo(game: GameId): Combination {
  const whiteRange = whiteRangeFor(game);
  const specialRange = specialRangeFor(game);
  const whites = shuffle(whiteRange).slice(0, 5);
  return {
    white_balls: sortAscFive(whites),
    powerball: specialRange[uniformInt(specialRange.length)]!,
  };
}

// ─── 2. HOT ──────────────────────────────────────────────────────────
function hotCombo(stats: NumberStat[], game: GameId): Combination {
  const whites = stats.filter((s) => s.ball_type === "white");
  const pbs = stats.filter((s) => s.ball_type === "powerball");
  if (whites.length < 5 || pbs.length < 1) return randomCombo(game);
  const whiteNums = weightedSample(
    whites.map((s) => s.number),
    whites.map((s) => Math.max(1, s.frequency)),
    5,
  );
  const [pb] = weightedSample(
    pbs.map((s) => s.number),
    pbs.map((s) => Math.max(1, s.frequency)),
    1,
  );
  return { white_balls: sortAscFive(whiteNums), powerball: pb! };
}

// ─── 3. COLD ─────────────────────────────────────────────────────────
function coldCombo(stats: NumberStat[], game: GameId): Combination {
  const whites = stats.filter((s) => s.ball_type === "white");
  const pbs = stats.filter((s) => s.ball_type === "powerball");
  if (whites.length < 5 || pbs.length < 1) return randomCombo(game);
  const maxWhite = Math.max(...whites.map((s) => s.frequency)) + 1;
  const maxPb = Math.max(...pbs.map((s) => s.frequency)) + 1;
  const whiteNums = weightedSample(
    whites.map((s) => s.number),
    whites.map((s) => Math.max(1, maxWhite - s.frequency)),
    5,
  );
  const [pb] = weightedSample(
    pbs.map((s) => s.number),
    pbs.map((s) => Math.max(1, maxPb - s.frequency)),
    1,
  );
  return { white_balls: sortAscFive(whiteNums), powerball: pb! };
}

// ─── 4. GAP ──────────────────────────────────────────────────────────
function gapCombo(stats: NumberStat[], game: GameId): Combination {
  const whites = stats.filter((s) => s.ball_type === "white");
  const pbs = stats.filter((s) => s.ball_type === "powerball");
  if (whites.length < 5 || pbs.length < 1) return randomCombo(game);
  const w = (gap: number | null) => Math.pow(Math.max(1, gap ?? 1), 1.5);
  const whiteNums = weightedSample(
    whites.map((s) => s.number),
    whites.map((s) => w(s.gap_days)),
    5,
  );
  const [pb] = weightedSample(
    pbs.map((s) => s.number),
    pbs.map((s) => w(s.gap_days)),
    1,
  );
  return { white_balls: sortAscFive(whiteNums), powerball: pb! };
}

// ─── 5. PATTERN ──────────────────────────────────────────────────────
function patternCombo(game: GameId): Combination {
  for (let attempt = 0; attempt < 1000; attempt++) {
    const c = randomCombo(game);
    const sum = c.white_balls.reduce((s, n) => s + n, 0);
    const odd = c.white_balls.filter((n) => n % 2 === 1).length;
    const lowHalf = Math.floor(GAMES[game].whiteMax / 2);
    const low = c.white_balls.filter((n) => n <= lowHalf).length;
    if (sum >= 100 && sum <= 220 && odd >= 2 && odd <= 3 && low >= 2 && low <= 3) {
      return c;
    }
  }
  return randomCombo(game);
}

// ─── 6. MARKOV ───────────────────────────────────────────────────────
function markovCombo(drawings: DrawingRow[], game: GameId): Combination {
  if (drawings.length < 10) return randomCombo(game);
  const whiteRange = whiteRangeFor(game);
  const specialRange = specialRangeFor(game);
  const whiteMax = GAMES[game].whiteMax;
  const sorted = drawings.slice().sort((a, b) => a.draw_date.localeCompare(b.draw_date));
  const trans: number[][] = Array.from({ length: whiteMax + 1 }, () =>
    new Array(whiteMax + 1).fill(0),
  );
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]!;
    const curr = sorted[i]!;
    const prevWhites = [prev.n1, prev.n2, prev.n3, prev.n4, prev.n5];
    const currWhites = [curr.n1, curr.n2, curr.n3, curr.n4, curr.n5];
    for (const p of prevWhites) {
      for (const c of currWhites) {
        if (p <= whiteMax && c <= whiteMax) trans[p]![c]! += 1;
      }
    }
  }
  const last = sorted[sorted.length - 1]!;
  const lastWhites = [last.n1, last.n2, last.n3, last.n4, last.n5];
  const weights = whiteRange.map((n) => {
    let w = 0;
    for (const p of lastWhites) w += trans[p]?.[n] ?? 0;
    return Math.max(1, w);
  });
  const whiteNums = weightedSample(whiteRange, weights, 5);
  const pbCounts = new Array(GAMES[game].specialMax + 1).fill(0) as number[];
  for (const d of sorted) {
    if (d.powerball <= GAMES[game].specialMax) pbCounts[d.powerball]! += 1;
  }
  const [pb] = weightedSample(
    specialRange,
    specialRange.map((n) => Math.max(1, pbCounts[n] ?? 0)),
    1,
  );
  return { white_balls: sortAscFive(whiteNums), powerball: pb! };
}

// ─── 7. MONTE CARLO ──────────────────────────────────────────────────
function scoreCombo(c: Combination): number {
  const whites = c.white_balls;
  const sum = whites.reduce((s, n) => s + n, 0);
  let score = 0;
  if (sum >= 100 && sum <= 220) score += 1.0;
  const odd = whites.filter((n) => n % 2 === 1).length;
  if (odd >= 2 && odd <= 3) score += 0.8;
  const low = whites.filter((n) => n <= 34).length;
  if (low >= 2 && low <= 3) score += 0.8;
  if (Math.max(...whites) - Math.min(...whites) > 30) score += 0.5;
  let consecutive = 1;
  let maxConsecutive = 1;
  for (let i = 1; i < whites.length; i++) {
    if (whites[i]! - whites[i - 1]! === 1) {
      consecutive += 1;
      maxConsecutive = Math.max(maxConsecutive, consecutive);
    } else {
      consecutive = 1;
    }
  }
  if (maxConsecutive < 3) score += 0.3;
  return score;
}

function monteCarloCombo(game: GameId): Combination {
  let best = randomCombo(game);
  let bestScore = scoreCombo(best);
  for (let i = 0; i < 10000; i++) {
    const c = randomCombo(game);
    const s = scoreCombo(c);
    if (s > bestScore) {
      best = c;
      bestScore = s;
    }
  }
  return best;
}

// ─── 8. MIXED ────────────────────────────────────────────────────────
function mixedCombo(stats: NumberStat[], game: GameId): Combination {
  const whites = stats.filter((s) => s.ball_type === "white");
  const pbs = stats.filter((s) => s.ball_type === "powerball");
  if (whites.length < 5 || pbs.length < 1) return randomCombo(game);

  const byFreq = whites.slice().sort((a, b) => b.frequency - a.frequency);
  const hotPool = byFreq.slice(0, 15);
  const byGap = whites.slice().sort((a, b) => (b.gap_days ?? 0) - (a.gap_days ?? 0));
  const overduePool = byGap.slice(0, 15);

  const picked = new Set<number>();
  for (const n of shuffle(hotPool.map((s) => s.number))) {
    if (picked.size >= 2) break;
    picked.add(n);
  }
  for (const n of shuffle(overduePool.map((s) => s.number))) {
    if (picked.size >= 4) break;
    if (!picked.has(n)) picked.add(n);
  }
  const remaining = whites.filter((s) => !picked.has(s.number));
  if (remaining.length > 0) {
    const [last] = weightedSample(
      remaining.map((s) => s.number),
      remaining.map((s) => Math.max(1, s.frequency)),
      1,
    );
    picked.add(last!);
  }
  const whiteMax = GAMES[game].whiteMax;
  while (picked.size < 5) picked.add(uniformInt(whiteMax) + 1);
  const [pb] = weightedSample(
    pbs.map((s) => s.number),
    pbs.map((s) => Math.max(1, s.frequency)),
    1,
  );
  return { white_balls: sortAscFive(Array.from(picked).slice(0, 5)), powerball: pb! };
}

// ─── 9. ANTI-SYNDICATION ─────────────────────────────────────────────
function antiSyndicationCombo(game: GameId): Combination {
  for (let attempt = 0; attempt < 1000; attempt++) {
    const c = randomCombo(game);
    const lowCount = c.white_balls.filter((n) => n <= 31).length;
    if (lowCount > 2) continue;
    let maxConsecutive = 1;
    let cur = 1;
    for (let i = 1; i < c.white_balls.length; i++) {
      if (c.white_balls[i]! - c.white_balls[i - 1]! === 1) {
        cur += 1;
        maxConsecutive = Math.max(maxConsecutive, cur);
      } else {
        cur = 1;
      }
    }
    if (maxConsecutive >= 3) continue;
    const multiplesOf5 = c.white_balls.filter((n) => n % 5 === 0).length;
    if (multiplesOf5 >= 4) continue;
    return c;
  }
  return randomCombo(game);
}

// ─── Dispatcher ──────────────────────────────────────────────────────
export interface AlgorithmInputs {
  game?: GameId;
  stats?: NumberStat[];
  drawings?: DrawingRow[];
}

export function generate(
  algorithm: AlgorithmId,
  inputs: AlgorithmInputs,
): Combination {
  const game: GameId = inputs.game ?? "powerball";
  switch (algorithm) {
    case "random":
      return randomCombo(game);
    case "hot":
      return hotCombo(inputs.stats ?? [], game);
    case "cold":
      return coldCombo(inputs.stats ?? [], game);
    case "gap":
      return gapCombo(inputs.stats ?? [], game);
    case "pattern":
      return patternCombo(game);
    case "markov":
      return markovCombo(inputs.drawings ?? [], game);
    case "monte_carlo":
      return monteCarloCombo(game);
    case "mixed":
      return mixedCombo(inputs.stats ?? [], game);
    case "anti_syndication":
      return antiSyndicationCombo(game);
  }
}

export function needsStats(algorithm: AlgorithmId): boolean {
  return ["hot", "cold", "gap", "mixed"].includes(algorithm);
}

export function needsDrawings(algorithm: AlgorithmId): boolean {
  return algorithm === "markov";
}

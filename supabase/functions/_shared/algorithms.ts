// Server-side algorithm implementations. Run inside Supabase Edge Functions
// (Deno runtime). Pure functions — receive cached stats / drawings as input,
// return a candidate combination. No DB calls inside; the caller fetches
// inputs and writes results.
//
// IMPORTANT: None of these algorithms predict winners. They produce
// statistically-flavored *generations* of valid Powerball combinations.

import type { AlgorithmId } from "./tiers.ts";

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
const WHITE_RANGE = Array.from({ length: 69 }, (_, i) => i + 1);
const PB_RANGE = Array.from({ length: 26 }, (_, i) => i + 1);

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
      // All remaining weights are zero — fall back to uniform.
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
function randomCombo(): Combination {
  const whites = shuffle(WHITE_RANGE).slice(0, 5);
  return {
    white_balls: sortAscFive(whites),
    powerball: PB_RANGE[uniformInt(26)]!,
  };
}

// ─── 2. HOT ──────────────────────────────────────────────────────────
function hotCombo(stats: NumberStat[]): Combination {
  const whites = stats.filter((s) => s.ball_type === "white");
  const pbs = stats.filter((s) => s.ball_type === "powerball");
  if (whites.length < 5 || pbs.length < 1) return randomCombo();
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
function coldCombo(stats: NumberStat[]): Combination {
  const whites = stats.filter((s) => s.ball_type === "white");
  const pbs = stats.filter((s) => s.ball_type === "powerball");
  if (whites.length < 5 || pbs.length < 1) return randomCombo();
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
function gapCombo(stats: NumberStat[]): Combination {
  const whites = stats.filter((s) => s.ball_type === "white");
  const pbs = stats.filter((s) => s.ball_type === "powerball");
  if (whites.length < 5 || pbs.length < 1) return randomCombo();
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
// Sum 100–220, 2–3 odd, 2–3 in low half (1–34). Up to 1000 retries.
function patternCombo(): Combination {
  for (let attempt = 0; attempt < 1000; attempt++) {
    const c = randomCombo();
    const sum = c.white_balls.reduce((s, n) => s + n, 0);
    const odd = c.white_balls.filter((n) => n % 2 === 1).length;
    const low = c.white_balls.filter((n) => n <= 34).length;
    if (sum >= 100 && sum <= 220 && odd >= 2 && odd <= 3 && low >= 2 && low <= 3) {
      return c;
    }
  }
  return randomCombo();
}

// ─── 6. MARKOV ───────────────────────────────────────────────────────
// Simple bigram transition: P(n appears in current draw | m appeared in prior)
// Build counts from drawings ordered by date asc; sample 5 whites weighted by
// the row of the matrix corresponding to the most recent drawing's whites.
function markovCombo(drawings: DrawingRow[]): Combination {
  if (drawings.length < 10) return randomCombo();
  const sorted = drawings.slice().sort((a, b) => a.draw_date.localeCompare(b.draw_date));
  // 70x70 (use 1..69) transition counts for whites.
  const trans: number[][] = Array.from({ length: 70 }, () => new Array(70).fill(0));
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]!;
    const curr = sorted[i]!;
    const prevWhites = [prev.n1, prev.n2, prev.n3, prev.n4, prev.n5];
    const currWhites = [curr.n1, curr.n2, curr.n3, curr.n4, curr.n5];
    for (const p of prevWhites) {
      for (const c of currWhites) {
        trans[p]![c]! += 1;
      }
    }
  }
  const last = sorted[sorted.length - 1]!;
  const lastWhites = [last.n1, last.n2, last.n3, last.n4, last.n5];
  const weights = WHITE_RANGE.map((n) => {
    let w = 0;
    for (const p of lastWhites) w += trans[p]![n] ?? 0;
    return Math.max(1, w);
  });
  const whiteNums = weightedSample(WHITE_RANGE, weights, 5);
  // Powerball: marginal frequency from drawings (independent of whites).
  const pbCounts = new Array(27).fill(0) as number[];
  for (const d of sorted) pbCounts[d.powerball]! += 1;
  const [pb] = weightedSample(
    PB_RANGE,
    PB_RANGE.map((n) => Math.max(1, pbCounts[n]!)),
    1,
  );
  return { white_balls: sortAscFive(whiteNums), powerball: pb! };
}

// ─── 7. MONTE CARLO ──────────────────────────────────────────────────
function scoreCombo(c: Combination): number {
  const whites = c.white_balls;
  const sum = whites.reduce((s, n) => s + n, 0);
  let score = 0;
  // Sum within a balanced range
  if (sum >= 100 && sum <= 220) score += 1.0;
  // Odd/even balance (2–3 odd)
  const odd = whites.filter((n) => n % 2 === 1).length;
  if (odd >= 2 && odd <= 3) score += 0.8;
  // High/low balance (2–3 in low half)
  const low = whites.filter((n) => n <= 34).length;
  if (low >= 2 && low <= 3) score += 0.8;
  // Spread > 30
  if (Math.max(...whites) - Math.min(...whites) > 30) score += 0.5;
  // No 3 consecutive numbers
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

function monteCarloCombo(): Combination {
  let best = randomCombo();
  let bestScore = scoreCombo(best);
  for (let i = 0; i < 10000; i++) {
    const c = randomCombo();
    const s = scoreCombo(c);
    if (s > bestScore) {
      best = c;
      bestScore = s;
    }
  }
  return best;
}

// ─── Dispatcher ──────────────────────────────────────────────────────
export interface AlgorithmInputs {
  stats?: NumberStat[];
  drawings?: DrawingRow[];
}

export function generate(
  algorithm: AlgorithmId,
  inputs: AlgorithmInputs,
): Combination {
  switch (algorithm) {
    case "random":
      return randomCombo();
    case "hot":
      return hotCombo(inputs.stats ?? []);
    case "cold":
      return coldCombo(inputs.stats ?? []);
    case "gap":
      return gapCombo(inputs.stats ?? []);
    case "pattern":
      return patternCombo();
    case "markov":
      return markovCombo(inputs.drawings ?? []);
    case "monte_carlo":
      return monteCarloCombo();
  }
}

export function needsStats(algorithm: AlgorithmId): boolean {
  return ["hot", "cold", "gap"].includes(algorithm);
}

export function needsDrawings(algorithm: AlgorithmId): boolean {
  return algorithm === "markov";
}

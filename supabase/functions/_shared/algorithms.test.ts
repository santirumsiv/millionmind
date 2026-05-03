// Million Mind — Algorithm engine tests
//
// Run with:  deno test supabase/functions/_shared/algorithms.test.ts
//
// These tests verify the structural invariants every Powerball combination
// must satisfy — they do NOT (and cannot) verify "quality" in any sense
// related to predicting winners. Lottery draws are independent random events.

import { assert, assertEquals } from "jsr:@std/assert@1";
import {
  generate,
  type DrawingRow,
  type NumberStat,
  type AlgorithmId,
} from "./algorithms.ts";

const ALL_ALGORITHMS: AlgorithmId[] = [
  "random",
  "hot",
  "cold",
  "gap",
  "pattern",
  "markov",
  "monte_carlo",
];

// ─── Fixtures ────────────────────────────────────────────────────────
function makeStats(): NumberStat[] {
  const out: NumberStat[] = [];
  for (let n = 1; n <= 69; n++) {
    out.push({
      number: n,
      ball_type: "white",
      frequency: ((n * 7) % 17) + 1, // varied
      last_drawn: "2025-01-01",
      gap_days: ((n * 3) % 30) + 1,
    });
  }
  for (let n = 1; n <= 26; n++) {
    out.push({
      number: n,
      ball_type: "powerball",
      frequency: ((n * 5) % 13) + 1,
      last_drawn: "2025-01-01",
      gap_days: ((n * 4) % 25) + 1,
    });
  }
  return out;
}

function makeDrawings(count = 50): DrawingRow[] {
  const out: DrawingRow[] = [];
  for (let i = 0; i < count; i++) {
    const seed = i * 13;
    const whites = Array.from(
      new Set([
        ((seed) % 69) + 1,
        ((seed + 11) % 69) + 1,
        ((seed + 23) % 69) + 1,
        ((seed + 37) % 69) + 1,
        ((seed + 53) % 69) + 1,
      ]),
    );
    while (whites.length < 5) {
      const candidate = (Math.floor(Math.random() * 69) + 1);
      if (!whites.includes(candidate)) whites.push(candidate);
    }
    whites.sort((a, b) => a - b);
    out.push({
      draw_date: new Date(2024, 0, i + 1).toISOString().slice(0, 10),
      n1: whites[0]!,
      n2: whites[1]!,
      n3: whites[2]!,
      n4: whites[3]!,
      n5: whites[4]!,
      powerball: ((seed) % 26) + 1,
    });
  }
  return out;
}

// ─── Structural invariants ──────────────────────────────────────────
for (const algorithm of ALL_ALGORITHMS) {
  Deno.test(`${algorithm}: produces valid combination structure`, () => {
    const stats = makeStats();
    const drawings = makeDrawings();

    for (let i = 0; i < 50; i++) {
      const combo = generate(algorithm, { stats, drawings });

      assertEquals(combo.white_balls.length, 5, "must have exactly 5 white balls");

      // White ball range and uniqueness
      const seen = new Set<number>();
      for (const n of combo.white_balls) {
        assert(Number.isInteger(n), "white ball must be integer");
        assert(n >= 1 && n <= 69, `white ball ${n} out of range`);
        assert(!seen.has(n), `duplicate white ball ${n}`);
        seen.add(n);
      }

      // Sorted ascending (consumer expectation)
      const sorted = [...combo.white_balls].sort((a, b) => a - b);
      assertEquals(combo.white_balls, sorted, "white balls must be sorted ascending");

      // Powerball range
      assert(Number.isInteger(combo.powerball), "powerball must be integer");
      assert(combo.powerball >= 1 && combo.powerball <= 26, `powerball ${combo.powerball} out of range`);
    }
  });
}

// ─── Determinism / variation ────────────────────────────────────────
Deno.test("random: produces varied output across calls", () => {
  const seen = new Set<string>();
  for (let i = 0; i < 30; i++) {
    const c = generate("random", {});
    seen.add(c.white_balls.join(",") + "|" + c.powerball);
  }
  assert(seen.size > 1, "random must vary across calls");
});

Deno.test("hot: weights correlate with frequency", () => {
  // With heavily-skewed frequencies, the most-drawn number should appear far
  // more often than the least-drawn number across many samples.
  const stats: NumberStat[] = Array.from({ length: 69 }, (_, i) => ({
    number: i + 1,
    ball_type: "white" as const,
    frequency: i === 0 ? 1 : i === 68 ? 1000 : 50,
    last_drawn: null,
    gap_days: null,
  }));
  // Need at least one powerball stat
  stats.push({
    number: 1,
    ball_type: "powerball",
    frequency: 100,
    last_drawn: null,
    gap_days: null,
  });

  let lowSeen = 0;
  let highSeen = 0;
  for (let i = 0; i < 200; i++) {
    const c = generate("hot", { stats });
    if (c.white_balls.includes(1)) lowSeen += 1;
    if (c.white_balls.includes(69)) highSeen += 1;
  }
  assert(highSeen > lowSeen, `hot must favor high-frequency: high=${highSeen} low=${lowSeen}`);
});

Deno.test("pattern: most outputs satisfy balance criteria", () => {
  let satisfied = 0;
  for (let i = 0; i < 100; i++) {
    const c = generate("pattern", {});
    const sum = c.white_balls.reduce((s, n) => s + n, 0);
    const odd = c.white_balls.filter((n) => n % 2 === 1).length;
    const low = c.white_balls.filter((n) => n <= 34).length;
    if (sum >= 100 && sum <= 220 && odd >= 2 && odd <= 3 && low >= 2 && low <= 3) {
      satisfied += 1;
    }
  }
  // Pattern uses up to 1000 retries — most outputs should satisfy.
  // Allow some slack for the rare full-retry exhaustion case.
  assert(satisfied >= 95, `pattern should satisfy criteria for >=95/100; got ${satisfied}`);
});

Deno.test("markov: works with sparse drawings", () => {
  const drawings = makeDrawings(20);
  for (let i = 0; i < 10; i++) {
    const c = generate("markov", { drawings });
    assertEquals(new Set(c.white_balls).size, 5);
  }
});

Deno.test("markov: falls back to random with too-few drawings", () => {
  // Less than 10 drawings → random fallback
  const drawings = makeDrawings(5);
  const c = generate("markov", { drawings });
  assertEquals(c.white_balls.length, 5);
});

Deno.test("monte_carlo: scores converge above baseline", () => {
  const c = generate("monte_carlo", {});
  const sum = c.white_balls.reduce((s, n) => s + n, 0);
  // Monte Carlo selects best of 10K — sum should land in the balanced range.
  assert(sum >= 80 && sum <= 240, `monte_carlo sum out of plausible range: ${sum}`);
});

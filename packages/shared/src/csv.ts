/**
 * Tiny CSV serialization helper. Keeps the format consistent across web
 * download paths and mobile share-sheet paths. Handles values that need
 * quoting (commas, quotes, newlines).
 */

import type { Drawing, GeneratedCombination } from "./types";

export function escapeCsvField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function rowsToCsv(
  rows: Array<Record<string, string | number | null | undefined>>,
  columns: readonly string[],
): string {
  const lines = [columns.join(",")];
  for (const row of rows) {
    lines.push(columns.map((c) => escapeCsvField(row[c])).join(","));
  }
  return lines.join("\n") + "\n";
}

/** Shape a list of historical drawings into a CSV. */
export function drawingsToCsv(drawings: Drawing[]): string {
  return rowsToCsv(
    drawings.map((d) => ({
      draw_date: d.draw_date,
      n1: d.n1,
      n2: d.n2,
      n3: d.n3,
      n4: d.n4,
      n5: d.n5,
      powerball: d.powerball,
      multiplier: d.multiplier,
    })),
    ["draw_date", "n1", "n2", "n3", "n4", "n5", "powerball", "multiplier"],
  );
}

/** Shape a user's generation history into a CSV. */
export function generationsToCsv(generations: GeneratedCombination[]): string {
  return rowsToCsv(
    generations.map((g) => {
      const [n1, n2, n3, n4, n5] = g.white_balls;
      return {
        generated_at: g.created_at,
        algorithm: g.algorithm_used,
        n1,
        n2,
        n3,
        n4,
        n5,
        powerball: g.powerball,
      };
    }),
    ["generated_at", "algorithm", "n1", "n2", "n3", "n4", "n5", "powerball"],
  );
}

/** Build a download filename with today's date stamp. */
export function todayStampedFilename(prefix: string): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `${prefix}_${stamp}.csv`;
}

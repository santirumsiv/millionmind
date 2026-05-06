"use client";

import type { DrawingRow, GameId } from "@millionmind/shared";

const CSV_BY_GAME: Record<GameId, string> = {
  powerball: "/full_history.csv",
  megamillions: "/mm_history.csv",
};

/**
 * Fetch and parse a static CSV in /public for the given game. Returns
 * drawings sorted asc. Used by /demo to run algorithms entirely in the
 * browser, no backend.
 */
export async function fetchDemoDrawings(game: GameId = "powerball"): Promise<DrawingRow[]> {
  const url = CSV_BY_GAME[game];
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load ${url}: ${res.status}`);
  }
  const text = await res.text();
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  // First line is header
  const rows: DrawingRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i]!.split(",");
    if (parts.length < 8) continue;
    rows.push({
      draw_date: parts[0]!,
      n1: Number(parts[1]),
      n2: Number(parts[2]),
      n3: Number(parts[3]),
      n4: Number(parts[4]),
      n5: Number(parts[5]),
      powerball: Number(parts[6]),
    });
  }
  rows.sort((a, b) => a.draw_date.localeCompare(b.draw_date));
  return rows;
}

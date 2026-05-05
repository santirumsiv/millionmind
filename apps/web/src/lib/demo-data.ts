"use client";

import type { DrawingRow } from "@millionmind/shared";

/**
 * Fetch and parse the static CSV in /public. Returns drawings sorted asc.
 * Used by the /demo route to run algorithms entirely client-side.
 */
export async function fetchDemoDrawings(): Promise<DrawingRow[]> {
  const res = await fetch("/full_history.csv");
  if (!res.ok) {
    throw new Error(`Failed to load /full_history.csv: ${res.status}`);
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

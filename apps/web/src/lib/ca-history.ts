/**
 * Server-side CA draw-history loader.
 *
 * Mirrors algorithm-runner.ts for the US games: the three Canadian games ship
 * their full draw history as static JSON in apps/web/data/ca-*.json (parsed
 * from the OLG "Since Inception" PDFs by scripts/parse-ca-draws.py). The CA
 * History tab reads these in-codebase files — exactly the way Powerball history
 * is served — so it does NOT depend on the live Python backends.
 *
 * Imported only from API route handlers (never sent to the client wholesale).
 */

import type { CaDrawingRow, CaGameId } from "@millionmind/shared";

import lotto649Data from "@/../data/ca-lotto649.json";
import lottomaxData from "@/../data/ca-lottomax.json";
import dailygrandData from "@/../data/ca-dailygrand.json";

interface CaDataFile {
  game: string;
  generated_at: string;
  count: number;
  date_range: { start: string; end: string } | null;
  rows: CaDrawingRow[];
}

const drawingsByGame: Record<CaGameId, CaDataFile> = {
  lotto649: lotto649Data as CaDataFile,
  lottomax: lottomaxData as CaDataFile,
  dailygrand: dailygrandData as CaDataFile,
};

/** Most-recent `limit` draws, newest first (matches recentDrawingsForGame). */
export function recentCaDrawings(game: CaGameId, limit: number): CaDrawingRow[] {
  const all = drawingsByGame[game].rows;
  return all.slice(-limit).reverse();
}

export function totalCaDrawings(game: CaGameId): number {
  return drawingsByGame[game].rows.length;
}

export function caDateRange(game: CaGameId): { start: string; end: string } | null {
  return drawingsByGame[game].date_range;
}

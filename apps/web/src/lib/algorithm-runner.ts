/**
 * Server-side algorithm runner.
 *
 * Loads the drawings JSON files (server-only, never sent to the client),
 * computes derived stats, and dispatches to the algorithm implementation
 * in @millionmind/shared. Imported only from API route handlers.
 */

import {
  generate as runAlgorithm,
  computeStats,
  computeTopPairs,
  type AlgorithmId,
  type Combination,
  type DrawingRow,
  type GameId,
  type NumberStat,
} from "@millionmind/shared";

import powerballData from "@/../data/powerball.json";
import megamillionsData from "@/../data/megamillions.json";

interface DataFile {
  game: string;
  generated_at: string;
  rows: DrawingRow[];
}

const drawingsByGame: Record<GameId, DrawingRow[]> = {
  powerball: (powerballData as DataFile).rows,
  megamillions: (megamillionsData as DataFile).rows,
};

// Stats are computed once at module load (cold start) per game and
// reused for every request. Refreshed on each deploy when the JSON
// files change.
const statsByGame: Record<GameId, NumberStat[]> = {
  powerball: computeStats(drawingsByGame.powerball, "powerball"),
  megamillions: computeStats(drawingsByGame.megamillions, "megamillions"),
};

export function generateForGame(
  algorithm: AlgorithmId,
  game: GameId,
): Combination {
  return runAlgorithm(algorithm, {
    game,
    drawings: drawingsByGame[game],
    stats: statsByGame[game],
  });
}

export function statsForGame(game: GameId): NumberStat[] {
  return statsByGame[game];
}

export function topPairsForGame(game: GameId, limit = 25) {
  return computeTopPairs(drawingsByGame[game], limit);
}

/**
 * Recent N drawings, with no algorithm-input fields exposed beyond what
 * the UI needs. Used by /api/drawings to power the History page.
 */
export function recentDrawingsForGame(
  game: GameId,
  limit: number,
): DrawingRow[] {
  const all = drawingsByGame[game];
  return all.slice(-limit).reverse();
}

export function totalDrawingsForGame(game: GameId): number {
  return drawingsByGame[game].length;
}

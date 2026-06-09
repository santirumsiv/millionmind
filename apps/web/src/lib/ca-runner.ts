/**
 * Server-side CA stats + generation runner.
 *
 * The CA counterpart of algorithm-runner.ts: loads the in-codebase draw history
 * (apps/web/data/ca-*.json), computes stats/pairs once at cold start, and runs
 * the generation engine from @millionmind/shared. This makes CA Analytics and
 * Generate independent of the Python backends — same model as the US games and
 * the CA History tab. Imported only from API route handlers.
 */

import {
  CA_GAMES,
  computeCaStats,
  computeCaTopPairs,
  generateCaTickets,
  caDisclaimerFor,
  type CaGameId,
  type CaDrawingRow,
  type CaStatsResponse,
  type CaGenerateResponse,
} from "@millionmind/shared";

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

const rowsByGame: Record<CaGameId, CaDrawingRow[]> = {
  lotto649: (lotto649Data as CaDataFile).rows,
  lottomax: (lottomaxData as CaDataFile).rows,
  dailygrand: (dailygrandData as CaDataFile).rows,
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// Stats are computed once at module load (cold start) per game and reused for
// every request — refreshed on each deploy when the JSON files change.
const statsByGame: Record<CaGameId, CaStatsResponse> = {
  lotto649: computeCaStats("lotto649", rowsByGame.lotto649, today()),
  lottomax: computeCaStats("lottomax", rowsByGame.lottomax, today()),
  dailygrand: computeCaStats("dailygrand", rowsByGame.dailygrand, today()),
};

export function caStatsFromData(game: CaGameId): CaStatsResponse {
  return statsByGame[game];
}

export function caTopPairsFromData(game: CaGameId, limit = 24) {
  return computeCaTopPairs(rowsByGame[game], limit);
}

export function caGenerateFromData(
  game: CaGameId,
  mode: string,
  count: number,
): CaGenerateResponse {
  const valid = new Set(CA_GAMES[game].generationModes.map((m) => m.id));
  const resolvedMode = valid.has(mode) ? mode : CA_GAMES[game].generationModes[0]!.id;
  const tickets = generateCaTickets({
    game,
    mode: resolvedMode,
    count,
    rows: rowsByGame[game],
    asOfIso: today(),
  });
  return { game, mode: resolvedMode, tickets, disclaimer: caDisclaimerFor(game) };
}

/**
 * Canadian games registry — Million Mind's CA section covers three OLG-operated
 * draw games whose matrices differ from the US 5-whites + 1-special structure:
 *
 *   - Lotto Max   — 7 main numbers from 1–50, plus a Bonus drawn from the SAME pool
 *   - Lotto 6/49  — 6 main numbers from 1–49, plus a Bonus drawn from the SAME pool
 *   - Daily Grand — 5 main numbers from 1–49, plus a Grand Number from a SEPARATE 1–7 pool
 *
 * The US registry (./games.ts) is hardcoded to 5 whites + 1 special and stays
 * untouched. The CA side uses a variable-length `mainCount` + optional bonus so a
 * single set of components/types renders all three games.
 *
 * Each game is backed by its own Python service (FastAPI for 6/49, Flask for the
 * other two). The Next.js adapter layer in `apps/web/src/lib/ca-backends.ts` calls
 * those services and normalizes their differing JSON into the contract the CA UI
 * consumes — the backends themselves are not modified.
 */

export const CA_GAME_IDS = ["lottomax", "lotto649", "dailygrand"] as const;
export type CaGameId = (typeof CA_GAME_IDS)[number];

export interface CaGameDefinition {
  id: CaGameId;
  /** Backend game code where applicable (Daily Grand multi-game service uses these). */
  code: string;
  name: string;
  shortName: string;
  /** Main pool: pick `mainCount` numbers from `mainMin`..`mainMax`. */
  mainMin: number;
  mainMax: number;
  mainCount: number;
  /** Bonus number metadata. `bonusSeparatePool` distinguishes Daily Grand (own 1–7 pool). */
  bonusLabel: string;
  bonusMin: number;
  bonusMax: number;
  bonusSeparatePool: boolean;
  /** ISO weekday numbers (1=Mon..7=Sun) when the game draws. */
  drawWeekdays: number[];
  /** Human-readable draw schedule. */
  drawSchedule: string;
  /** Top-prize odds — must be displayed verbatim per OLG/AGCO guidance. */
  jackpotOdds: string;
  /** Operator (used in non-affiliation disclaimers). */
  operator: string;
  /** Color accent used for tabs / chips (reuses the existing theme tokens). */
  accent: "gold" | "warn-deep" | "green";
  officialUrl: string;
  inceptionDate: string;
  /** Generation strategies the game's backend recommender accepts (first = default). */
  generationModes: { id: string; label: string; description: string }[];
}

const COMMON_MODES = {
  balanced: { id: "balanced", label: "Balanced", description: "Even spread across frequency, overdue, and randomness." },
  hot: { id: "hot", label: "Hot", description: "Favours numbers drawn more often recently." },
  cold: { id: "cold", label: "Cold", description: "Favours numbers drawn less often recently." },
  overdue: { id: "overdue", label: "Overdue", description: "Favours numbers absent the longest." },
  pairs: { id: "pairs", label: "Pairs", description: "Emphasises historically co-occurring pairs." },
  random: { id: "random", label: "Random", description: "Uniform random pick — the true baseline." },
  auto: { id: "auto", label: "Auto mix", description: "A prescribed mix of strategies across the tickets." },
} as const;

export const CA_GAMES: Record<CaGameId, CaGameDefinition> = {
  lottomax: {
    id: "lottomax",
    code: "LM",
    name: "Lotto Max",
    shortName: "LM",
    mainMin: 1,
    mainMax: 50,
    mainCount: 7,
    bonusLabel: "Bonus Number",
    bonusMin: 1,
    bonusMax: 50,
    bonusSeparatePool: false,
    drawWeekdays: [2, 5], // Tue, Fri
    drawSchedule: "Tuesday & Friday",
    jackpotOdds: "1 in 33,294,800",
    operator: "Interprovincial Lottery Corporation (OLG)",
    accent: "warn-deep",
    officialUrl: "https://www.olg.ca/en/lottery/play-lotto-max-encore/winning-numbers",
    inceptionDate: "2009-09-25",
    generationModes: [COMMON_MODES.balanced, COMMON_MODES.hot, COMMON_MODES.cold, COMMON_MODES.overdue, COMMON_MODES.pairs],
  },
  lotto649: {
    id: "lotto649",
    code: "649",
    name: "Lotto 6/49",
    shortName: "6/49",
    mainMin: 1,
    mainMax: 49,
    mainCount: 6,
    bonusLabel: "Bonus Number",
    bonusMin: 1,
    bonusMax: 49,
    bonusSeparatePool: false,
    drawWeekdays: [3, 6], // Wed, Sat
    drawSchedule: "Wednesday & Saturday",
    jackpotOdds: "1 in 13,983,816",
    operator: "Interprovincial Lottery Corporation (OLG)",
    accent: "gold",
    officialUrl: "https://www.olg.ca/en/lottery/play-lotto-649-encore/winning-numbers",
    inceptionDate: "1982-06-12",
    generationModes: [COMMON_MODES.balanced, COMMON_MODES.hot, COMMON_MODES.overdue, COMMON_MODES.random],
  },
  dailygrand: {
    id: "dailygrand",
    code: "DG",
    name: "Daily Grand",
    shortName: "DG",
    mainMin: 1,
    mainMax: 49,
    mainCount: 5,
    bonusLabel: "Grand Number",
    bonusMin: 1,
    bonusMax: 7,
    bonusSeparatePool: true,
    drawWeekdays: [1, 4], // Mon, Thu
    drawSchedule: "Monday & Thursday",
    jackpotOdds: "1 in 13,348,188",
    operator: "Interprovincial Lottery Corporation (OLG)",
    accent: "green",
    officialUrl: "https://www.olg.ca/en/lottery/play-daily-grand-encore/winning-numbers",
    inceptionDate: "2016-10-20",
    generationModes: [COMMON_MODES.auto, COMMON_MODES.balanced, COMMON_MODES.hot, COMMON_MODES.cold, COMMON_MODES.overdue],
  },
};

export function caMainRange(game: CaGameId): number[] {
  const g = CA_GAMES[game];
  return Array.from({ length: g.mainMax - g.mainMin + 1 }, (_, i) => g.mainMin + i);
}

export function caBonusRange(game: CaGameId): number[] {
  const g = CA_GAMES[game];
  return Array.from({ length: g.bonusMax - g.bonusMin + 1 }, (_, i) => g.bonusMin + i);
}

export function caDisclaimerFor(game: CaGameId): string {
  const g = CA_GAMES[game];
  return [
    `Million Mind is a statistical analysis and entertainment application. It does not predict, forecast, or otherwise indicate future ${g.name} draws. Lottery draws are independent random events; no algorithm, pattern, or analysis can improve the mathematical probability of winning, which remains ${g.jackpotOdds} for the ${g.name} top prize regardless of which numbers are selected.`,
    `This application is for entertainment purposes only. It does not increase the user's chances of winning any lottery draw.`,
    `You must be of legal age to play in your province. Please play responsibly. If you or someone you know has a gambling problem, call ConnexOntario at 1-866-531-2600 or visit responsiblegambling.org.`,
  ].join("\n\n");
}

export function caNonAffiliationFor(game: CaGameId): string {
  return `Million Mind is not affiliated with, endorsed by, or sponsored by ${CA_GAMES[game].operator}, the Ontario Lottery and Gaming Corporation, or any provincial lottery.`;
}

/**
 * Next drawing date for a CA game, starting from `from`.
 */
export function caNextDrawing(
  game: CaGameId,
  from: Date = new Date(),
): { weekday: string; date: string; iso: string } {
  const days = CA_GAMES[game].drawWeekdays;
  for (let i = 0; i < 7; i++) {
    const candidate = new Date(from);
    candidate.setDate(from.getDate() + i);
    const isoWeekday = ((candidate.getDay() + 6) % 7) + 1; // 1=Mon..7=Sun
    if (days.includes(isoWeekday)) {
      return {
        weekday: candidate.toLocaleDateString(undefined, { weekday: "long" }),
        date: candidate.toLocaleDateString(undefined, { month: "long", day: "numeric" }),
        iso: candidate.toISOString().slice(0, 10),
      };
    }
  }
  return { weekday: "—", date: "—", iso: "" };
}

// ─── Normalized contract returned by the Next.js CA adapter layer ──────────────
// The three Python backends return different JSON; the adapter maps each into
// these shapes so the CA frontend has one consistent interface.

export interface CaPoolStats {
  /** Pool size (mainMax for the main pool, bonusMax for the bonus pool). */
  pool: number;
  /** number → times drawn across the loaded history. */
  frequency: Record<string, number>;
  hot: number[];
  cold: number[];
  overdue: number[];
}

/** A historically co-occurring pair of main numbers and how often they shared a draw. */
export interface CaPair {
  a: number;
  b: number;
  count: number;
}

export interface CaStatsResponse {
  game: CaGameId;
  loaded: boolean;
  total_drawings: number;
  date_range: { start: string; end: string } | null;
  main: CaPoolStats;
  /** Present only for games with a separate bonus pool (Daily Grand). */
  bonus: (CaPoolStats & { label: string }) | null;
  /** Most frequent co-occurring main-number pairs, highest first. */
  pairs: CaPair[];
  /** Raw per-backend extras passed through for richer panels (sum dist, chi², etc.). */
  extras: Record<string, unknown>;
}

export interface CaTicket {
  main: number[];
  /** Bonus number when the game's generator assigns one (Daily Grand); else null. */
  bonus: number | null;
  /** Short human-readable notes from the backend recommender. */
  notes: string[];
  /** Raw per-backend ticket metadata (scores, counts) for optional display. */
  meta: Record<string, unknown>;
}

export interface CaGenerateResponse {
  game: CaGameId;
  mode: string;
  tickets: CaTicket[];
  disclaimer: string;
}

/**
 * A single historical CA draw, as shipped in apps/web/data/ca-*.json.
 * Variable-length `main` (5/6/7 by game) plus a single bonus — mirrors the way
 * the US side ships static drawings JSON (apps/web/data/powerball.json), so the
 * CA History tab reads in-codebase data and does not depend on the Python backends.
 */
export interface CaDrawingRow {
  draw_date: string;
  main: number[];
  bonus: number;
}

export interface CaDrawingsResponse {
  game: CaGameId;
  total_drawings: number;
  date_range: { start: string; end: string } | null;
  rows: CaDrawingRow[];
}

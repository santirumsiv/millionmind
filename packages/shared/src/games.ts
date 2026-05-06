/**
 * Games registry — Million Mind currently supports two US lotteries with
 * the same 5-whites + 1-special structure but different ranges, schedules,
 * and odds. Tier subscriptions are NOT per-game: one Pro/Elite plan
 * unlocks the algorithms across every game. A game is just a knob that
 * picks the matrix and disclaimer.
 *
 * Adding a third game (Lotto America, EuroMillions, etc.) means adding
 * one entry here — the algorithms and UI read from this registry.
 */

export const GAME_IDS = ["powerball", "megamillions"] as const;
export type GameId = (typeof GAME_IDS)[number];

export interface GameDefinition {
  id: GameId;
  name: string;
  shortName: string;
  whiteMin: number;
  whiteMax: number;
  whiteCount: number;
  specialMin: number;
  specialMax: number;
  specialName: string;
  /** ISO weekday numbers (1=Mon, 7=Sun) when the game draws. */
  drawWeekdays: number[];
  drawTimeEt: string;
  /** Approximate jackpot odds, formatted for display. */
  jackpotOdds: string;
  /** Operator (used in non-affiliation disclaimers). */
  operator: string;
  /** Color accent used for tabs / chips. */
  accent: "gold" | "warn-deep" | "green";
  /** Official lottery website (homepage). */
  officialUrl: string;
  /** Official "past drawings" / "winning numbers" page. */
  officialResultsUrl: string;
  /** API source for auto-refreshing drawings into our DB. */
  apiSource: GameApiSource;
}

/**
 * Configuration for the auto-refresh Edge Function. The NY State Open
 * Data portal hosts SoQL endpoints for several lottery games — same
 * format, different dataset IDs and field names per game.
 */
export interface GameApiSource {
  /** Display label for logs / docs. */
  label: string;
  /** SoQL JSON endpoint URL. */
  endpoint: string;
  /**
   * Field name carrying the date in the response. Always `draw_date`
   * across NY datasets but kept per-game for safety.
   */
  dateField: string;
  /**
   * How the winning numbers are encoded in the response.
   *   - "powerball" — "07 14 23 41 67 11" with the special as the 6th
   *     space-separated value (Powerball's d6yy-54nr dataset).
   *   - "split" — `winning_numbers` is space-separated whites only,
   *     and the special ball lives in its own column (Mega Millions's
   *     5xaw-6ayf dataset has `mega_ball`).
   */
  format: "powerball" | "split";
  /** Field carrying the special ball when `format === "split"`. */
  specialField?: string;
  /** Field carrying the multiplier (Power Play / Megaplier). Optional. */
  multiplierField?: string;
}

export const GAMES: Record<GameId, GameDefinition> = {
  powerball: {
    id: "powerball",
    name: "Powerball",
    shortName: "PB",
    whiteMin: 1,
    whiteMax: 69,
    whiteCount: 5,
    specialMin: 1,
    specialMax: 26,
    specialName: "Powerball",
    drawWeekdays: [1, 3, 6], // Mon, Wed, Sat
    drawTimeEt: "22:59",
    jackpotOdds: "1 in 292,201,338",
    operator: "Multi-State Lottery Association (MUSL)",
    accent: "gold",
    officialUrl: "https://www.powerball.com",
    officialResultsUrl: "https://www.powerball.com/previous-results",
    apiSource: {
      label: "NY State Open Data — Lottery Powerball Winning Numbers: Beginning 2010",
      endpoint: "https://data.ny.gov/resource/d6yy-54nr.json",
      dateField: "draw_date",
      format: "powerball",
      multiplierField: "multiplier",
    },
  },
  megamillions: {
    id: "megamillions",
    name: "Mega Millions",
    shortName: "MM",
    whiteMin: 1,
    whiteMax: 70,
    whiteCount: 5,
    specialMin: 1,
    specialMax: 25, // Was 1-25 from 2017-Apr 2025; today is 1-24. Schema accepts up to 25 to keep historical compat.
    specialName: "Mega Ball",
    drawWeekdays: [2, 5], // Tue, Fri
    drawTimeEt: "23:00",
    jackpotOdds: "1 in 290,472,336",
    operator: "Mega Millions Consortium",
    accent: "warn-deep",
    officialUrl: "https://www.megamillions.com",
    officialResultsUrl:
      "https://www.megamillions.com/Winning-Numbers/Past-Drawings.aspx",
    apiSource: {
      label: "NY State Open Data — Lottery Mega Millions Winning Numbers: Beginning 2002",
      endpoint: "https://data.ny.gov/resource/5xaw-6ayf.json",
      dateField: "draw_date",
      format: "split",
      specialField: "mega_ball",
      multiplierField: "multiplier",
    },
  },
};

export function gameWhiteRange(game: GameId): number[] {
  const g = GAMES[game];
  return Array.from(
    { length: g.whiteMax - g.whiteMin + 1 },
    (_, i) => g.whiteMin + i,
  );
}

export function gameSpecialRange(game: GameId): number[] {
  const g = GAMES[game];
  return Array.from(
    { length: g.specialMax - g.specialMin + 1 },
    (_, i) => g.specialMin + i,
  );
}

/**
 * Game-aware disclaimer. Returns the full block of text that ships in
 * every API response, screen footer, and store listing. Don't strip the
 * jackpot odds — they're the legal anchor.
 */
export function disclaimerFor(game: GameId): string {
  const g = GAMES[game];
  return [
    `Million Mind is a statistical analysis and entertainment application. It does not predict, forecast, or otherwise indicate future ${g.name} drawings. Lottery drawings are independent random events; no algorithm, pattern, or analysis can improve the mathematical probability of winning, which remains ${g.jackpotOdds} for the ${g.name} jackpot regardless of which numbers are selected.`,
    `This application is for entertainment purposes only. Subscription tiers provide access to additional analytical features, visualizations, and generation methods — they do not increase the user's chances of winning any lottery drawing.`,
    `Users must be 18 years of age or older to play. Please play responsibly. If you or someone you know has a gambling problem, call 1-800-GAMBLER or visit ncpgambling.org.`,
  ].join("\n\n");
}

export function shortDisclaimerFor(game: GameId): string {
  return `For entertainment only — ${GAMES[game].name} drawings are independent random events that cannot be predicted.`;
}

export function nonAffiliationFor(game: GameId): string {
  return `Million Mind is not affiliated with, endorsed by, or sponsored by the ${GAMES[game].operator} or any state lottery.`;
}

/**
 * Games on the roadmap that aren't yet integrated. Display-only metadata
 * for the "Coming soon" section on the landing page and demo. When one
 * ships, move its metadata into the live `GAMES` registry above and
 * remove it from this list.
 *
 * `priority`:
 *   "next"  — committed for the immediate post-launch phase
 *   "later" — committed but lower priority
 */
export interface UpcomingGameInfo {
  id: string;
  name: string;
  shortName: string;
  matrix: string;
  drawSchedule: string;
  states: string;
  jackpotOdds: string;
  operator: string;
  tagline: string;
  priority: "next" | "later";
  officialUrl: string;
}

export const UPCOMING_GAMES: UpcomingGameInfo[] = [
  {
    id: "cash4life",
    name: "Cash4Life",
    shortName: "C4L",
    matrix: "5 / 1–60 + 1 / 1–4",
    drawSchedule: "Daily · 9 PM ET",
    states: "10 states (NY, NJ, PA, FL, GA, IN, MD, NC, TN, VA)",
    jackpotOdds: "1 in 21,846,048",
    operator: "Multi-State partnership",
    tagline: "Daily drawings · $1,000/day for life",
    priority: "next",
    officialUrl: "https://nylottery.ny.gov/draw-game?game=cash4life",
  },
  {
    id: "lucky_for_life",
    name: "Lucky for Life",
    shortName: "LFL",
    matrix: "5 / 1–48 + 1 / 1–18",
    drawSchedule: "Daily · 10:38 PM ET",
    states: "26 states + DC",
    jackpotOdds: "1 in 30,821,472",
    operator: "Lucky for Life Group",
    tagline: "Daily drawings · $1,000/day for life",
    priority: "next",
    officialUrl: "https://www.luckyforlife.us",
  },
  {
    id: "lotto_america",
    name: "Lotto America",
    shortName: "LA",
    matrix: "5 / 1–52 + 1 / 1–10",
    drawSchedule: "Mon · Wed · Sat",
    states: "14 states",
    jackpotOdds: "1 in 25,989,600",
    operator: "Multi-State Lottery Association (MUSL)",
    tagline: "Same nights as Powerball, smaller pool",
    priority: "later",
    officialUrl: "https://www.lottoamerica.com",
  },
  {
    id: "superlotto_plus",
    name: "SuperLotto Plus",
    shortName: "SLP",
    matrix: "5 / 1–47 + 1 / 1–27",
    drawSchedule: "Wed · Sat",
    states: "California only",
    jackpotOdds: "1 in 41,416,353",
    operator: "California State Lottery",
    tagline: "California's flagship in-state game",
    priority: "later",
    officialUrl: "https://www.calottery.com/draw-games/superlotto-plus",
  },
];

/**
 * Compute the next drawing date for a given game, starting from `from`.
 */
export function nextDrawing(
  game: GameId,
  from: Date = new Date(),
): { weekday: string; date: string; iso: string } {
  const days = GAMES[game].drawWeekdays;
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

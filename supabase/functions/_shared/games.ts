// Mirror of packages/shared/src/games.ts — Deno-friendly so edge functions
// can resolve white/special ranges per game without external deps.
// If you change one, change the other.

export type GameId = "powerball" | "megamillions";
export const GAME_IDS: GameId[] = ["powerball", "megamillions"];

export interface GameApiSource {
  label: string;
  endpoint: string;
  dateField: string;
  format: "powerball" | "split";
  specialField?: string;
  multiplierField?: string;
}

export interface GameDefinition {
  id: GameId;
  name: string;
  whiteMin: number;
  whiteMax: number;
  whiteCount: number;
  specialMin: number;
  specialMax: number;
  specialName: string;
  drawWeekdays: number[];
  drawTimeEt: string;
  jackpotOdds: string;
  operator: string;
  apiSource: GameApiSource;
}

export const GAMES: Record<GameId, GameDefinition> = {
  powerball: {
    id: "powerball",
    name: "Powerball",
    whiteMin: 1,
    whiteMax: 69,
    whiteCount: 5,
    specialMin: 1,
    specialMax: 26,
    specialName: "Powerball",
    drawWeekdays: [1, 3, 6],
    drawTimeEt: "22:59",
    jackpotOdds: "1 in 292,201,338",
    operator: "Multi-State Lottery Association (MUSL)",
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
    whiteMin: 1,
    whiteMax: 70,
    whiteCount: 5,
    specialMin: 1,
    specialMax: 25,
    specialName: "Mega Ball",
    drawWeekdays: [2, 5],
    drawTimeEt: "23:00",
    jackpotOdds: "1 in 290,472,336",
    operator: "Mega Millions Consortium",
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
  return Array.from({ length: g.whiteMax - g.whiteMin + 1 }, (_, i) => g.whiteMin + i);
}

export function gameSpecialRange(game: GameId): number[] {
  const g = GAMES[game];
  return Array.from({ length: g.specialMax - g.specialMin + 1 }, (_, i) => g.specialMin + i);
}

export function disclaimerFor(game: GameId): string {
  const g = GAMES[game];
  return (
    `Million Mind is a statistical analysis and entertainment application. ` +
    `It does not predict, forecast, or otherwise indicate future ${g.name} drawings. ` +
    `Lottery drawings are independent random events; no algorithm, pattern, or analysis ` +
    `can improve the mathematical probability of winning, which remains ${g.jackpotOdds} ` +
    `for the ${g.name} jackpot regardless of which numbers are selected. ` +
    `This application is for entertainment purposes only.`
  );
}

export function isGameId(value: unknown): value is GameId {
  return typeof value === "string" && GAME_IDS.includes(value as GameId);
}

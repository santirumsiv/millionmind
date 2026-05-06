/**
 * The legal disclaimer that ships in every API response, screen footer,
 * and store listing's first paragraph. Do not edit without legal review.
 *
 * NOTE: For game-specific disclaimer text (with the correct jackpot odds
 * and game name) use `disclaimerFor(game)` from ./games.ts. The constants
 * below are the platform-level / generic copy used on multi-game surfaces
 * like the marketing landing page.
 */
export const DISCLAIMER_FULL = `Million Mind is a statistical analysis and entertainment application. It does not predict, forecast, or otherwise indicate future lottery drawings. Lottery drawings are independent random events; no algorithm, pattern, or analysis can improve the mathematical probability of winning regardless of which numbers are selected.

This application is for entertainment purposes only. Subscription tiers provide access to additional analytical features, visualizations, and generation methods — they do not increase the user's chances of winning any lottery drawing.

Users must be 18 years of age or older to play. Please play responsibly. If you or someone you know has a gambling problem, call 1-800-GAMBLER or visit ncpgambling.org.`;

export const DISCLAIMER_SHORT =
  "For entertainment only — lottery drawings are independent random events that cannot be predicted.";

export const NON_AFFILIATION_DISCLAIMER =
  "Million Mind is not affiliated with, endorsed by, or sponsored by the Multi-State Lottery Association, the Mega Millions Consortium, or any state lottery.";

export const RESPONSIBLE_GAMING_HOTLINE = "1-800-GAMBLER";
export const RESPONSIBLE_GAMING_URL = "https://ncpgambling.org";

export const POWERBALL_JACKPOT_ODDS = "1 in 292,201,338" as const;

/**
 * White balls range 1–69, powerball 1–26.
 */
export const WHITE_BALL_MIN = 1;
export const WHITE_BALL_MAX = 69;
export const POWERBALL_MIN = 1;
export const POWERBALL_MAX = 26;
export const WHITE_BALLS_PER_DRAWING = 5;

/**
 * States to geo-block at signup. Confirm full list with attorney before launch.
 */
export const GEO_BLOCKED_US_STATES = ["UT", "HI"] as const;

/**
 * Powerball drawing schedule (Eastern Time).
 */
export const DRAWING_DAYS = ["MON", "WED", "SAT"] as const;
export const DRAWING_TIME_ET = "22:59";

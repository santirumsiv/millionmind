/**
 * Million Mind design tokens.
 * Same palette consumed by NativeWind (mobile) and Tailwind (web).
 * Aesthetic: financial-analytics, NOT casino. Dark + gold.
 *
 * NOTE: Token values must stay in sync with packages/shared/theme.tokens.cjs,
 * which is consumed by plain-JS tooling (mobile tailwind.config.js, web
 * tailwind.config.ts) that can't import .ts files. Two-way sync — small
 * surface, single source of truth would require a build step we don't need.
 */

export const COLORS = {
  bg: "#0a0e0f",
  bgElevated: "#11171a",
  bgPanel: "#161e22",
  ink: "#e8e4d8",
  inkSoft: "#a8a397",
  inkFaint: "#6b6960",
  gold: "#c9a66b",
  goldBright: "#e8c887",
  goldDeep: "#8a6f3f",
  rule: "#2a3236",
  ruleSoft: "#1a2125",
  warn: "#d4796b",
  warnDeep: "#8a4a3f",
  green: "#7ba87f",
  critical: "#d45b5b",
} as const;
export type ColorToken = keyof typeof COLORS;

export const FONTS = {
  display: "Fraunces",
  body: "Inter Tight",
  mono: "JetBrains Mono",
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 48,
  "3xl": 64,
} as const;

export const RADIUS = {
  none: 0,
  sm: 2,
  md: 4,
  lg: 8,
  xl: 12,
  full: 9999,
} as const;

export const tailwindThemeExtension = {
  colors: {
    bg: COLORS.bg,
    "bg-elevated": COLORS.bgElevated,
    "bg-panel": COLORS.bgPanel,
    ink: COLORS.ink,
    "ink-soft": COLORS.inkSoft,
    "ink-faint": COLORS.inkFaint,
    gold: COLORS.gold,
    "gold-bright": COLORS.goldBright,
    "gold-deep": COLORS.goldDeep,
    rule: COLORS.rule,
    "rule-soft": COLORS.ruleSoft,
    warn: COLORS.warn,
    "warn-deep": COLORS.warnDeep,
    green: COLORS.green,
    critical: COLORS.critical,
  },
  fontFamily: {
    display: [FONTS.display, "Georgia", "serif"],
    body: [FONTS.body, "system-ui", "sans-serif"],
    mono: [FONTS.mono, "ui-monospace", "monospace"],
  },
};

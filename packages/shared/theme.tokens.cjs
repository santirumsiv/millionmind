// Million Mind design tokens, exported as CommonJS so plain-JS tools
// (tailwind config, expo metro config) can require it without a TS loader.
// The TypeScript surface (./src/theme.ts) re-exports these same values.

const COLORS = {
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
};

const FONTS = {
  display: "Fraunces",
  body: "Inter Tight",
  mono: "JetBrains Mono",
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 48,
  "3xl": 64,
};

const RADIUS = {
  none: 0,
  sm: 2,
  md: 4,
  lg: 8,
  xl: 12,
  full: 9999,
};

const tailwindThemeExtension = {
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

module.exports = { COLORS, FONTS, SPACING, RADIUS, tailwindThemeExtension };

const { tailwindThemeExtension } = require("../../packages/shared/theme.tokens.cjs");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: tailwindThemeExtension,
  },
  plugins: [],
};

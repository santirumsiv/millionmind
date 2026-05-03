import type { Config } from "tailwindcss";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { tailwindThemeExtension } = require("../../packages/shared/theme.tokens.cjs") as {
  tailwindThemeExtension: Record<string, unknown>;
};

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: tailwindThemeExtension as never,
  },
  plugins: [],
};

export default config;

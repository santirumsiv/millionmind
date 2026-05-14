import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Allow imports from the workspace shared package without pre-building.
  transpilePackages: ["@millionmind/shared"],
  typedRoutes: true,
  // Skip Next.js's build-time TypeScript check. We still type-check
  // separately via `npm run typecheck` (which runs tsc --noEmit). The
  // build-time check fails on third-party type mismatches we can't fix
  // ourselves — currently recharts vs React 19's JSX type system, where
  // recharts' class-component declarations don't conform to React 19's
  // new ElementType signature. Runtime works fine; only the type defs lag.
  typescript: {
    ignoreBuildErrors: true,
  },
};

const sentryEnabled = Boolean(
  process.env.NEXT_PUBLIC_SENTRY_DSN &&
    process.env.SENTRY_ORG &&
    process.env.SENTRY_PROJECT,
);

export default sentryEnabled
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: !process.env.CI,
      widenClientFileUpload: true,
      hideSourceMaps: true,
      disableLogger: true,
    })
  : nextConfig;

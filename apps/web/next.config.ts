import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Allow imports from the workspace shared package without pre-building.
  transpilePackages: ["@millionmind/shared"],
  typedRoutes: true,
};

export default nextConfig;

// Mirror of packages/shared/src/tiers.ts — kept Deno-friendly so edge
// functions have zero external deps. If you change one, change the other.
//
// Two tiers: free + pro. Pro has two billing variants (monthly $2.99
// and annual $19.99) — both map to the `pro_access` entitlement and
// grant identical access. The user's `tier` column is binary: 'free'
// or 'pro'.

export type TierId = "free" | "pro";

export type AlgorithmId =
  | "random"
  | "hot"
  | "cold"
  | "gap"
  | "pattern"
  | "markov"
  | "monte_carlo"
  | "mixed"
  | "anti_syndication";

export const ALL_ALGORITHMS: AlgorithmId[] = [
  "random",
  "hot",
  "cold",
  "gap",
  "pattern",
  "markov",
  "monte_carlo",
  "mixed",
  "anti_syndication",
];

export const TIER_ALGORITHMS: Record<TierId, readonly AlgorithmId[]> = {
  free: ["random"],
  pro: ALL_ALGORITHMS,
};

/** null = unlimited. Free users earn up to +5 via rewarded ads (handled separately). */
export const TIER_WEEKLY_CAP: Record<TierId, number | null> = {
  free: 10,
  pro: null,
};

export function tierIncludesAlgorithm(
  tier: TierId,
  algorithm: AlgorithmId,
): boolean {
  return TIER_ALGORITHMS[tier].includes(algorithm);
}

export function minimumTierFor(algorithm: AlgorithmId): TierId {
  return algorithm === "random" ? "free" : "pro";
}

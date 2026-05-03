// Mirror of packages/shared/src/tiers.ts — kept Deno-friendly so edge functions
// have zero external deps. If you change one, change the other.

export type TierId = "free" | "starter" | "pro" | "elite";

export type AlgorithmId =
  | "random"
  | "hot"
  | "cold"
  | "gap"
  | "pattern"
  | "markov"
  | "monte_carlo";

export const TIER_ALGORITHMS: Record<TierId, readonly AlgorithmId[]> = {
  free: ["random"],
  starter: ["random", "hot", "cold"],
  pro: ["random", "hot", "cold", "gap", "pattern"],
  elite: ["random", "hot", "cold", "gap", "pattern", "markov", "monte_carlo"],
};

export const TIER_WEEKLY_CAP: Record<TierId, number | null> = {
  free: 3,
  starter: 10,
  pro: 50,
  elite: null, // unlimited
};

export function tierIncludesAlgorithm(
  tier: TierId,
  algorithm: AlgorithmId,
): boolean {
  return TIER_ALGORITHMS[tier].includes(algorithm);
}

export function minimumTierFor(algorithm: AlgorithmId): TierId {
  if (algorithm === "random") return "free";
  if (algorithm === "hot" || algorithm === "cold") return "starter";
  if (algorithm === "gap" || algorithm === "pattern") return "pro";
  return "elite";
}

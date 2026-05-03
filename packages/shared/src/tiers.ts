import type { AlgorithmId } from "./algorithms";

export const TIER_IDS = ["free", "starter", "pro", "elite"] as const;
export type TierId = (typeof TIER_IDS)[number];

export interface TierDefinition {
  id: TierId;
  name: string;
  tag: string;
  priceMonthlyUsd: number;
  algorithms: readonly AlgorithmId[];
  weeklyGenerationCap: number | "unlimited";
  features: readonly string[];
  revenueCatEntitlement: string | null;
  productIdIos: string | null;
  productIdAndroid: string | null;
}

export const TIERS: Record<TierId, TierDefinition> = {
  free: {
    id: "free",
    name: "Explorer",
    tag: "Free",
    priceMonthlyUsd: 0,
    algorithms: ["random"],
    weeklyGenerationCap: 3,
    features: [
      "3 random combinations weekly",
      "Basic frequency chart",
      "Last 10 drawings view",
    ],
    revenueCatEntitlement: null,
    productIdIos: null,
    productIdAndroid: null,
  },
  starter: {
    id: "starter",
    name: "Analyst",
    tag: "Starter",
    priceMonthlyUsd: 7.99,
    algorithms: ["random", "hot", "cold"],
    weeklyGenerationCap: 10,
    features: [
      "10 frequency-weighted combinations weekly",
      "Hot & cold number dashboard",
      "1 year of historical data",
      "Personal pick history",
    ],
    revenueCatEntitlement: "starter_access",
    productIdIos: "millionmind_starter_monthly",
    productIdAndroid: "millionmind_starter_monthly",
  },
  pro: {
    id: "pro",
    name: "Strategist",
    tag: "Pro",
    priceMonthlyUsd: 19.99,
    algorithms: ["random", "hot", "cold", "gap", "pattern"],
    weeklyGenerationCap: 50,
    features: [
      "50 combinations weekly across multiple algorithms",
      "Gap analysis & pattern-balanced generators",
      "Full historical database (since 2010)",
      "Custom filters: sum range, odd/even ratio",
      "CSV export, pre-drawing email digest",
    ],
    revenueCatEntitlement: "pro_access",
    productIdIos: "millionmind_pro_monthly",
    productIdAndroid: "millionmind_pro_monthly",
  },
  elite: {
    id: "elite",
    name: "Data Scientist",
    tag: "Elite",
    priceMonthlyUsd: 39.99,
    algorithms: [
      "random",
      "hot",
      "cold",
      "gap",
      "pattern",
      "markov",
      "monte_carlo",
    ],
    weeklyGenerationCap: "unlimited",
    features: [
      "Unlimited combinations",
      "Markov chain & Monte Carlo (10K iterations) algorithms",
      "Interactive heatmaps and full visualization suite",
      "Custom algorithm builder — mix your own weights",
      "Drawing-night live dashboard",
    ],
    revenueCatEntitlement: "elite_access",
    productIdIos: "millionmind_elite_monthly",
    productIdAndroid: "millionmind_elite_monthly",
  },
};

export const TIER_ORDER: readonly TierId[] = ["free", "starter", "pro", "elite"];

export function tierIncludesAlgorithm(
  tier: TierId,
  algorithm: AlgorithmId,
): boolean {
  return TIERS[tier].algorithms.includes(algorithm);
}

export function compareTiers(a: TierId, b: TierId): number {
  return TIER_ORDER.indexOf(a) - TIER_ORDER.indexOf(b);
}

export function tierAtLeast(tier: TierId, minimum: TierId): boolean {
  return compareTiers(tier, minimum) >= 0;
}

export function isUnlimited(tier: TierId): boolean {
  return TIERS[tier].weeklyGenerationCap === "unlimited";
}

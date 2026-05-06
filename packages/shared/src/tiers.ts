import type { AlgorithmId } from "./algorithms";
import { ALGORITHM_IDS } from "./algorithms";

export const TIER_IDS = ["free", "pro"] as const;
export type TierId = (typeof TIER_IDS)[number];

/**
 * Pro is a single tier with two billing variants (monthly + annual).
 * The user's `tier` column is binary (free / pro); the variant is
 * recorded separately for analytics but doesn't affect access.
 */
export const PRO_BILLING_VARIANTS = ["monthly", "annual"] as const;
export type ProBillingVariant = (typeof PRO_BILLING_VARIANTS)[number];

export interface TierDefinition {
  id: TierId;
  name: string;
  tag: string;
  priceMonthlyUsd: number;
  algorithms: readonly AlgorithmId[];
  weeklyGenerationCap: number | "unlimited";
  features: readonly string[];
  /** Locked features the user can see but not use (drives upgrade UI). */
  lockedFeatures: readonly string[];
  revenueCatEntitlement: string | null;
  /** Bonus generations a free user can earn per week by watching ads. */
  rewardedAdBonusCap: number;
  /** Show ads to this tier? */
  showsAds: boolean;
}

export interface ProBillingDefinition {
  variant: ProBillingVariant;
  priceUsd: number;
  monthlyEquivalentUsd: number;
  /** Discount vs. paying monthly for 12 months. */
  savingsPct: number | null;
  productIdIos: string;
  productIdAndroid: string;
  productIdWeb: string | null;
}

export const PRO_BILLING: Record<ProBillingVariant, ProBillingDefinition> = {
  monthly: {
    variant: "monthly",
    priceUsd: 2.99,
    monthlyEquivalentUsd: 2.99,
    savingsPct: null,
    productIdIos: "millionmind_pro_monthly",
    productIdAndroid: "millionmind_pro_monthly",
    productIdWeb: null,
  },
  annual: {
    variant: "annual",
    priceUsd: 19.99,
    monthlyEquivalentUsd: 19.99 / 12,
    savingsPct: Math.round((1 - 19.99 / (2.99 * 12)) * 100), // ≈44%
    productIdIos: "millionmind_pro_annual",
    productIdAndroid: "millionmind_pro_annual",
    productIdWeb: null,
  },
};

export const TIERS: Record<TierId, TierDefinition> = {
  free: {
    id: "free",
    name: "Explorer",
    tag: "Free",
    priceMonthlyUsd: 0,
    algorithms: ["random"],
    weeklyGenerationCap: 10,
    features: [
      "10 random combinations weekly across both games",
      "Watch a short ad to unlock 5 extra generations per week",
      "Basic white-ball frequency heatmap",
      "Top 5 hot & overdue numbers",
      "Last 30 drawings",
    ],
    lockedFeatures: [
      "8 advanced algorithms (Hot, Cold, Gap, Pattern, Markov, Monte Carlo, Mixed, Anti-Syndication)",
      "Unlimited generations",
      "Pairs & co-occurrence trends",
      "Sum distribution chart",
      "Full historical database (1,800+ Powerball, 890+ Mega Millions)",
      "CSV export",
      "Drawing-night reminders",
      "Ad-free experience",
    ],
    rewardedAdBonusCap: 5,
    showsAds: true,
    revenueCatEntitlement: null,
  },
  pro: {
    id: "pro",
    name: "Pro",
    tag: "Pro",
    priceMonthlyUsd: 2.99,
    algorithms: [...ALGORITHM_IDS], // all 9
    weeklyGenerationCap: "unlimited",
    features: [
      "All 9 algorithms across Powerball + Mega Millions",
      "Unlimited generations every week",
      "Full historical database (since 2010 PB, 2017 MM)",
      "Pairs & co-occurrence trends",
      "Sum distribution chart, full heatmaps, sweet-spot analysis",
      "CSV export of your generations and historical drawings",
      "Drawing-night push reminders",
      "Ad-free",
    ],
    lockedFeatures: [],
    rewardedAdBonusCap: 0,
    showsAds: false,
    revenueCatEntitlement: "pro_access",
  },
};

export const TIER_ORDER: readonly TierId[] = ["free", "pro"];

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

export function minimumTierFor(algorithm: AlgorithmId): TierId {
  return algorithm === "random" ? "free" : "pro";
}

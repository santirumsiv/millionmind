export const ALGORITHM_IDS = [
  "random",
  "hot",
  "cold",
  "gap",
  "pattern",
  "markov",
  "monte_carlo",
] as const;

export type AlgorithmId = (typeof ALGORITHM_IDS)[number];

export interface AlgorithmDefinition {
  id: AlgorithmId;
  name: string;
  shortDescription: string;
  longDescription: string;
}

export const ALGORITHMS: Record<AlgorithmId, AlgorithmDefinition> = {
  random: {
    id: "random",
    name: "Random",
    shortDescription: "Pure random sampling.",
    longDescription:
      "Selects 5 white balls (1–69) and 1 powerball (1–26) uniformly at random. The mathematical baseline — no historical signal applied.",
  },
  hot: {
    id: "hot",
    name: "Hot Numbers",
    shortDescription: "Frequency-weighted toward most-drawn numbers.",
    longDescription:
      "Reads the historical frequency cache and weights selection probability proportionally to how often each number has appeared. Surfaces the numbers with the deepest historical presence.",
  },
  cold: {
    id: "cold",
    name: "Cold Numbers",
    shortDescription: "Inverse weighting; favors rarely-drawn numbers.",
    longDescription:
      "The complement of Hot — selection weighting is inversely proportional to historical frequency. Highlights numbers with sparse appearances in the dataset.",
  },
  gap: {
    id: "gap",
    name: "Gap Analysis",
    shortDescription: "'Overdue' numbers based on days since last draw.",
    longDescription:
      "Weight = gap_days^1.5. Surfaces numbers that have not been drawn for unusually long stretches. Pure analytics — does not affect probability of future draws.",
  },
  pattern: {
    id: "pattern",
    name: "Pattern-Balanced",
    shortDescription: "Generates combos matching balanced statistical patterns.",
    longDescription:
      "Generates random combinations and accepts only those whose sum lies within 100–220, contain 2–3 odd numbers, and 2–3 numbers in the lower half (1–34). Up to 1000 retry attempts before relaxing.",
  },
  markov: {
    id: "markov",
    name: "Markov Chain",
    shortDescription: "Transition-matrix-based sequential analysis.",
    longDescription:
      "Builds a transition matrix from the historical drawings table — P(number X | number Y appeared in the previous draw) — and uses the most recent drawing as state to sample subsequent candidates.",
  },
  monte_carlo: {
    id: "monte_carlo",
    name: "Monte Carlo Ensemble",
    shortDescription: "10,000-candidate scoring across balance criteria.",
    longDescription:
      "Generates 10,000 candidate combinations and scores each on multiple balance criteria — sum range (1.0), odd/even balance (0.8), high/low balance (0.8), spread > 30 (0.5), no consecutive triples (0.3). Returns the highest-scoring candidate.",
  },
};

export function isAlgorithmId(value: unknown): value is AlgorithmId {
  return (
    typeof value === "string" &&
    (ALGORITHM_IDS as readonly string[]).includes(value)
  );
}

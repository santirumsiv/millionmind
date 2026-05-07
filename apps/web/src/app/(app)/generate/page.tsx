"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ALGORITHMS,
  ALGORITHM_IDS,
  TIERS,
  type AlgorithmId,
  type GenerationResult,
  tierIncludesAlgorithm,
} from "@millionmind/shared";
import { generateNumbers, ApiCallError } from "@/lib/api";
import { useProfile, tierLabel } from "@/lib/queries";
import { PowerballRow } from "@/components/PowerballRow";
import { track, trackFirstGenerationOnce } from "@/lib/analytics";

export default function GeneratePage() {
  const { data: profile } = useProfile();
  const tier = profile?.tier ?? "free";
  const [active, setActive] = useState<AlgorithmId>("random");
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onGenerate() {
    setPending(true);
    setError(null);
    setResult(null);
    track({
      name: "generation_requested",
      algorithm: active,
      game: "powerball",
      set_count: 1,
      tier,
    });
    try {
      const res = await generateNumbers(active);
      setResult(res);
      if (profile?.id) {
        trackFirstGenerationOnce(profile.id, active, "powerball");
      }
    } catch (e) {
      if (e instanceof ApiCallError) {
        setError(e.detail.message);
      } else {
        setError("Generation failed. Please try again.");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="space-y-10">
      <section>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold mb-3">
          § Generate
        </p>
        <h1 className="font-display text-[44px] leading-[1.05] text-ink mb-3">
          Pick an algorithm.
        </h1>
        <p className="text-ink-soft text-[15px] leading-relaxed max-w-[60ch]">
          Higher tiers unlock more sophisticated analytical methods. Each is for entertainment and exploration; none change the mathematical odds of winning.
        </p>
      </section>

      <section className="grid md:grid-cols-2 gap-3">
        {ALGORITHM_IDS.map((id) => {
          const algo = ALGORITHMS[id];
          const unlocked = tierIncludesAlgorithm(tier, id);
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                if (unlocked) {
                  setActive(id);
                } else {
                  track({
                    name: "tier_locked_hit",
                    feature: "algorithm_card",
                    attempted_algorithm: id,
                  });
                }
              }}
              className={`text-left p-5 border transition-colors ${
                isActive
                  ? "border-gold bg-bg-panel"
                  : unlocked
                    ? "border-rule bg-bg-elevated hover:border-gold-deep"
                    : "border-rule-soft bg-bg-elevated opacity-50 cursor-not-allowed"
              }`}
              aria-pressed={isActive}
              aria-disabled={!unlocked}
            >
              <div className="flex items-baseline justify-between gap-3 mb-1">
                <span className="font-display text-[20px] text-ink leading-tight">
                  {algo.name}
                </span>
                {!unlocked && (
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-faint">
                    Upgrade
                  </span>
                )}
              </div>
              <p className="text-ink-soft text-sm leading-relaxed">
                {algo.shortDescription}
              </p>
            </button>
          );
        })}
      </section>

      <section className="border border-rule bg-bg-elevated p-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold mb-3">
          Selected: {ALGORITHMS[active].name}
        </p>

        <button
          type="button"
          onClick={onGenerate}
          disabled={pending || !tierIncludesAlgorithm(tier, active)}
          className="w-full bg-gold text-bg font-mono text-[12px] uppercase tracking-[0.25em] py-5 hover:bg-gold-bright disabled:opacity-50 transition-colors"
        >
          {pending ? "Generating…" : "Generate"}
        </button>

        {error ? (
          <div className="mt-6 border border-warn bg-bg p-4">
            <p className="text-warn text-sm">{error}</p>
            {error.toLowerCase().includes("tier") && (
              <Link
                href="/account"
                className="inline-block mt-2 font-mono text-[10px] uppercase tracking-[0.15em] text-gold hover:text-gold-bright"
              >
                Upgrade your tier →
              </Link>
            )}
          </div>
        ) : null}

        {result ? (
          <div className="mt-8 space-y-4">
            <div className="flex justify-center py-6">
              <PowerballRow
                whiteBalls={result.white_balls}
                powerball={result.powerball}
                size="lg"
              />
            </div>
            <div className="text-center">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">
                {ALGORITHMS[result.algorithm].name}
              </p>
              <p className="font-mono text-[10px] tracking-[0.15em] text-ink-faint mt-1">
                {result.remaining_this_week === "unlimited"
                  ? "Unlimited remaining"
                  : `${result.remaining_this_week} remaining this week`}
              </p>
            </div>
            <p className="text-ink-faint text-[11px] leading-relaxed text-center max-w-[55ch] mx-auto pt-4 border-t border-rule">
              {result.disclaimer}
            </p>
          </div>
        ) : null}
      </section>

      <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-faint text-center">
        Tier: {tierLabel(tier)} · Weekly cap: {String(TIERS[tier].weeklyGenerationCap)}
      </p>
    </main>
  );
}

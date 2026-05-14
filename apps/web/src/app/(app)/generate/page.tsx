"use client";

import { useState } from "react";
import {
  ALGORITHMS,
  ALGORITHM_IDS,
  GAMES,
  GAME_IDS,
  type AlgorithmId,
  type GameId,
} from "@millionmind/shared";
import {
  ApiCallError,
  appendLocalHistory,
  useAdGrant,
  useGenerate,
  useQuota,
} from "@/lib/queries";
import { track, trackFirstGenerationOnce } from "@/lib/analytics";
import { PowerballRow } from "@/components/PowerballRow";

const PREMIUM_ALGORITHMS = new Set<AlgorithmId>([
  "hot",
  "cold",
  "gap",
  "pattern",
  "markov",
  "monte_carlo",
  "mixed",
  "anti_syndication",
]);

export default function GeneratePage() {
  const [game, setGame] = useState<GameId>("powerball");
  const [active, setActive] = useState<AlgorithmId>("random");
  const [error, setError] = useState<string | null>(null);

  const { data: quota } = useQuota();
  const generate = useGenerate();
  const adGrant = useAdGrant();

  const isPremium = PREMIUM_ALGORITHMS.has(active);
  const result = generate.data;

  async function onGenerate() {
    setError(null);
    track({ name: "generation_requested", algorithm: active, game, premium: isPremium });
    try {
      const res = await generate.mutateAsync({ algorithm: active, game });
      appendLocalHistory({
        algorithm: res.algorithm,
        game: res.game,
        white_balls: res.white_balls,
        powerball: res.powerball,
        generated_at: res.generated_at,
      });
      trackFirstGenerationOnce(res.algorithm, res.game);
    } catch (e) {
      if (e instanceof ApiCallError) {
        setError(e.detail.message);
        if (e.detail.code === "RATE_LIMITED") track({ name: "quota_exhausted" });
        if (e.detail.code === "PREMIUM_REQUIRED")
          track({ name: "premium_required", algorithm: active });
      } else {
        setError("Generation failed. Please try again.");
      }
    }
  }

  async function onWatchAd() {
    setError(null);
    track({ name: "ad_view_started" });
    // TODO: when H5 Game Ads / AdSense Rewarded is approved, replace this
    // with the real ad network's `show()` + completion callback. For now
    // we trust the client signal — the server still caps grants at 5/hour.
    await new Promise((r) => setTimeout(r, 800));
    track({ name: "ad_view_completed" });
    try {
      await adGrant.mutateAsync();
    } catch (e) {
      if (e instanceof ApiCallError && e.detail.code === "GRANT_CAP_REACHED") {
        track({ name: "grant_cap_reached" });
        setError(e.detail.message);
      } else {
        setError("Ad grant failed. Please try again.");
      }
    }
  }

  const canGenerate = isPremium
    ? (quota?.premium_uses ?? 0) > 0
    : (quota?.free_remaining ?? 0) > 0;

  // Dispatcher for the main CTA button. If the user is on a premium
  // algorithm with no premium uses left, route the click to the ad flow
  // instead of being a dead button.
  async function onPrimaryCta() {
    if (canGenerate) {
      await onGenerate();
    } else if (isPremium) {
      await onWatchAd();
    }
  }

  const ctaBusy = generate.isPending || adGrant.isPending;
  const ctaLabel = adGrant.isPending
    ? "Loading ad…"
    : generate.isPending
      ? "Generating…"
      : canGenerate
        ? "Generate"
        : isPremium
          ? "▶ Watch ad → +3 premium uses"
          : "Free quota reached — wait or pick a premium algorithm";
  // Disabled only when no useful click can fire (free quota empty AND
  // not on a premium algo) or already busy. The premium-locked case is
  // clickable — it triggers the ad.
  const ctaDisabled = ctaBusy || (!canGenerate && !isPremium);

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
          Free random generations are capped at 5 per 5-minute window. Watch a rewarded ad to unlock 3 premium algorithm uses. None of these change the mathematical odds of winning.
        </p>
      </section>

      {/* Game switcher */}
      <section className="flex gap-2">
        {GAME_IDS.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGame(g)}
            className={`px-4 py-2 border font-mono text-[10px] uppercase tracking-[0.2em] transition-colors ${
              game === g
                ? "border-gold bg-bg-panel text-gold"
                : "border-rule bg-bg-elevated text-ink-soft hover:border-gold-deep"
            }`}
          >
            {GAMES[g].name}
          </button>
        ))}
      </section>

      {/* Quota strip */}
      <section className="border border-rule bg-bg-elevated p-4 flex flex-wrap items-center gap-x-6 gap-y-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
          Free this 5-min: <span className="text-ink">{quota?.free_remaining ?? "—"}/5</span>
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
          Premium uses left: <span className="text-gold">{quota?.premium_uses ?? "—"}</span>
        </span>
        <button
          type="button"
          onClick={onWatchAd}
          disabled={adGrant.isPending}
          className="ml-auto bg-gold text-bg font-mono text-[10px] uppercase tracking-[0.2em] px-4 py-2 hover:bg-gold-bright disabled:opacity-50 transition-colors"
        >
          {adGrant.isPending ? "Loading ad…" : "▶ Watch ad → +3 premium"}
        </button>
      </section>

      {/* Algorithm grid */}
      <section className="grid md:grid-cols-2 gap-3">
        {ALGORITHM_IDS.map((id) => {
          const algo = ALGORITHMS[id];
          const isActive = active === id;
          const premium = PREMIUM_ALGORITHMS.has(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActive(id)}
              className={`text-left p-5 border transition-colors ${
                isActive
                  ? "border-gold bg-bg-panel"
                  : "border-rule bg-bg-elevated hover:border-gold-deep"
              }`}
              aria-pressed={isActive}
            >
              <div className="flex items-baseline justify-between gap-3 mb-1">
                <span className="font-display text-[20px] text-ink leading-tight">
                  {algo.name}
                </span>
                {premium ? (
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-gold border border-gold-deep px-2 py-0.5">
                    🔒 Ad-gated
                  </span>
                ) : null}
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
          onClick={onPrimaryCta}
          disabled={ctaDisabled}
          className="w-full bg-gold text-bg font-mono text-[12px] uppercase tracking-[0.25em] py-5 hover:bg-gold-bright disabled:opacity-50 transition-colors"
        >
          {ctaLabel}
        </button>

        {error ? (
          <div className="mt-6 border border-warn bg-bg p-4">
            <p className="text-warn text-sm">{error}</p>
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
                {ALGORITHMS[result.algorithm].name} · {GAMES[result.game].name}
              </p>
            </div>
            <p className="text-ink-faint text-[11px] leading-relaxed text-center max-w-[55ch] mx-auto pt-4 border-t border-rule">
              {result.disclaimer}
            </p>
          </div>
        ) : null}
      </section>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ALGORITHMS,
  ALGORITHM_IDS,
  GAMES,
  GAME_IDS,
  PRO_BILLING,
  TIERS,
  UPCOMING_GAMES,
  computeStats,
  computeSweetSpot,
  computeTopPairs,
  disclaimerFor,
  generate,
  tierIncludesAlgorithm,
  type AlgorithmId,
  type Combination,
  type DrawingRow,
  type GameId,
  type NumberStat,
  type TierId,
} from "@millionmind/shared";
import { Heatmap } from "@/components/Heatmap";
import { PowerballRow } from "@/components/PowerballRow";
import { fetchDemoDrawings } from "@/lib/demo-data";

type Tab = "generate" | "analysis" | "pairs";
const SET_COUNTS = [1, 3, 5, 8, 10] as const;

interface DemoResult extends Combination {
  algorithm: AlgorithmId;
  game: GameId;
  generated_at: string;
}

export default function DemoPage() {
  const [tier, setTier] = useState<TierId>("pro");
  const [game, setGame] = useState<GameId>("powerball");
  const [drawings, setDrawings] = useState<DrawingRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("generate");
  const [active, setActive] = useState<AlgorithmId>("mixed");
  const [setCount, setSetCount] = useState<number>(3);
  const [results, setResults] = useState<DemoResult[]>([]);
  const [generating, setGenerating] = useState(false);

  // When previewing Free, force the algorithm and set count into the
  // allowed range so users see the realistic experience.
  useEffect(() => {
    if (tier === "free") {
      if (!tierIncludesAlgorithm("free", active)) setActive("random");
      const cap = TIERS.free.weeklyGenerationCap;
      if (typeof cap === "number" && setCount > cap) setSetCount(cap);
    }
  }, [tier, active, setCount]);

  // Re-load drawings whenever the game changes.
  useEffect(() => {
    setDrawings(null);
    setResults([]);
    setLoadError(null);
    fetchDemoDrawings(game)
      .then(setDrawings)
      .catch((e) => setLoadError(e.message));
  }, [game]);

  const stats: NumberStat[] = useMemo(
    () => (drawings ? computeStats(drawings, game) : []),
    [drawings, game],
  );

  const whitesByFreq = useMemo(
    () =>
      stats
        .filter((s) => s.ball_type === "white")
        .sort((a, b) => b.frequency - a.frequency),
    [stats],
  );
  const whitesByGap = useMemo(
    () =>
      stats
        .filter((s) => s.ball_type === "white")
        .sort((a, b) => (b.gap_days ?? 0) - (a.gap_days ?? 0)),
    [stats],
  );
  const top5Hot = whitesByFreq.slice(0, 5).map((s) => s.number);
  const top5Overdue = whitesByGap.slice(0, 5).map((s) => s.number);
  const sweetSpot = useMemo(() => computeSweetSpot(drawings ?? []), [drawings]);

  const hot10 = whitesByFreq.slice(0, 10).map((s) => ({ n: s.number, freq: s.frequency }));
  const cold10 = whitesByFreq
    .slice(-10)
    .reverse()
    .map((s) => ({ n: s.number, freq: s.frequency }));
  const sumStats = useMemo(() => computeSumStats(drawings ?? []), [drawings]);
  const sumDistribution = useMemo(
    () => computeSumDistribution(drawings ?? []),
    [drawings],
  );
  const topPairs = useMemo(
    () => (drawings ? computeTopPairs(drawings, 25) : []),
    [drawings],
  );

  function onGenerate() {
    if (!drawings) return;
    setGenerating(true);
    setTimeout(() => {
      const next: DemoResult[] = [];
      for (let i = 0; i < setCount; i++) {
        const combo = generate(active, { game, stats, drawings });
        next.push({
          ...combo,
          algorithm: active,
          game,
          generated_at: new Date().toISOString(),
        });
      }
      setResults(next);
      setGenerating(false);
    }, 0);
  }

  const gameDef = GAMES[game];

  if (loadError) {
    return (
      <main className="page-content max-w-3xl mx-auto px-6 py-24">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-warn mb-3">
          Error
        </p>
        <h1 className="font-display text-[36px] leading-[1.05] text-ink mb-6">
          Couldn&apos;t load drawings.
        </h1>
        <p className="text-ink-soft">{loadError}</p>
      </main>
    );
  }

  const tierDef = TIERS[tier];
  const setCountOptions =
    tier === "free"
      ? SET_COUNTS.filter((n) => n <= (TIERS.free.weeklyGenerationCap as number))
      : SET_COUNTS;

  return (
    <main className="page-content max-w-[1180px] mx-auto px-6 md:px-12 py-10">
      <header className="flex items-center justify-between border-b border-rule pb-5 mb-8 gap-4 flex-wrap">
        <Link
          href="/"
          className="font-mono text-[12px] tracking-[0.28em] uppercase text-gold font-medium"
        >
          ◆ Million Mind
        </Link>

        {/* Plan preview toggle */}
        <div className="inline-flex border border-rule">
          <button
            type="button"
            onClick={() => setTier("free")}
            className={`px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors ${
              tier === "free"
                ? "bg-rule text-ink"
                : "text-ink-soft hover:text-ink"
            }`}
            aria-pressed={tier === "free"}
          >
            Preview · Free
          </button>
          <button
            type="button"
            onClick={() => setTier("pro")}
            className={`px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors ${
              tier === "pro"
                ? "bg-gold text-bg"
                : "text-ink-soft hover:text-ink"
            }`}
            aria-pressed={tier === "pro"}
          >
            Preview · Pro
          </button>
        </div>
      </header>

      {/* ───── Tier banner ───── */}
      {tier === "free" ? (
        <div className="border border-rule bg-bg-elevated px-5 py-4 mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint mb-1">
              You&apos;re previewing the Free tier
            </p>
            <p className="text-ink-soft text-sm">
              Random algorithm only · 10 generations / week across both games · Watch ads for up to 5 extra
            </p>
          </div>
          <Link
            href="/sign-up"
            className="bg-gold text-bg font-mono text-[10px] uppercase tracking-[0.2em] px-5 py-3 hover:bg-gold-bright transition-colors whitespace-nowrap"
          >
            Unlock Pro · ${TIERS.pro.priceMonthlyUsd.toFixed(2)}/mo
          </Link>
        </div>
      ) : (
        <div className="border border-gold-deep bg-bg-panel/40 px-5 py-3 mb-8 flex flex-wrap items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">
            Pro preview
          </span>
          <span className="text-ink-soft text-sm">
            All 9 algorithms unlocked across both games · unlimited generations · no ads. ${PRO_BILLING.monthly.priceUsd}/mo or ${PRO_BILLING.annual.priceUsd}/yr (save {PRO_BILLING.annual.savingsPct}%).
          </span>
        </div>
      )}

      {/* ───── Game switcher ───── */}
      <section className="mb-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint mb-3">
          Choose game
        </p>
        <div className="flex gap-2 flex-wrap">
          {GAME_IDS.map((id) => {
            const g = GAMES[id];
            const isActive = game === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setGame(id)}
                className={`px-5 py-3 border transition-colors flex flex-col items-start gap-0.5 min-w-[180px] ${
                  isActive
                    ? "border-gold bg-bg-panel ring-1 ring-gold"
                    : "border-rule bg-bg-elevated hover:border-gold-deep"
                }`}
                aria-pressed={isActive}
              >
                <span className="font-display text-[18px] text-ink leading-tight">
                  {g.name}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-faint">
                  5/{g.whiteMax} + 1/{g.specialMax} · {g.drawWeekdays.length}× weekly
                </span>
              </button>
            );
          })}
        </div>

        {/* Coming-soon strip */}
        <div className="mt-5 border-t border-rule-soft pt-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint mb-3">
            Coming soon
          </p>
          <div className="flex gap-2 flex-wrap">
            {UPCOMING_GAMES.map((g) => (
              <div
                key={g.id}
                title={`${g.tagline} · ${g.states}`}
                className={`px-4 py-2 border flex flex-col items-start gap-0.5 min-w-[180px] opacity-60 cursor-default ${
                  g.priority === "next"
                    ? "border-gold-deep bg-bg-elevated/40"
                    : "border-rule bg-bg-elevated/30"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-display text-[15px] text-ink-soft leading-tight">
                    {g.name}
                  </span>
                  <span
                    className={`font-mono text-[8px] uppercase tracking-[0.2em] px-1.5 py-0.5 ${
                      g.priority === "next"
                        ? "text-gold border border-gold-deep"
                        : "text-ink-faint border border-rule"
                    }`}
                  >
                    {g.priority === "next" ? "Up Next" : "Soon"}
                  </span>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-faint">
                  {g.matrix.replace(/ /g, "")} · {g.drawSchedule.split(" ·")[0]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Hero + summary stats banner ───── */}
      <section className="mb-10">
        <div className="grid md:grid-cols-[1fr_auto] gap-8 items-end">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold mb-3">
              ◆ {gameDef.name} advisor
            </p>
            <h1 className="font-display text-[clamp(36px,4.5vw,52px)] leading-[1.05] text-ink mb-2">
              Statistical analysis
            </h1>
            <p className="font-mono text-[12px] tracking-wide text-ink-soft">
              {drawings
                ? `${drawings.length} drawings · ${drawings[0]?.draw_date} → ${drawings.at(-1)?.draw_date}`
                : "loading…"}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <StatCard
              label="Sweet Spot"
              accent="gold"
              value={drawings ? `${sweetSpot.low}–${sweetSpot.high}` : "—"}
            />
            <StatCard
              label="Hot #s"
              accent="warn"
              value={drawings ? top5Hot.join(" · ") : "—"}
            />
            <StatCard
              label="Overdue"
              accent="green"
              value={drawings ? top5Overdue.join(" · ") : "—"}
            />
          </div>
        </div>
      </section>

      {/* ───── Tabs ───── */}
      <nav className="flex gap-2 border-b border-rule mb-10 overflow-x-auto">
        <TabButton current={tab} value="generate" onSelect={setTab}>
          🎯 Generate Numbers
        </TabButton>
        <TabButton current={tab} value="analysis" onSelect={setTab}>
          📊 Analysis
        </TabButton>
        <TabButton current={tab} value="pairs" onSelect={setTab}>
          🔗 Pairs &amp; Trends
        </TabButton>
      </nav>

      {/* ───── GENERATE TAB ───── */}
      {tab === "generate" ? (
        <section className="space-y-8">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint mb-4">
              Choose a strategy
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ALGORITHM_IDS.map((id) => {
                const algo = ALGORITHMS[id];
                const isActive = active === id;
                const unlocked = tierIncludesAlgorithm(tier, id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => unlocked && setActive(id)}
                    disabled={!unlocked}
                    className={`text-left p-5 border transition-all relative ${
                      !unlocked
                        ? "border-rule-soft bg-bg-elevated/40 opacity-60 cursor-not-allowed"
                        : isActive
                          ? "border-gold bg-bg-panel ring-1 ring-gold"
                          : "border-rule bg-bg-elevated hover:border-gold-deep"
                    }`}
                    aria-pressed={isActive}
                    aria-disabled={!unlocked}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="font-display text-[18px] text-ink leading-tight">
                        {ALGO_ICON[id] ?? "◆"} {algo.name}
                      </div>
                      {!unlocked ? (
                        <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-gold border border-gold-deep px-2 py-0.5 whitespace-nowrap">
                          🔒 Pro
                        </span>
                      ) : null}
                    </div>
                    <p className="text-ink-soft text-[13px] leading-relaxed">
                      {algo.shortDescription}
                    </p>
                  </button>
                );
              })}
            </div>

            {tier === "free" ? (
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-faint mt-4">
                🔒 8 advanced algorithms unlock with Pro · ${TIERS.pro.priceMonthlyUsd.toFixed(2)}/mo
              </p>
            ) : null}
          </div>

          <div className="border border-rule bg-bg-elevated p-6">
            <div className="flex flex-wrap items-center gap-6 mb-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
                Number of sets
              </span>
              <div className="flex gap-2">
                {SET_COUNTS.map((n) => {
                  const allowed = setCountOptions.includes(n);
                  return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => allowed && setSetCount(n)}
                    disabled={!allowed}
                    className={`w-10 h-10 border font-mono text-[13px] transition-colors ${
                      !allowed
                        ? "border-rule-soft text-ink-faint opacity-40 cursor-not-allowed"
                        : setCount === n
                          ? "border-gold bg-gold text-bg"
                          : "border-rule text-ink-soft hover:border-gold-deep"
                    }`}
                    aria-pressed={setCount === n}
                  >
                    {n}
                  </button>
                  );
                })}
              </div>
              {tier === "free" ? (
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-faint">
                  Free cap: 10/wk total
                </span>
              ) : null}
            </div>

            <button
              type="button"
              onClick={onGenerate}
              disabled={!drawings || generating}
              className="w-full bg-gold text-bg font-mono text-[12px] uppercase tracking-[0.25em] py-5 hover:bg-gold-bright disabled:opacity-50 transition-colors"
            >
              {!drawings
                ? "Loading drawings…"
                : generating
                  ? "Generating…"
                  : `🎯 Generate ${setCount} ${setCount === 1 ? "set" : "sets"} · ${gameDef.shortName}`}
            </button>
          </div>

          {results.length > 0 ? (
            <div className="space-y-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">
                {results.length} {results.length === 1 ? "set" : "sets"} ·{" "}
                {ALGORITHMS[results[0]!.algorithm].name} · {GAMES[results[0]!.game].name}
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {results.map((r, i) => (
                  <div
                    key={`${r.generated_at}-${i}`}
                    className="border border-rule bg-bg-elevated p-4 flex flex-col items-center gap-3"
                  >
                    <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink-faint self-start">
                      Set {i + 1}
                    </span>
                    <PowerballRow
                      whiteBalls={r.white_balls}
                      powerball={r.powerball}
                      size="sm"
                    />
                  </div>
                ))}
              </div>
              <p className="text-ink-faint text-[11px] leading-relaxed pt-4 border-t border-rule">
                {disclaimerFor(game)}
              </p>
            </div>
          ) : null}

          <div className="border border-warn-deep bg-bg-panel/40 p-4">
            <p className="font-mono text-[11px] tracking-wide text-warn">
              ⚠ Statistical analysis only. {gameDef.name} drawings are independent random events — odds remain {gameDef.jackpotOdds} regardless of selection. Play responsibly.
            </p>
          </div>
        </section>
      ) : null}

      {/* ───── ANALYSIS TAB ───── */}
      {tab === "analysis" ? (
        <section className="space-y-12">
          <div>
            <header className="flex items-baseline justify-between mb-4">
              <h2 className="font-display text-[28px] text-ink">White ball heatmap</h2>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
                {gameDef.whiteMin}–{gameDef.whiteMax}
              </span>
            </header>
            {drawings ? (
              <Heatmap
                stats={stats}
                ballType="white"
                count={gameDef.whiteMax}
                cols={10}
              />
            ) : (
              <p className="text-ink-faint text-sm">Loading…</p>
            )}
          </div>

          <div>
            <header className="flex items-baseline justify-between mb-4">
              <h2 className="font-display text-[28px] text-ink">
                {gameDef.specialName} heatmap
              </h2>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
                {gameDef.specialMin}–{gameDef.specialMax}
              </span>
            </header>
            {drawings ? (
              <Heatmap
                stats={stats}
                ballType="powerball"
                count={gameDef.specialMax}
                cols={7}
              />
            ) : null}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-rule bg-bg-elevated p-6">
              <h3 className="font-display text-[20px] text-ink mb-4">Hot 10 white balls</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={hot10} layout="vertical">
                  <CartesianGrid stroke="#1a2125" strokeDasharray="2 2" horizontal={false} />
                  <XAxis type="number" stroke="#6b6960" fontSize={11} />
                  <YAxis dataKey="n" type="category" stroke="#a8a397" fontSize={12} width={32} />
                  <Tooltip
                    contentStyle={{
                      background: "#11171a",
                      border: "1px solid #2a3236",
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: 12,
                    }}
                    cursor={{ fill: "rgba(201,166,107,0.08)" }}
                  />
                  <Bar dataKey="freq" fill="#c9a66b" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="border border-rule bg-bg-elevated p-6">
              <h3 className="font-display text-[20px] text-ink mb-4">Cold 10 white balls</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={cold10} layout="vertical">
                  <CartesianGrid stroke="#1a2125" strokeDasharray="2 2" horizontal={false} />
                  <XAxis type="number" stroke="#6b6960" fontSize={11} />
                  <YAxis dataKey="n" type="category" stroke="#a8a397" fontSize={12} width={32} />
                  <Tooltip
                    contentStyle={{
                      background: "#11171a",
                      border: "1px solid #2a3236",
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: 12,
                    }}
                    cursor={{ fill: "rgba(123,168,127,0.08)" }}
                  />
                  <Bar dataKey="freq" fill="#7ba87f" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="border border-rule bg-bg-elevated p-6">
            <h3 className="font-display text-[20px] text-ink mb-4">Sum distribution</h3>
            <p className="text-ink-soft text-sm mb-4">
              Sum of the 5 white balls. Mean ~{sumStats.mean.toFixed(1)}, range {sumStats.min}–{sumStats.max}, {sumStats.inRangePct}% land in the 100–220 balanced band.
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={sumDistribution}>
                <CartesianGrid stroke="#1a2125" strokeDasharray="2 2" />
                <XAxis dataKey="bucket" stroke="#6b6960" fontSize={11} />
                <YAxis stroke="#6b6960" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "#11171a",
                    border: "1px solid #2a3236",
                    fontFamily: "JetBrains Mono, monospace",
                    fontSize: 12,
                  }}
                  cursor={{ fill: "rgba(201,166,107,0.08)" }}
                />
                <Bar dataKey="count" fill="#c9a66b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      ) : null}

      {/* ───── PAIRS TAB ───── */}
      {tab === "pairs" ? (
        <section className="space-y-8">
          <div>
            <h2 className="font-display text-[28px] text-ink mb-3">
              Most frequent pairs
            </h2>
            <p className="text-ink-soft text-[15px] leading-relaxed max-w-[64ch]">
              Numbers that have appeared together most often across {drawings?.length ?? 0} {gameDef.name} drawings. Co-occurrence is a property of the historical data — it does not predict whether they&apos;ll appear together in any future drawing.
            </p>
          </div>

          {drawings ? (
            <div className="border border-rule bg-bg-elevated">
              {topPairs.map((pair, idx) => {
                const max = topPairs[0]?.count ?? 1;
                const pct = Math.round((pair.count / max) * 100);
                return (
                  <div
                    key={`${pair.a}-${pair.b}`}
                    className="px-5 py-3 border-b border-rule last:border-b-0 flex items-center justify-between gap-4"
                  >
                    <span className="font-mono text-[11px] tabular-nums text-ink-faint w-6">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <div className="flex items-center gap-2">
                      <PairBall n={pair.a} />
                      <span className="text-ink-faint">+</span>
                      <PairBall n={pair.b} />
                    </div>
                    <div className="flex-1 mx-4 h-1.5 bg-rule-soft relative overflow-hidden hidden md:block">
                      <div
                        className="absolute inset-y-0 left-0 bg-gold/60"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="font-mono text-[11px] tabular-nums text-gold w-20 text-right">
                      {pair.count}× drawn
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-ink-faint text-sm">Loading…</p>
          )}
        </section>
      ) : null}

      <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-faint text-center pt-12 mt-12 border-t border-rule">
        {gameDef.name} drawings are independent random events. Past frequencies do not predict future draws.
      </p>
    </main>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "gold" | "warn" | "green";
}) {
  const colorClass = {
    gold: "border-gold-deep text-gold",
    warn: "border-warn-deep text-warn",
    green: "border-green text-green",
  }[accent];
  return (
    <div className={`border ${colorClass} bg-bg-elevated/40 px-5 py-3 min-w-[140px]`}>
      <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-ink-faint mb-1">
        {label}
      </div>
      <div className="font-mono text-[14px] font-semibold tabular-nums">
        {value}
      </div>
    </div>
  );
}

function TabButton({
  current,
  value,
  onSelect,
  children,
}: {
  current: Tab;
  value: Tab;
  onSelect: (v: Tab) => void;
  children: React.ReactNode;
}) {
  const active = current === value;
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`px-5 py-3 font-mono text-[11px] uppercase tracking-[0.2em] border-b-2 -mb-px whitespace-nowrap transition-colors ${
        active
          ? "border-gold text-gold"
          : "border-transparent text-ink-soft hover:text-ink"
      }`}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}

function PairBall({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-bg-panel border border-rule font-display text-[13px] tabular-nums text-ink">
      {n}
    </span>
  );
}

const ALGO_ICON: Partial<Record<AlgorithmId, string>> = {
  random: "🎲",
  hot: "🔥",
  cold: "❄️",
  gap: "⏰",
  pattern: "⚖️",
  markov: "🔗",
  monte_carlo: "📈",
  mixed: "🎯",
  anti_syndication: "🛡️",
};

function computeSumStats(
  drawings: Array<{ n1: number; n2: number; n3: number; n4: number; n5: number }>,
) {
  if (drawings.length === 0) return { mean: 0, min: 0, max: 0, inRangePct: 0 };
  const sums = drawings.map((d) => d.n1 + d.n2 + d.n3 + d.n4 + d.n5);
  const mean = sums.reduce((a, b) => a + b, 0) / sums.length;
  const min = Math.min(...sums);
  const max = Math.max(...sums);
  const inRange = sums.filter((s) => s >= 100 && s <= 220).length;
  return { mean, min, max, inRangePct: Math.round((inRange / sums.length) * 100) };
}

function computeSumDistribution(
  drawings: Array<{ n1: number; n2: number; n3: number; n4: number; n5: number }>,
) {
  const buckets = new Map<number, number>();
  for (const d of drawings) {
    const sum = d.n1 + d.n2 + d.n3 + d.n4 + d.n5;
    const bucket = Math.floor(sum / 20) * 20;
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
  }
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a - b)
    .map(([bucket, count]) => ({ bucket: `${bucket}-${bucket + 19}`, count }));
}

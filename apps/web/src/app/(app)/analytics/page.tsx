"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { computeTopPairs } from "@millionmind/shared";
import { useNumberStats, useProfile, useRecentDrawings } from "@/lib/queries";
import { Heatmap } from "@/components/Heatmap";
import { UpgradePrompt } from "@/components/UpgradePrompt";

export default function AnalyticsPage() {
  const { data: profile } = useProfile();
  const isPro = profile?.tier === "pro";

  const { data: stats, isLoading: statsLoading } = useNumberStats();
  const { data: drawings } = useRecentDrawings(isPro ? 500 : 30);

  const whites = (stats ?? [])
    .filter((s) => s.ball_type === "white")
    .sort((a, b) => b.frequency - a.frequency);

  const hot10 = whites.slice(0, 10).map((s) => ({ n: s.number, freq: s.frequency }));
  const cold10 = whites.slice(-10).reverse().map((s) => ({ n: s.number, freq: s.frequency }));

  const sumDistribution = computeSumDistribution(drawings ?? []);
  const topPairs = drawings ? computeTopPairs(drawings, 25) : [];

  return (
    <main className="space-y-12">
      <section>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold mb-3">
          § Analytics
        </p>
        <h1 className="font-display text-[44px] md:text-[56px] leading-[1.05] text-ink mb-3">
          Frequency, gaps, patterns.
        </h1>
        <p className="text-ink-soft text-[15px] leading-relaxed max-w-[60ch]">
          Visualizations of historical Powerball data. The data is real; the future remains random.
        </p>
        {!isPro ? (
          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.15em] text-ink-faint">
            🔒 You&apos;re on Free — analytics show last 30 drawings, basic heatmap, top 5 hot/cold. Upgrade for the full picture.
          </p>
        ) : null}
      </section>

      {/* White heatmap — always visible (basic) */}
      <section className="space-y-5">
        <header className="flex items-baseline justify-between">
          <h2 className="font-display text-[28px] text-ink">White ball heatmap</h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
            1–69 · {drawings?.length ?? 0} drawings
          </span>
        </header>
        {statsLoading ? (
          <p className="text-ink-faint text-sm">Loading statistics…</p>
        ) : (
          <Heatmap stats={stats ?? []} ballType="white" count={69} cols={10} />
        )}
      </section>

      {/* Top 5 hot/cold — always visible. Bar charts behind paywall on Free. */}
      {isPro ? (
        <section className="grid md:grid-cols-2 gap-6">
          <div className="border border-rule bg-bg-elevated p-6">
            <h3 className="font-display text-[20px] text-ink mb-4">Hot 10 white balls</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={hot10} layout="vertical" margin={{ left: 0 }}>
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
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={cold10} layout="vertical" margin={{ left: 0 }}>
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
        </section>
      ) : (
        <section className="space-y-5">
          <h2 className="font-display text-[28px] text-ink">Top 5 hot &amp; overdue</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-rule bg-bg-elevated p-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-warn mb-3">
                Hot 5
              </p>
              <ul className="space-y-2">
                {whites.slice(0, 5).map((s) => (
                  <li key={s.number} className="flex justify-between border-b border-rule-soft pb-2 last:border-b-0">
                    <span className="font-display text-[18px] text-ink">#{s.number}</span>
                    <span className="font-mono text-[12px] text-gold">{s.frequency} draws</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="border border-rule bg-bg-elevated p-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-green mb-3">
                Cold 5
              </p>
              <ul className="space-y-2">
                {whites.slice(-5).reverse().map((s) => (
                  <li key={s.number} className="flex justify-between border-b border-rule-soft pb-2 last:border-b-0">
                    <span className="font-display text-[18px] text-ink">#{s.number}</span>
                    <span className="font-mono text-[12px] text-green">{s.frequency} draws</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <UpgradePrompt
            feature="Hot 10 / Cold 10 with bar charts"
            detail="Pro tier shows the full top-10 ranked lists for both ends, visualized as charts you can hover."
          />
        </section>
      )}

      {/* Powerball heatmap — Pro only */}
      {isPro ? (
        <section className="space-y-5">
          <header className="flex items-baseline justify-between">
            <h2 className="font-display text-[28px] text-ink">Powerball heatmap</h2>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
              1–26
            </span>
          </header>
          <Heatmap stats={stats ?? []} ballType="powerball" count={26} cols={7} />
        </section>
      ) : (
        <section className="space-y-5">
          <h2 className="font-display text-[28px] text-ink">Powerball heatmap</h2>
          <UpgradePrompt
            feature="Powerball heatmap (1–26)"
            detail="The special-ball heatmap is the second most-used view. Pro unlocks both."
          />
        </section>
      )}

      {/* Sum distribution — Pro only */}
      {isPro ? (
        <section className="border border-rule bg-bg-elevated p-6">
          <h3 className="font-display text-[20px] text-ink mb-4">Sum distribution</h3>
          <p className="text-ink-soft text-sm mb-4">
            Distribution of the sum of the 5 white balls across {drawings?.length ?? 0} drawings. Most cluster around the expected mean of ~175.
          </p>
          <ResponsiveContainer width="100%" height={260}>
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
        </section>
      ) : (
        <section className="space-y-5">
          <h2 className="font-display text-[28px] text-ink">Sum distribution</h2>
          <UpgradePrompt
            feature="Sum-distribution histogram"
            detail="See how the 5-ball sum clusters around the historical mean. Used by Pattern-Balanced and Monte Carlo to score combinations."
          />
        </section>
      )}

      {/* Pairs & Trends — Pro only */}
      {isPro ? (
        <section className="space-y-5">
          <header className="flex items-baseline justify-between">
            <h2 className="font-display text-[28px] text-ink">Pairs &amp; Trends</h2>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
              Top 25 co-occurring pairs
            </span>
          </header>
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
                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-bg-panel border border-rule font-display text-[13px] tabular-nums text-ink">
                      {pair.a}
                    </span>
                    <span className="text-ink-faint">+</span>
                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-bg-panel border border-rule font-display text-[13px] tabular-nums text-ink">
                      {pair.b}
                    </span>
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
        </section>
      ) : (
        <section className="space-y-5">
          <h2 className="font-display text-[28px] text-ink">Pairs &amp; Trends</h2>
          <UpgradePrompt
            feature="Top co-occurring number pairs"
            detail="See which numbers have appeared together most often across the full historical dataset. Pro unlocks the top 25 pairs across both games."
          />
        </section>
      )}

      <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-faint text-center pt-6">
        Powerball drawings are independent random events. Past frequencies do not predict future draws.
      </p>
    </main>
  );
}

function computeSumDistribution(
  drawings: Array<{ n1: number; n2: number; n3: number; n4: number; n5: number }>,
): Array<{ bucket: string; count: number }> {
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

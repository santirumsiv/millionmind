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
import { useNumberStats, useRecentDrawings } from "@/lib/queries";
import { Heatmap } from "@/components/Heatmap";

export default function AnalyticsPage() {
  const { data: stats, isLoading: statsLoading } = useNumberStats();
  const { data: drawings } = useRecentDrawings(500);

  const whites = (stats ?? [])
    .filter((s) => s.ball_type === "white")
    .sort((a, b) => b.frequency - a.frequency);

  const hot10 = whites.slice(0, 10).map((s) => ({ n: s.number, freq: s.frequency }));
  const cold10 = whites.slice(-10).reverse().map((s) => ({ n: s.number, freq: s.frequency }));

  const sumDistribution = computeSumDistribution(drawings ?? []);

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
      </section>

      <section className="space-y-5">
        <header className="flex items-baseline justify-between">
          <h2 className="font-display text-[28px] text-ink">White ball heatmap</h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
            1–69
          </span>
        </header>
        {statsLoading ? (
          <p className="text-ink-faint text-sm">Loading statistics…</p>
        ) : (
          <Heatmap stats={stats ?? []} ballType="white" count={69} cols={10} />
        )}
      </section>

      <section className="grid md:grid-cols-2 gap-6">
        <div className="border border-rule bg-bg-elevated p-6">
          <h3 className="font-display text-[20px] text-ink mb-4">Hot 10 white balls</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={hot10} layout="vertical" margin={{ left: 0 }}>
              <CartesianGrid stroke="#1a2125" strokeDasharray="2 2" horizontal={false} />
              <XAxis type="number" stroke="#6b6960" fontSize={11} />
              <YAxis
                dataKey="n"
                type="category"
                stroke="#a8a397"
                fontSize={12}
                width={32}
              />
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
              <YAxis
                dataKey="n"
                type="category"
                stroke="#a8a397"
                fontSize={12}
                width={32}
              />
              <Tooltip
                contentStyle={{
                  background: "#11171a",
                  border: "1px solid #2a3236",
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: 12,
                }}
                cursor={{ fill: "rgba(201,166,107,0.08)" }}
              />
              <Bar dataKey="freq" fill="#7ba87f" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="space-y-5">
        <header className="flex items-baseline justify-between">
          <h2 className="font-display text-[28px] text-ink">Powerball frequency</h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
            1–26
          </span>
        </header>
        <Heatmap stats={stats ?? []} ballType="powerball" count={26} cols={7} />
      </section>

      <section className="border border-rule bg-bg-elevated p-6">
        <h3 className="font-display text-[20px] text-ink mb-4">Sum distribution</h3>
        <p className="text-ink-soft text-sm mb-4">
          Distribution of the sum of the 5 white balls across {drawings?.length ?? 0} recent drawings. Most cluster around the expected mean of ~175.
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

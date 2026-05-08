"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { GAMES, GAME_IDS, type GameId } from "@millionmind/shared";
import { useStats } from "@/lib/queries";
import { Heatmap } from "@/components/Heatmap";

export default function AnalyticsPage() {
  const [game, setGame] = useState<GameId>("powerball");
  const { data, isLoading } = useStats(game);

  const whites = (data?.stats ?? [])
    .filter((s) => s.ball_type === "white")
    .sort((a, b) => b.frequency - a.frequency);
  const hot10 = whites.slice(0, 10).map((s) => ({ n: s.number, freq: s.frequency }));
  const cold10 = whites.slice(-10).reverse().map((s) => ({ n: s.number, freq: s.frequency }));

  const whiteCount = game === "powerball" ? 69 : 70;
  const specialCount = game === "powerball" ? 26 : 25;

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
          Visualizations of historical {GAMES[game].name} data. The data is real; the future remains random.
        </p>
      </section>

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

      <section className="space-y-5">
        <header className="flex items-baseline justify-between">
          <h2 className="font-display text-[28px] text-ink">White ball heatmap</h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
            1–{whiteCount} · {data?.total_drawings ?? 0} drawings
          </span>
        </header>
        {isLoading ? (
          <p className="text-ink-faint text-sm">Loading statistics…</p>
        ) : (
          <Heatmap stats={data?.stats ?? []} ballType="white" count={whiteCount} cols={10} />
        )}
      </section>

      <section className="space-y-5">
        <header className="flex items-baseline justify-between">
          <h2 className="font-display text-[28px] text-ink">
            {game === "powerball" ? "Powerball" : "Mega Ball"} heatmap
          </h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
            1–{specialCount}
          </span>
        </header>
        {isLoading ? (
          <p className="text-ink-faint text-sm">Loading statistics…</p>
        ) : (
          <Heatmap stats={data?.stats ?? []} ballType="powerball" count={specialCount} cols={7} />
        )}
      </section>

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

      <section className="space-y-5">
        <header className="flex items-baseline justify-between">
          <h2 className="font-display text-[28px] text-ink">Top co-occurring pairs</h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
            Top 25 across all drawings
          </span>
        </header>
        <div className="border border-rule bg-bg-elevated">
          {(data?.top_pairs ?? []).map((pair, idx) => {
            const max = data?.top_pairs[0]?.count ?? 1;
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
                  <div className="absolute inset-y-0 left-0 bg-gold/60" style={{ width: `${pct}%` }} />
                </div>
                <span className="font-mono text-[11px] tabular-nums text-gold w-20 text-right">
                  {pair.count}× drawn
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-faint text-center">
        Lottery drawings are independent random events. Past frequencies do not predict future draws.
      </p>
    </main>
  );
}

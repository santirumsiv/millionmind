"use client";

import { useState } from "react";
import { CA_GAMES, CA_GAME_IDS, type CaGameId } from "@millionmind/shared";
import { useCaStats } from "@/lib/ca-queries";
import { ApiCallError } from "@/lib/queries";
import { CaHeatmap } from "@/components/CaHeatmap";

export default function CaAnalyticsPage() {
  const [game, setGame] = useState<CaGameId>("lotto649");
  const def = CA_GAMES[game];
  const { data, isLoading, error } = useCaStats(game);

  const backendError =
    error instanceof ApiCallError ? error.detail.message : error ? String(error) : null;

  const hot = data?.main.hot ?? [];
  const cold = data?.main.cold ?? [];
  const overdue = data?.main.overdue ?? [];
  const pairs = data?.pairs ?? [];

  return (
    <main className="space-y-12">
      <section>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold mb-3">
          § Analytics · Canada
        </p>
        <h1 className="font-display text-[44px] md:text-[56px] leading-[1.05] text-ink mb-3">
          Frequency, gaps, patterns.
        </h1>
        <p className="text-ink-soft text-[15px] leading-relaxed max-w-[60ch]">
          Visualizations of historical {def.name} draws. The data is real; the future
          remains random.
        </p>
      </section>

      {/* Game switcher */}
      <section className="flex gap-2 flex-wrap">
        {CA_GAME_IDS.map((g) => (
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
            {CA_GAMES[g].name}
          </button>
        ))}
      </section>

      {backendError ? (
        <div className="border border-warn bg-bg p-5">
          <p className="text-warn text-sm">{backendError}</p>
          <p className="text-ink-faint text-[12px] mt-2">
            Start the {def.name} backend (see README) — or load its draw data — to see
            statistics here.
          </p>
        </div>
      ) : null}

      {data && !data.loaded ? (
        <div className="border border-rule bg-bg-elevated p-6">
          <p className="text-ink-soft text-sm">
            No {def.name} draw data loaded yet. Upload the OLG draw file to its backend to
            populate these statistics.
          </p>
        </div>
      ) : null}

      {/* Main pool heatmap */}
      <section className="space-y-5">
        <header className="flex items-baseline justify-between">
          <h2 className="font-display text-[28px] text-ink">Main number heatmap</h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
            {def.mainMin}–{def.mainMax} · {data?.total_drawings ?? 0} draws
          </span>
        </header>
        {isLoading ? (
          <p className="text-ink-faint text-sm">Loading statistics…</p>
        ) : (
          <CaHeatmap frequency={data?.main.frequency ?? {}} count={def.mainMax} cols={10} />
        )}
      </section>

      {/* Bonus pool heatmap (Daily Grand only) */}
      {def.bonusSeparatePool ? (
        <section className="space-y-5">
          <header className="flex items-baseline justify-between">
            <h2 className="font-display text-[28px] text-ink">{def.bonusLabel} heatmap</h2>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
              {def.bonusMin}–{def.bonusMax}
            </span>
          </header>
          {isLoading ? (
            <p className="text-ink-faint text-sm">Loading…</p>
          ) : (
            <CaHeatmap frequency={data?.bonus?.frequency ?? {}} count={def.bonusMax} cols={7} />
          )}
        </section>
      ) : null}

      {/* Hot / Cold / Overdue */}
      <section className="grid md:grid-cols-3 gap-6">
        <NumberList title="Hot 10" subtitle="Drawn most" numbers={hot} accent="text-gold" />
        <NumberList title="Cold 10" subtitle="Drawn least" numbers={cold} accent="text-[#7ba87f]" />
        <NumberList title="Overdue 10" subtitle="Absent longest" numbers={overdue} accent="text-warn" />
      </section>

      {/* Top co-occurring pairs */}
      <section className="space-y-5">
        <header className="flex items-baseline justify-between">
          <h2 className="font-display text-[28px] text-ink">Top co-occurring pairs</h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
            Drawn together most
          </span>
        </header>
        {isLoading ? (
          <p className="text-ink-faint text-sm">Loading…</p>
        ) : pairs.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {pairs.map((p) => (
              <div
                key={`${p.a}-${p.b}`}
                className="border border-rule bg-bg-elevated p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-bg-panel border border-rule font-display text-[13px] tabular-nums text-ink">
                    {p.a}
                  </span>
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-bg-panel border border-rule font-display text-[13px] tabular-nums text-ink">
                    {p.b}
                  </span>
                </div>
                <span className="font-mono text-[11px] text-gold tabular-nums">
                  ×{p.count}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-ink-faint text-sm">No data.</p>
        )}
      </section>

      <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-faint text-center">
        Lottery draws are independent random events. Past frequencies do not predict
        future draws.
      </p>
    </main>
  );
}

function NumberList({
  title,
  subtitle,
  numbers,
  accent,
}: {
  title: string;
  subtitle: string;
  numbers: number[];
  accent: string;
}) {
  return (
    <div className="border border-rule bg-bg-elevated p-6">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className={`font-display text-[20px] ${accent}`}>{title}</h3>
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-faint">
          {subtitle}
        </span>
      </div>
      {numbers.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {numbers.map((n) => (
            <span
              key={n}
              className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-bg-panel border border-rule font-display text-[13px] tabular-nums text-ink"
            >
              {n}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-ink-faint text-sm">No data.</p>
      )}
    </div>
  );
}

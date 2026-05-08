"use client";

import { useState } from "react";
import { GAMES, GAME_IDS, type GameId } from "@millionmind/shared";
import { useDrawings } from "@/lib/queries";
import { PowerballRow } from "@/components/PowerballRow";

const PAGE_SIZE = 50;
const HARD_LIMIT = 200;

export default function HistoryPage() {
  const [game, setGame] = useState<GameId>("powerball");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const { data, isLoading } = useDrawings(game, limit);

  return (
    <main className="space-y-10">
      <section>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold mb-3">
          § History
        </p>
        <h1 className="font-display text-[44px] leading-[1.05] text-ink mb-3">
          Past drawings.
        </h1>
        <p className="text-ink-soft text-[15px] leading-relaxed max-w-[60ch]">
          Powerball and Mega Millions drawings refreshed daily from official feeds. Up to {HARD_LIMIT} most-recent drawings shown.
        </p>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
          {GAME_IDS.map((id) => (
            <a
              key={id}
              href={GAMES[id].officialResultsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-faint hover:text-gold"
            >
              Latest {GAMES[id].name} on official site ↗
            </a>
          ))}
        </div>
      </section>

      <section className="flex gap-2">
        {GAME_IDS.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => {
              setGame(g);
              setLimit(PAGE_SIZE);
            }}
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

      {isLoading ? (
        <p className="text-ink-faint text-sm">Loading drawings…</p>
      ) : (
        <div className="border border-rule bg-bg-elevated divide-y divide-rule">
          {data?.rows?.length ? (
            data.rows.map((d, idx) => (
              <div
                key={`${d.draw_date}-${idx}`}
                className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
              >
                <div className="font-mono text-[12px] tracking-wide text-ink-soft min-w-[120px]">
                  {d.draw_date}
                </div>
                <PowerballRow
                  whiteBalls={[d.n1, d.n2, d.n3, d.n4, d.n5]}
                  powerball={d.powerball}
                  size="sm"
                />
                <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink-faint">
                  {GAMES[game].name}
                </div>
              </div>
            ))
          ) : (
            <div className="p-6">
              <p className="text-ink-soft text-sm">No drawings available.</p>
            </div>
          )}
        </div>
      )}

      {data && data.rows.length === limit && limit < HARD_LIMIT ? (
        <button
          type="button"
          onClick={() => setLimit((l) => Math.min(HARD_LIMIT, l + PAGE_SIZE))}
          className="block mx-auto border border-gold-deep text-gold font-mono text-[10px] uppercase tracking-[0.2em] px-6 py-3 hover:border-gold transition-colors"
        >
          Load more
        </button>
      ) : null}
    </main>
  );
}

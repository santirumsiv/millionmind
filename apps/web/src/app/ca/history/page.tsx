"use client";

import { useState } from "react";
import { CA_GAMES, CA_GAME_IDS, type CaGameId } from "@millionmind/shared";
import { useCaDrawings } from "@/lib/ca-queries";
import { CaBallRow } from "@/components/CaBallRow";

const PAGE_SIZE = 50;
const HARD_LIMIT = 200;

export default function CaHistoryPage() {
  const [game, setGame] = useState<CaGameId>("lotto649");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const def = CA_GAMES[game];
  const { data, isLoading } = useCaDrawings(game, limit);

  return (
    <main className="space-y-10">
      <section>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold mb-3">
          § History · Canada
        </p>
        <h1 className="font-display text-[44px] leading-[1.05] text-ink mb-3">
          Past drawings.
        </h1>
        <p className="text-ink-soft text-[15px] leading-relaxed max-w-[60ch]">
          Official {def.name} draw history since inception. Up to {HARD_LIMIT}{" "}
          most-recent drawings shown.
        </p>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
          {CA_GAME_IDS.map((id) => (
            <a
              key={id}
              href={CA_GAMES[id].officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-faint hover:text-gold"
            >
              Latest {CA_GAMES[id].name} on OLG ↗
            </a>
          ))}
        </div>
      </section>

      {/* Game switcher */}
      <section className="flex gap-2 flex-wrap">
        {CA_GAME_IDS.map((g) => (
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
            {CA_GAMES[g].name}
          </button>
        ))}
      </section>

      <section className="border border-rule bg-bg-elevated p-4 flex flex-wrap items-center gap-x-6 gap-y-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
          Matrix:{" "}
          <span className="text-ink">
            {def.mainCount}/{def.mainMin}–{def.mainMax}
            {def.bonusSeparatePool ? ` + ${def.bonusLabel} ${def.bonusMin}–${def.bonusMax}` : ""}
          </span>
        </span>
        {data?.date_range ? (
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
            Since <span className="text-ink">{data.date_range.start}</span>
          </span>
        ) : null}
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint ml-auto">
          Total draws: <span className="text-ink">{data?.total_drawings ?? "—"}</span>
        </span>
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
                <CaBallRow
                  main={d.main}
                  bonus={d.bonus}
                  bonusLabel={def.bonusSeparatePool ? def.bonusLabel : "Bonus"}
                  size="sm"
                />
                <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink-faint">
                  {def.name}
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

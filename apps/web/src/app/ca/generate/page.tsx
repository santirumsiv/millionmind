"use client";

import { useState } from "react";
import {
  CA_GAMES,
  CA_GAME_IDS,
  caDisclaimerFor,
  type CaGameId,
} from "@millionmind/shared";
import { useCaGenerate } from "@/lib/ca-queries";
import { ApiCallError, useQuota } from "@/lib/queries";
import { CaBallRow } from "@/components/CaBallRow";

export default function CaGeneratePage() {
  const [game, setGame] = useState<CaGameId>("lotto649");
  const def = CA_GAMES[game];
  const [mode, setMode] = useState<string>(def.generationModes[0].id);
  const [count, setCount] = useState<number>(5);
  const [error, setError] = useState<string | null>(null);

  const { data: quota } = useQuota();
  const generate = useCaGenerate(game);

  function onSwitchGame(g: CaGameId) {
    setGame(g);
    setMode(CA_GAMES[g].generationModes[0].id);
    setError(null);
    generate.reset();
  }

  async function onGenerate() {
    setError(null);
    try {
      await generate.mutateAsync({ mode, count });
    } catch (e) {
      if (e instanceof ApiCallError) setError(e.detail.message);
      else setError("Generation failed. Please try again.");
    }
  }

  const result = generate.data;

  return (
    <main className="space-y-10">
      <section>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold mb-3">
          § Generate · Canada
        </p>
        <h1 className="font-display text-[44px] leading-[1.05] text-ink mb-3">
          Pick a game and a strategy.
        </h1>
        <p className="text-ink-soft text-[15px] leading-relaxed max-w-[60ch]">
          Combinations are computed server-side by each game&apos;s own analysis engine.
          Free generations are capped at 5 per 5-minute window. None of these change the
          mathematical odds of winning.
        </p>
      </section>

      {/* Game switcher */}
      <section className="flex gap-2 flex-wrap">
        {CA_GAME_IDS.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => onSwitchGame(g)}
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

      {/* Matrix + quota */}
      <section className="border border-rule bg-bg-elevated p-4 flex flex-wrap items-center gap-x-6 gap-y-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
          Matrix:{" "}
          <span className="text-ink">
            {def.mainCount}/{def.mainMin}–{def.mainMax}
            {def.bonusSeparatePool ? ` + ${def.bonusLabel} ${def.bonusMin}–${def.bonusMax}` : ""}
          </span>
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
          Odds: <span className="text-gold">{def.jackpotOdds}</span>
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint ml-auto">
          Free this 5-min: <span className="text-ink">{quota?.free_remaining ?? "—"}/5</span>
        </span>
      </section>

      {/* Strategy grid */}
      <section className="grid md:grid-cols-2 gap-3">
        {def.generationModes.map((m) => {
          const isActive = mode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              aria-pressed={isActive}
              className={`text-left p-5 border transition-colors ${
                isActive ? "border-gold bg-bg-panel" : "border-rule bg-bg-elevated hover:border-gold-deep"
              }`}
            >
              <span className="font-display text-[20px] text-ink leading-tight">{m.label}</span>
              <p className="text-ink-soft text-sm leading-relaxed mt-1">{m.description}</p>
            </button>
          );
        })}
      </section>

      {/* Count + generate */}
      <section className="border border-rule bg-bg-elevated p-8 space-y-5">
        <div className="flex items-center gap-4">
          <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
            Tickets
          </label>
          <select
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="bg-bg border border-rule text-ink font-mono text-[12px] px-3 py-2 focus:outline-gold"
          >
            {[1, 3, 5, 10].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={onGenerate}
          disabled={generate.isPending}
          className="w-full bg-gold text-bg font-mono text-[12px] uppercase tracking-[0.25em] py-5 hover:bg-gold-bright disabled:opacity-50 transition-colors"
        >
          {generate.isPending ? "Generating…" : `Generate ${count} ${def.name} ticket${count > 1 ? "s" : ""}`}
        </button>

        {error ? (
          <div className="border border-warn bg-bg p-4">
            <p className="text-warn text-sm">{error}</p>
          </div>
        ) : null}

        {result ? (
          <div className="space-y-4 pt-2">
            {result.tickets.map((t, idx) => (
              <div key={idx} className="border border-rule bg-bg p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
                    Ticket {idx + 1}
                  </span>
                  {typeof t.meta.score === "number" ? (
                    <span className="font-mono text-[10px] text-gold">
                      score {Math.round(t.meta.score as number)}
                    </span>
                  ) : null}
                </div>
                <CaBallRow
                  main={t.main}
                  bonus={t.bonus}
                  bonusLabel={def.bonusSeparatePool ? def.bonusLabel : "Bonus"}
                  size="md"
                />
                {t.notes.length > 0 ? (
                  <p className="text-ink-faint text-[12px] leading-relaxed">{t.notes.join(" · ")}</p>
                ) : null}
              </div>
            ))}
            <p className="text-ink-faint text-[11px] leading-relaxed text-center max-w-[60ch] mx-auto pt-4 border-t border-rule whitespace-pre-line">
              {caDisclaimerFor(game)}
            </p>
          </div>
        ) : null}
      </section>
    </main>
  );
}

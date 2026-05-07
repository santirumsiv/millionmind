"use client";

import { useState } from "react";
import {
  GAMES,
  GAME_IDS,
  drawingsToCsv,
  todayStampedFilename,
} from "@millionmind/shared";
import { FREE_LIMITS, useProfile, useRecentDrawings } from "@/lib/queries";
import { PowerballRow } from "@/components/PowerballRow";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { downloadCsv } from "@/lib/download";

export default function HistoryPage() {
  const { data: profile } = useProfile();
  const isPro = profile?.tier === "pro";
  const maxLoadable = isPro ? Infinity : FREE_LIMITS.drawingsHistory;

  const [limit, setLimit] = useState(isPro ? 50 : FREE_LIMITS.drawingsHistory);
  const { data: drawings, isLoading } = useRecentDrawings(limit);

  function onExport() {
    if (!drawings || !isPro) return;
    downloadCsv(drawingsToCsv(drawings), todayStampedFilename("powerball_drawings"));
  }

  return (
    <main className="space-y-10">
      <section>
        <div className="flex justify-between items-start gap-4 flex-wrap">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold mb-3">
              § History
            </p>
            <h1 className="font-display text-[44px] leading-[1.05] text-ink mb-3">
              Past drawings.
            </h1>
            <p className="text-ink-soft text-[15px] leading-relaxed max-w-[60ch]">
              {isPro
                ? "Every Powerball and Mega Millions drawing back to 2010, refreshed automatically from official feeds every 4 hours."
                : `Free tier shows the last ${FREE_LIMITS.drawingsHistory} drawings. Upgrade for the full historical archive.`}
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
          </div>
          {isPro && drawings && drawings.length > 0 ? (
            <button
              type="button"
              onClick={onExport}
              className="border border-gold-deep text-gold font-mono text-[10px] uppercase tracking-[0.2em] px-5 py-3 hover:border-gold transition-colors whitespace-nowrap"
            >
              ↓ Export CSV ({drawings.length})
            </button>
          ) : null}
        </div>
      </section>

      {isLoading ? (
        <p className="text-ink-faint text-sm">Loading drawings…</p>
      ) : (
        <div className="border border-rule bg-bg-elevated divide-y divide-rule">
          {drawings?.length ? (
            drawings.map((d) => (
              <div
                key={d.id}
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
                  {d.multiplier}× multiplier
                </div>
              </div>
            ))
          ) : (
            <div className="p-6">
              <p className="text-ink-soft text-sm">
                No drawings loaded yet. Run the loader script (see{" "}
                <code className="text-gold font-mono text-xs">supabase/README.md</code>).
              </p>
            </div>
          )}
        </div>
      )}

      {/* Pagination + free-cap upgrade */}
      {!isPro && drawings && drawings.length >= FREE_LIMITS.drawingsHistory ? (
        <UpgradePrompt
          feature="See every drawing back to 2010"
          detail={`You've reached the Free-tier limit of ${FREE_LIMITS.drawingsHistory} most recent drawings. Pro unlocks the full archive across both Powerball and Mega Millions.`}
          source="history"
        />
      ) : drawings && drawings.length === limit && limit < maxLoadable ? (
        <button
          type="button"
          onClick={() => setLimit((l) => l + 50)}
          className="block mx-auto border border-gold-deep text-gold font-mono text-[10px] uppercase tracking-[0.2em] px-6 py-3 hover:border-gold transition-colors"
        >
          Load more
        </button>
      ) : null}
    </main>
  );
}

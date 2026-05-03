"use client";

import { useState } from "react";
import { useRecentDrawings } from "@/lib/queries";
import { PowerballRow } from "@/components/PowerballRow";

export default function HistoryPage() {
  const [limit, setLimit] = useState(50);
  const { data: drawings, isLoading } = useRecentDrawings(limit);

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
          Every Powerball drawing since 2010, drawn directly from the New York State Open Data API.
        </p>
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

      {drawings && drawings.length === limit ? (
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

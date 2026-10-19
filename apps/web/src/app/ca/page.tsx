"use client";

import Link from "next/link";
import { CA_GAMES, CA_GAME_IDS, caNextDrawing } from "@millionmind/shared";

export default function CaHomePage() {
  return (
    <main className="space-y-12">
      <section>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold mb-3">
          ◆ Welcome · Canada
        </p>
        <h1 className="font-display text-[44px] md:text-[56px] leading-[1.05] text-ink mb-3">
          Canadian lottery analytics, free.
        </h1>
        <p className="text-ink-soft text-[15px] leading-relaxed max-w-[62ch] mb-8">
          Frequency, gaps, and pattern analysis across Lotto Max, Lotto 6/49, and
          Daily Grand — plus statistically-informed combination generation. The
          historical draws are real; the future is random. For entertainment only.
        </p>

        <Link
          href="/ca/generate"
          className="inline-block bg-gold text-bg font-mono text-[11px] uppercase tracking-[0.2em] px-7 py-4 hover:bg-gold-bright transition-colors"
        >
          Generate Numbers
        </Link>
      </section>

      <section className="grid md:grid-cols-3 gap-6">
        {CA_GAME_IDS.map((id) => {
          const g = CA_GAMES[id];
          const next = caNextDrawing(id);
          return (
            <div key={id} className="border border-rule bg-bg-elevated p-6 flex flex-col gap-4">
              <div className="flex items-baseline justify-between">
                <p className="font-display text-[22px] text-ink leading-tight">{g.name}</p>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">
                  {g.shortName}
                </span>
              </div>
              <p className="font-mono text-[11px] text-ink-soft">
                {g.mainCount} / {g.mainMin}–{g.mainMax}
                {g.bonusSeparatePool
                  ? ` + ${g.bonusLabel} ${g.bonusMin}–${g.bonusMax}`
                  : ` + ${g.bonusLabel}`}
              </p>
              <div className="border-t border-rule pt-3 space-y-1">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
                  Next draw
                </p>
                <p className="font-display text-[18px] text-ink">{next.weekday}</p>
                <p className="font-mono text-[11px] text-ink-soft">{next.date}</p>
              </div>
              <p className="font-mono text-[10px] text-ink-faint tracking-wide mt-auto">
                Top-prize odds {g.jackpotOdds}
              </p>
              <div className="flex gap-2">
                <Link
                  href="/ca/analytics"
                  className="flex-1 text-center border border-rule px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft hover:border-gold-deep hover:text-gold"
                >
                  Analytics
                </Link>
                <Link
                  href="/ca/generate"
                  className="flex-1 text-center border border-rule px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft hover:border-gold-deep hover:text-gold"
                >
                  Generate
                </Link>
              </div>
            </div>
          );
        })}
      </section>

      <section className="border border-rule bg-bg-elevated p-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold mb-3">
          About the Canadian games
        </p>
        <p className="text-ink-soft text-[13px] leading-relaxed max-w-[70ch]">
          Lotto Max draws 7 numbers from a pool of 50; Lotto 6/49 draws 6 from 49;
          both also draw a Bonus number from the same pool. Daily Grand draws 5 main
          numbers from 49 plus a separate Grand Number from 1–7. Statistics and
          generation are computed server-side per game and never change the odds.
        </p>
      </section>

      <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-faint text-center">
        Million Mind is not affiliated with the Ontario Lottery and Gaming Corporation
        or any provincial lottery. 18+/19+ depending on province. Play responsibly.
      </p>
    </main>
  );
}

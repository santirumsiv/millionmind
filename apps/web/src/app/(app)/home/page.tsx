"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GAMES } from "@millionmind/shared";
import {
  readLocalHistory,
  useDrawings,
  useQuota,
  type LocalGenerationEntry,
} from "@/lib/queries";
import { PowerballRow } from "@/components/PowerballRow";

export default function HomePage() {
  const { data: quota } = useQuota();
  const { data: pbDrawings } = useDrawings("powerball", 1);
  const lastDraw = pbDrawings?.rows[0];

  const [history, setHistory] = useState<LocalGenerationEntry[]>([]);
  useEffect(() => {
    setHistory(readLocalHistory().slice(0, 3));
  }, []);

  const next = nextDrawingDate();

  return (
    <main className="space-y-12">
      <section>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold mb-3">
          ◆ Welcome
        </p>
        <h1 className="font-display text-[44px] md:text-[56px] leading-[1.05] text-ink mb-3">
          Lottery analytics, free.
        </h1>
        <p className="text-ink-soft text-[15px] leading-relaxed max-w-[60ch] mb-8">
          5 free generations per 5-minute window. Watch an ad to unlock 8 premium algorithms across Powerball and Mega Millions. No accounts. No subscriptions. For entertainment only.
        </p>

        <Link
          href="/generate"
          className="inline-block bg-gold text-bg font-mono text-[11px] uppercase tracking-[0.2em] px-7 py-4 hover:bg-gold-bright transition-colors"
        >
          Generate Numbers
        </Link>
      </section>

      <section className="grid md:grid-cols-2 gap-6">
        <div className="border border-rule bg-bg-elevated p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold mb-4">
            Next Powerball drawing
          </p>
          <p className="font-display text-[28px] text-ink leading-tight mb-2">
            {next.weekday}
          </p>
          <p className="font-mono text-[12px] text-ink-soft tracking-wide">
            {next.date} · 22:59 ET
          </p>
        </div>

        <div className="border border-rule bg-bg-elevated p-6">
          <div className="flex items-baseline justify-between mb-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">
              Last Powerball
            </p>
            <a
              href={GAMES.powerball.officialResultsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-faint hover:text-gold"
            >
              powerball.com ↗
            </a>
          </div>
          {lastDraw ? (
            <>
              <p className="font-mono text-[12px] text-ink-soft mb-3">{lastDraw.draw_date}</p>
              <PowerballRow
                whiteBalls={[lastDraw.n1, lastDraw.n2, lastDraw.n3, lastDraw.n4, lastDraw.n5]}
                powerball={lastDraw.powerball}
                size="sm"
              />
            </>
          ) : (
            <p className="text-ink-faint text-sm">Loading…</p>
          )}
        </div>
      </section>

      <section className="border border-rule bg-bg-elevated p-6 flex flex-wrap items-baseline gap-x-6 gap-y-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">Quota</span>
        <span className="font-mono text-[12px] text-ink-soft">
          Free this 5-min: <span className="text-ink">{quota?.free_remaining ?? "—"}/5</span>
        </span>
        <span className="font-mono text-[12px] text-ink-soft">
          Premium uses left: <span className="text-gold">{quota?.premium_uses ?? 0}</span>
        </span>
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">
            Your recent generations
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-faint">
            Stored on this device only
          </p>
        </div>
        {history.length > 0 ? (
          <div className="space-y-3">
            {history.map((c, idx) => (
              <div
                key={`${c.generated_at}-${idx}`}
                className="border border-rule bg-bg-elevated p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <PowerballRow whiteBalls={c.white_balls} powerball={c.powerball} size="sm" />
                <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-faint">
                  {c.algorithm.replace("_", " ")} · {GAMES[c.game].name} ·{" "}
                  {new Date(c.generated_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-rule bg-bg-elevated p-6">
            <p className="text-ink-soft text-sm">
              No combinations yet — head to{" "}
              <Link href="/generate" className="text-gold hover:text-gold-bright">
                Generate
              </Link>{" "}
              to create your first.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

function nextDrawingDate(): { weekday: string; date: string } {
  // Powerball draws Mon, Wed, Sat at 22:59 ET.
  const drawDays = [1, 3, 6];
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const candidate = new Date(now);
    candidate.setDate(now.getDate() + i);
    if (drawDays.includes(candidate.getDay())) {
      return {
        weekday: candidate.toLocaleDateString(undefined, { weekday: "long" }),
        date: candidate.toLocaleDateString(undefined, { month: "long", day: "numeric" }),
      };
    }
  }
  return { weekday: "—", date: "—" };
}

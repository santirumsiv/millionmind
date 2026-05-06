"use client";

import Link from "next/link";
import { GAMES, TIERS } from "@millionmind/shared";
import {
  FREE_LIMITS,
  daysAgoIso,
  useMyCombinations,
  useProfile,
  useRecentDrawings,
  useUsageThisWeek,
  tierLabel,
} from "@/lib/queries";
import { PowerballRow } from "@/components/PowerballRow";

export default function HomePage() {
  const { data: profile } = useProfile();
  const { data: usage } = useUsageThisWeek();
  const { data: combos } = useMyCombinations(20);
  const { data: drawings } = useRecentDrawings(1);
  const lastDraw = drawings?.[0];

  const tier = profile?.tier ?? "free";
  const isPro = tier === "pro";
  const cap = TIERS[tier].weeklyGenerationCap;
  const remaining = cap === "unlimited" ? "unlimited" : Math.max(0, cap - (usage?.count ?? 0));

  // Free tier sees only the last 7 days of their generation history.
  const visibleCombos = (combos ?? []).filter((c) =>
    isPro ? true : c.created_at >= daysAgoIso(FREE_LIMITS.myGenerationsDays),
  ).slice(0, 3);
  const olderCombosCount = (combos ?? []).length - visibleCombos.length;

  const next = nextDrawingDate();

  return (
    <main className="space-y-12">
      <section>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold mb-3">
          ◆ {tierLabel(tier)} tier
        </p>
        <h1 className="font-display text-[44px] md:text-[56px] leading-[1.05] text-ink mb-3">
          Welcome.
        </h1>
        <p className="text-ink-soft text-[15px] leading-relaxed max-w-[60ch] mb-8">
          {remaining === "unlimited"
            ? "Unlimited generations this week."
            : `${remaining} of ${cap} generations remaining this week.`}
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
            Next drawing
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
              Last drawing
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
              <p className="font-mono text-[12px] text-ink-soft mb-3">
                {lastDraw.draw_date}
              </p>
              <PowerballRow
                whiteBalls={[lastDraw.n1, lastDraw.n2, lastDraw.n3, lastDraw.n4, lastDraw.n5]}
                powerball={lastDraw.powerball}
                size="sm"
              />
            </>
          ) : (
            <p className="text-ink-faint text-sm">Load drawings to see results.</p>
          )}
        </div>
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">
            Recent generations
          </p>
          {!isPro ? (
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-faint">
              Free · last {FREE_LIMITS.myGenerationsDays} days
            </p>
          ) : null}
        </div>

        {visibleCombos.length > 0 ? (
          <div className="space-y-3">
            {visibleCombos.map((c) => (
              <div
                key={c.id}
                className="border border-rule bg-bg-elevated p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <PowerballRow whiteBalls={c.white_balls} powerball={c.powerball} size="sm" />
                <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-faint">
                  {c.algorithm_used.replace("_", " ")} ·{" "}
                  {new Date(c.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}

            {!isPro && olderCombosCount > 0 ? (
              <div className="border border-gold-deep bg-bg-elevated/40 p-4 flex flex-wrap items-center justify-between gap-3">
                <span className="text-ink-soft text-[13px]">
                  🔒 {olderCombosCount} older{" "}
                  {olderCombosCount === 1 ? "generation" : "generations"} hidden — Pro keeps your full history.
                </span>
                <Link
                  href="/account"
                  className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold hover:text-gold-bright"
                >
                  Upgrade →
                </Link>
              </div>
            ) : null}
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
  const drawDays = [1, 3, 6]; // Mon, Wed, Sat
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

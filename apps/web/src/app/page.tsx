import Link from "next/link";
import {
  GAMES,
  GAME_IDS,
  PRO_BILLING,
  TIERS,
  TIER_ORDER,
  UPCOMING_GAMES,
  DISCLAIMER_SHORT,
  NON_AFFILIATION_DISCLAIMER,
  type GameId,
} from "@millionmind/shared";
import { DisclaimerFooter } from "@/components/DisclaimerFooter";

// Drawing counts shipped with the demo CSVs. Update these when you
// re-import data so the marketing copy stays accurate.
const DEMO_DRAWING_COUNTS: Record<GameId, number> = {
  powerball: 1768,
  megamillions: 890,
};

const TOTAL_DEMO_DRAWINGS = Object.values(DEMO_DRAWING_COUNTS).reduce(
  (sum, n) => sum + n,
  0,
);

const WEEKDAY_NAMES = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function LandingPage() {
  return (
    <main className="page-content max-w-[1180px] mx-auto px-6 md:px-12 py-16 md:py-24">
      {/* Masthead */}
      <header className="border-b border-rule pb-8 mb-16 flex justify-between items-end gap-8">
        <div className="font-display text-[13px] tracking-[0.28em] uppercase text-gold font-medium">
          ◆ Million Mind
        </div>
        <div className="text-right font-mono text-[11px] text-ink-faint tracking-wide leading-loose hidden md:block">
          <span className="block">VERSION 0.1</span>
          <span className="block">WEB · iOS · ANDROID</span>
        </div>
      </header>

      {/* Hero */}
      <section className="mb-24">
        <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold mb-7 flex items-center gap-3.5">
          <span className="block w-8 h-px bg-gold" />
          Statistics & analytics · Powerball + Mega Millions
        </div>
        <h1 className="font-display text-[clamp(48px,7vw,88px)] font-normal leading-[0.98] tracking-[-0.025em] text-ink mb-8">
          Lottery drawings,
          <br />
          <em className="italic text-gold-bright font-light">analyzed deeply.</em>
        </h1>
        <p className="font-display text-[22px] font-light leading-[1.5] text-ink-soft max-w-[720px] italic">
          Frequency heatmaps, gap analysis, Markov chains, Monte Carlo ensembles, anti-syndication picks — historical pattern visualizations across {TOTAL_DEMO_DRAWINGS.toLocaleString()}+ Powerball and Mega Millions drawings. For entertainment and analytical exploration.
        </p>

        <div className="mt-14 flex flex-wrap gap-4">
          <Link
            href="/demo"
            className="inline-block bg-gold text-bg font-mono text-[11px] uppercase tracking-[0.2em] px-7 py-4 hover:bg-gold-bright transition-colors"
          >
            Try the live demo
          </Link>
          <Link
            href="/sign-up"
            className="inline-block border border-gold-deep text-gold font-mono text-[11px] uppercase tracking-[0.2em] px-7 py-4 hover:border-gold transition-colors"
          >
            Create account
          </Link>
          <Link
            href="/sign-in"
            className="inline-block border border-rule text-ink-soft font-mono text-[11px] uppercase tracking-[0.2em] px-7 py-4 hover:text-gold hover:border-gold-deep transition-colors"
          >
            Sign in
          </Link>
        </div>

        <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.15em] text-ink-faint">
          Demo: both games, all 9 algorithms, no sign-in.
        </p>
      </section>

      {/* Games covered */}
      <section className="mb-24">
        <div className="grid grid-cols-[80px_1fr] gap-8 items-baseline mb-12 pb-5 border-b border-rule">
          <div className="font-mono text-[11px] text-gold tracking-wider pt-2.5">§ 01</div>
          <h2 className="font-display text-[42px] font-normal leading-[1.05] tracking-[-0.02em] text-ink">
            Games <em className="italic text-gold">covered</em>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {GAME_IDS.map((id) => {
            const game = GAMES[id];
            const drawDays = game.drawWeekdays
              .map((d) => WEEKDAY_NAMES[d])
              .join(" · ");
            const accentBorder =
              game.accent === "gold" ? "border-gold-deep" : "border-warn-deep";
            const accentText =
              game.accent === "gold" ? "text-gold" : "text-warn";
            return (
              <article
                key={id}
                className={`border ${accentBorder} bg-bg-elevated p-7 flex flex-col gap-5`}
              >
                <header>
                  <p
                    className={`font-mono text-[10px] uppercase tracking-[0.25em] ${accentText} mb-3`}
                  >
                    {game.shortName}
                  </p>
                  <h3 className="font-display text-[32px] font-medium text-ink leading-tight">
                    {game.name}
                  </h3>
                </header>

                <div className="grid grid-cols-2 gap-x-6 gap-y-3 font-mono text-[12px]">
                  <Stat label="Matrix" value={`5 / ${game.whiteMax} + 1 / ${game.specialMax}`} />
                  <Stat label="Draws" value={drawDays} />
                  <Stat label="Time (ET)" value={game.drawTimeEt} />
                  <Stat label="Special ball" value={game.specialName} />
                  <Stat label="Drawings indexed" value={DEMO_DRAWING_COUNTS[id].toLocaleString()} />
                  <Stat label="Jackpot odds" value={game.jackpotOdds} />
                </div>

                <div className="border-t border-rule pt-4 mt-auto flex flex-wrap gap-3">
                  <a
                    href={game.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold hover:text-gold-bright"
                  >
                    Official site ↗
                  </a>
                  <a
                    href={game.officialResultsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft hover:text-gold"
                  >
                    Latest results ↗
                  </a>
                </div>

                <p className="text-ink-faint text-[11px] leading-relaxed">
                  Not affiliated with {game.operator}. Statistical analysis only — drawings cannot be predicted.
                </p>
              </article>
            );
          })}
        </div>

        {/* Upcoming games */}
        <div className="mt-12">
          <div className="flex items-baseline justify-between mb-5">
            <h3 className="font-display text-[24px] text-ink">
              Coming soon
            </h3>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
              Roadmap · post-launch
            </span>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {UPCOMING_GAMES.map((g) => (
              <article
                key={g.id}
                className={`border bg-bg-elevated/50 p-5 flex flex-col gap-3 relative ${
                  g.priority === "next"
                    ? "border-gold-deep"
                    : "border-rule"
                }`}
              >
                <span
                  className={`absolute top-3 right-3 font-mono text-[9px] uppercase tracking-[0.2em] px-2 py-0.5 ${
                    g.priority === "next"
                      ? "text-gold border border-gold-deep"
                      : "text-ink-faint border border-rule"
                  }`}
                >
                  {g.priority === "next" ? "Up Next" : "Soon"}
                </span>

                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint mb-1">
                    {g.shortName}
                  </p>
                  <h4 className="font-display text-[20px] text-ink leading-tight">
                    {g.name}
                  </h4>
                </div>

                <p className="text-ink-soft text-[13px] leading-relaxed italic">
                  {g.tagline}
                </p>

                <div className="space-y-1.5 font-mono text-[11px] text-ink-faint mt-auto pt-3 border-t border-rule-soft">
                  <div>
                    <span className="text-ink-faint/70">Matrix · </span>
                    <span className="text-ink-soft tabular-nums">{g.matrix}</span>
                  </div>
                  <div>
                    <span className="text-ink-faint/70">Schedule · </span>
                    <span className="text-ink-soft">{g.drawSchedule}</span>
                  </div>
                  <div>
                    <span className="text-ink-faint/70">States · </span>
                    <span className="text-ink-soft">{g.states}</span>
                  </div>
                </div>

                <a
                  href={g.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold hover:text-gold-bright"
                >
                  Official site ↗
                </a>
              </article>
            ))}
          </div>

          <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.15em] text-ink-faint">
            One Pro plan covers every game we add — no per-game upsell.
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section className="mb-24">
        <div className="grid grid-cols-[80px_1fr] gap-8 items-baseline mb-12 pb-5 border-b border-rule">
          <div className="font-mono text-[11px] text-gold tracking-wider pt-2.5">§ 02</div>
          <h2 className="font-display text-[42px] font-normal leading-[1.05] tracking-[-0.02em] text-ink">
            Two plans, <em className="italic text-gold">no decisions</em>
          </h2>
        </div>

        <div className="border border-gold-deep bg-bg-panel/40 px-5 py-3 mb-8 flex flex-wrap items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold whitespace-nowrap">
            One subscription
          </span>
          <span className="text-ink-soft text-sm">
            One Pro plan unlocks every algorithm across <strong className="text-ink">both</strong> Powerball and Mega Millions. No per-game upsell, no weekly caps.
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Free card */}
          <article className="border border-rule bg-bg-elevated p-7 flex flex-col gap-5">
            <header>
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-faint mb-3">
                {TIERS.free.tag}
              </p>
              <h3 className="font-display text-[36px] font-medium text-ink leading-tight">
                {TIERS.free.name}
              </h3>
              <p className="font-display text-[42px] text-gold-bright leading-tight mt-2">
                $0
                <span className="font-mono text-[12px] text-ink-faint ml-2">forever</span>
              </p>
            </header>

            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold mb-3">
                Includes
              </p>
              <ul className="text-sm text-ink-soft leading-relaxed space-y-1.5">
                {TIERS.free.features.map((f) => (
                  <li
                    key={f}
                    className="pl-4 relative before:content-['—'] before:absolute before:left-0 before:text-gold"
                  >
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-warn mb-3">
                Locked
              </p>
              <ul className="text-sm text-ink-faint leading-relaxed space-y-1.5">
                {TIERS.free.lockedFeatures.map((f) => (
                  <li
                    key={f}
                    className="pl-4 relative before:content-['🔒'] before:absolute before:left-0 before:text-[10px]"
                  >
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <Link
              href="/sign-up"
              className="mt-auto inline-block text-center border border-rule text-ink-soft font-mono text-[11px] uppercase tracking-[0.2em] py-4 hover:text-gold hover:border-gold-deep transition-colors"
            >
              Start free
            </Link>
          </article>

          {/* Pro card */}
          <article className="border border-gold bg-bg-elevated p-7 flex flex-col gap-5 ring-1 ring-gold/40 relative">
            <span className="absolute -top-3 left-7 bg-gold text-bg font-mono text-[10px] uppercase tracking-[0.2em] px-3 py-1">
              Recommended
            </span>

            <header>
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold mb-3">
                {TIERS.pro.tag}
              </p>
              <h3 className="font-display text-[36px] font-medium text-ink leading-tight">
                {TIERS.pro.name}
              </h3>
              <p className="font-display text-[42px] text-gold-bright leading-tight mt-2">
                ${TIERS.pro.priceMonthlyUsd.toFixed(2)}
                <span className="font-mono text-[12px] text-ink-faint ml-2">/month</span>
              </p>
            </header>

            <ul className="text-sm text-ink-soft leading-relaxed space-y-1.5">
              {TIERS.pro.features.map((f) => (
                <li
                  key={f}
                  className="pl-4 relative before:content-['◆'] before:absolute before:left-0 before:text-gold before:text-[8px] before:top-1.5"
                >
                  {f}
                </li>
              ))}
            </ul>

            <div className="border-t border-rule pt-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold mb-3">
                Or save with annual
              </p>
              <BillingChip
                label="Annual"
                price={`$${PRO_BILLING.annual.priceUsd}/yr`}
                sub={`Save ${PRO_BILLING.annual.savingsPct}% vs. monthly`}
              />
            </div>

            <Link
              href="/sign-up"
              className="mt-auto inline-block text-center bg-gold text-bg font-mono text-[11px] uppercase tracking-[0.2em] py-4 hover:bg-gold-bright transition-colors"
            >
              Get Pro · $2.99/mo
            </Link>
          </article>
        </div>

        <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.15em] text-ink-faint">
          Subscriptions auto-renew unless cancelled at least 24 hours before period end. Cancel any time in your Apple ID or Google Play settings.
        </p>
      </section>

      {/* Algorithms */}
      <section className="mb-24">
        <div className="grid grid-cols-[80px_1fr] gap-8 items-baseline mb-12 pb-5 border-b border-rule">
          <div className="font-mono text-[11px] text-gold tracking-wider pt-2.5">§ 03</div>
          <h2 className="font-display text-[42px] font-normal leading-[1.05] tracking-[-0.02em] text-ink">
            Nine <em className="italic text-gold">algorithms</em>
          </h2>
        </div>
        <p className="text-ink-soft text-[15px] leading-relaxed max-w-[64ch] mb-6">
          Each method produces a valid combination using historical data in a different way. None of them changes the mathematical odds — they&apos;re analytical lenses, not prediction.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ALGO_SHOWCASE.map((a) => (
            <div key={a.name} className="border border-rule bg-bg-elevated p-5">
              <div className="font-display text-[18px] text-ink mb-1">{a.name}</div>
              <div className="text-ink-soft text-[13px] leading-relaxed">{a.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer disclaimer */}
      <p className="text-ink-faint text-sm leading-relaxed max-w-[68ch]">
        {DISCLAIMER_SHORT} {NON_AFFILIATION_DISCLAIMER}
      </p>

      <DisclaimerFooter />
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-[0.2em] text-ink-faint mb-1">
        {label}
      </div>
      <div className="text-ink tabular-nums">{value}</div>
    </div>
  );
}

function BillingChip({
  label,
  price,
  sub,
}: {
  label: string;
  price: string;
  sub: string;
}) {
  return (
    <div className="border border-rule px-4 py-3">
      <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-faint mb-1">
        {label}
      </div>
      <div className="font-display text-[16px] text-ink leading-tight">{price}</div>
      <div className="font-mono text-[10px] text-gold tracking-wider mt-1">{sub}</div>
    </div>
  );
}

const ALGO_SHOWCASE: { name: string; desc: string }[] = [
  { name: "🎲 Random", desc: "Pure uniform sampling — the mathematical baseline." },
  { name: "🔥 Hot", desc: "Frequency-weighted toward most-drawn numbers." },
  { name: "❄️ Cold", desc: "Inverse weighting — favors rarely-drawn numbers." },
  { name: "⏰ Gap", desc: "Surfaces numbers overdue based on days since last draw." },
  { name: "⚖️ Pattern-Balanced", desc: "Sum range, odd/even balance, low/high spread." },
  { name: "🔗 Markov", desc: "Bigram transitions from the most recent drawing." },
  { name: "📈 Monte Carlo", desc: "10,000 candidates scored across balance criteria." },
  { name: "🎯 Mixed", desc: "Combines hot, overdue, and frequency-weighted picks." },
  { name: "🛡️ Anti-Syndication", desc: "Avoids birthday clusters and sequential picks." },
];

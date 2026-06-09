import Link from "next/link";
import {
  GAMES,
  GAME_IDS,
  DISCLAIMER_SHORT,
  NON_AFFILIATION_DISCLAIMER,
  type GameId,
} from "@millionmind/shared";
import { DisclaimerFooter } from "@/components/DisclaimerFooter";
import { CountryToggle } from "@/components/CountryToggle";

// Drawing counts shipped with the static JSON. Updated by the daily
// GitHub Action; no need to edit by hand.
const DEMO_DRAWING_COUNTS: Record<GameId, number> = {
  powerball: 1764,
  megamillions: 891,
};
const TOTAL_DRAWINGS = Object.values(DEMO_DRAWING_COUNTS).reduce((s, n) => s + n, 0);

const WEEKDAY_NAMES = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function LandingPage() {
  return (
    <main className="page-content max-w-[1180px] mx-auto px-6 md:px-12 py-16 md:py-24">
      <header className="border-b border-rule pb-8 mb-16 flex justify-between items-end gap-8">
        <div className="font-display text-[13px] tracking-[0.28em] uppercase text-gold font-medium">
          ◆ Million Mind
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right font-mono text-[11px] text-ink-faint tracking-wide leading-loose hidden md:block">
            <span className="block">VERSION 0.2</span>
            <span className="block">FREE · WEB</span>
          </div>
          <CountryToggle />
        </div>
      </header>

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
          Frequency heatmaps, gap analysis, Markov chains, Monte Carlo ensembles, anti-syndication picks — historical pattern visualizations across {TOTAL_DRAWINGS.toLocaleString()}+ Powerball and Mega Millions drawings. For entertainment and analytical exploration.
        </p>

        <div className="mt-14 flex flex-wrap gap-4">
          <Link
            href="/generate"
            className="inline-block bg-gold text-bg font-mono text-[11px] uppercase tracking-[0.2em] px-7 py-4 hover:bg-gold-bright transition-colors"
          >
            Generate now — free
          </Link>
          <Link
            href="/analytics"
            className="inline-block border border-gold-deep text-gold font-mono text-[11px] uppercase tracking-[0.2em] px-7 py-4 hover:border-gold transition-colors"
          >
            See analytics
          </Link>
          <Link
            href="/history"
            className="inline-block border border-rule text-ink-soft font-mono text-[11px] uppercase tracking-[0.2em] px-7 py-4 hover:text-gold hover:border-gold-deep transition-colors"
          >
            Past drawings
          </Link>
        </div>

        <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.15em] text-ink-faint">
          No sign-up. No subscription. No payment.
        </p>
      </section>

      {/* How it works */}
      <section className="mb-24">
        <div className="grid grid-cols-[80px_1fr] gap-8 items-baseline mb-12 pb-5 border-b border-rule">
          <div className="font-mono text-[11px] text-gold tracking-wider pt-2.5">§ 01</div>
          <h2 className="font-display text-[42px] font-normal leading-[1.05] tracking-[-0.02em] text-ink">
            How it <em className="italic text-gold">works</em>
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="border border-rule bg-bg-elevated p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold mb-3">
              Step 1 · Free
            </p>
            <h3 className="font-display text-[22px] text-ink mb-2 leading-tight">
              5 random combinations every 5 minutes
            </h3>
            <p className="text-ink-soft text-[13px] leading-relaxed">
              The Random algorithm — uniform sampling, the mathematical baseline — is always free. Up to 5 generations per rolling 5-minute window.
            </p>
          </div>
          <div className="border border-gold-deep bg-bg-elevated p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold mb-3">
              Step 2 · Premium
            </p>
            <h3 className="font-display text-[22px] text-ink mb-2 leading-tight">
              Watch one ad → 3 premium algorithm uses
            </h3>
            <p className="text-ink-soft text-[13px] leading-relaxed">
              Hot, Cold, Gap, Pattern-Balanced, Markov, Monte Carlo, Mixed, and Anti-Syndication. One short rewarded ad unlocks 3 uses across any combination of these.
            </p>
          </div>
          <div className="border border-rule bg-bg-elevated p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold mb-3">
              Step 3 · Analyze
            </p>
            <h3 className="font-display text-[22px] text-ink mb-2 leading-tight">
              Heatmaps + pairs + history, free
            </h3>
            <p className="text-ink-soft text-[13px] leading-relaxed">
              Hot/cold heatmaps, top co-occurring pairs, sum distribution, full historical drawings — all free, all the time.
            </p>
          </div>
        </div>
      </section>

      {/* Games covered */}
      <section className="mb-24">
        <div className="grid grid-cols-[80px_1fr] gap-8 items-baseline mb-12 pb-5 border-b border-rule">
          <div className="font-mono text-[11px] text-gold tracking-wider pt-2.5">§ 02</div>
          <h2 className="font-display text-[42px] font-normal leading-[1.05] tracking-[-0.02em] text-ink">
            Games <em className="italic text-gold">covered</em>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {GAME_IDS.map((id) => {
            const game = GAMES[id];
            const drawDays = game.drawWeekdays.map((d) => WEEKDAY_NAMES[d]).join(" · ");
            const accentBorder =
              game.accent === "gold" ? "border-gold-deep" : "border-warn-deep";
            const accentText = game.accent === "gold" ? "text-gold" : "text-warn";
            return (
              <article
                key={id}
                className={`border ${accentBorder} bg-bg-elevated p-7 flex flex-col gap-5`}
              >
                <header>
                  <p className={`font-mono text-[10px] uppercase tracking-[0.25em] ${accentText} mb-3`}>
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
      </section>

      {/* Algorithms showcase */}
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
              <div className="font-display text-[18px] text-ink mb-1">
                {a.name}
                {a.premium ? (
                  <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.15em] text-gold border border-gold-deep px-1.5 py-0.5">
                    Ad-gated
                  </span>
                ) : null}
              </div>
              <div className="text-ink-soft text-[13px] leading-relaxed">{a.desc}</div>
            </div>
          ))}
        </div>
      </section>

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
      <div className="text-[9px] uppercase tracking-[0.2em] text-ink-faint mb-1">{label}</div>
      <div className="text-ink tabular-nums">{value}</div>
    </div>
  );
}

const ALGO_SHOWCASE: { name: string; desc: string; premium: boolean }[] = [
  { name: "🎲 Random", desc: "Pure uniform sampling — the mathematical baseline.", premium: false },
  { name: "🔥 Hot", desc: "Frequency-weighted toward most-drawn numbers.", premium: true },
  { name: "❄️ Cold", desc: "Inverse weighting — favors rarely-drawn numbers.", premium: true },
  { name: "⏰ Gap", desc: "Surfaces numbers overdue based on days since last draw.", premium: true },
  { name: "⚖️ Pattern-Balanced", desc: "Sum range, odd/even balance, low/high spread.", premium: true },
  { name: "🔗 Markov", desc: "Bigram transitions from the most recent drawing.", premium: true },
  { name: "📈 Monte Carlo", desc: "10,000 candidates scored across balance criteria.", premium: true },
  { name: "🎯 Mixed", desc: "Combines hot, overdue, and frequency-weighted picks.", premium: true },
  { name: "🛡️ Anti-Syndication", desc: "Avoids birthday clusters and sequential picks.", premium: true },
];

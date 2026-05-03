import Link from "next/link";
import {
  TIERS,
  TIER_ORDER,
  DISCLAIMER_SHORT,
  NON_AFFILIATION_DISCLAIMER,
} from "@millionmind/shared";
import { DisclaimerFooter } from "@/components/DisclaimerFooter";

export default function LandingPage() {
  return (
    <main className="page-content max-w-[1180px] mx-auto px-12 py-16 md:py-24">
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
          Statistics & analytics
        </div>
        <h1 className="font-display text-[clamp(48px,7vw,88px)] font-normal leading-[0.98] tracking-[-0.025em] text-ink mb-8">
          Powerball drawings,
          <br />
          <em className="italic text-gold-bright font-light">analyzed deeply.</em>
        </h1>
        <p className="font-display text-[22px] font-light leading-[1.5] text-ink-soft max-w-[720px] italic">
          Frequency heatmaps, gap analysis, Markov chains, Monte Carlo ensembles — historical pattern visualizations across 1,800+ Powerball drawings since 2010. For entertainment and analytical exploration.
        </p>

        <div className="mt-14 flex flex-wrap gap-4">
          <Link
            href="/sign-up"
            className="inline-block bg-gold text-bg font-mono text-[11px] uppercase tracking-[0.2em] px-7 py-4 hover:bg-gold-bright transition-colors"
          >
            Get started
          </Link>
          <Link
            href="/sign-in"
            className="inline-block border border-gold-deep text-gold font-mono text-[11px] uppercase tracking-[0.2em] px-7 py-4 hover:border-gold transition-colors"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Tiers */}
      <section className="mb-24">
        <div className="grid grid-cols-[80px_1fr] gap-8 items-baseline mb-12 pb-5 border-b border-rule">
          <div className="font-mono text-[11px] text-gold tracking-wider pt-2.5">§ 01</div>
          <h2 className="font-display text-[42px] font-normal leading-[1.05] tracking-[-0.02em] text-ink">
            Subscription <em className="italic text-gold">tiers</em>
          </h2>
        </div>

        <div className="border border-rule bg-bg-elevated">
          {TIER_ORDER.map((id) => {
            const tier = TIERS[id];
            return (
              <div
                key={id}
                className="grid md:grid-cols-[200px_140px_1fr] border-b border-rule last:border-b-0"
              >
                <div className="p-6 md:border-r border-rule">
                  <div className="font-display text-[22px] font-medium text-ink leading-tight">
                    {tier.name}
                  </div>
                  <div className="font-mono text-[10px] text-gold tracking-[0.15em] uppercase mt-1.5">
                    {tier.tag}
                  </div>
                </div>
                <div className="p-6 md:border-r border-rule">
                  <div className="font-display text-[32px] font-normal text-gold-bright tracking-tight">
                    ${tier.priceMonthlyUsd}
                    <span className="text-[12px] text-ink-faint font-mono ml-1">/mo</span>
                  </div>
                </div>
                <div className="p-6">
                  <ul className="text-sm text-ink-soft leading-relaxed space-y-1">
                    {tier.features.map((f) => (
                      <li key={f} className="pl-4 relative before:content-['—'] before:absolute before:left-0 before:text-gold">
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <p className="text-ink-faint text-sm leading-relaxed max-w-[68ch]">
        {DISCLAIMER_SHORT} {NON_AFFILIATION_DISCLAIMER}
      </p>

      <DisclaimerFooter />
    </main>
  );
}

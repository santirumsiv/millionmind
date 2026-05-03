import Link from "next/link";
import {
  RESPONSIBLE_GAMING_HOTLINE,
  RESPONSIBLE_GAMING_URL,
  POWERBALL_JACKPOT_ODDS,
} from "@millionmind/shared";

export const metadata = { title: "Responsible Gaming — Million Mind" };

export default function ResponsibleGamingPage() {
  return (
    <main className="page-content max-w-3xl mx-auto px-6 py-16">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold mb-4">
        § Legal · Responsible Gaming
      </p>
      <h1 className="font-display text-[44px] leading-[1.05] text-ink mb-8">
        Play responsibly.
      </h1>

      <section className="space-y-5 text-ink-soft leading-relaxed text-[15px]">
        <p className="font-display italic text-ink text-[18px]">
          Million Mind is statistical analysis software. It does not predict winners. The mathematical odds of winning the Powerball jackpot are {POWERBALL_JACKPOT_ODDS} regardless of which numbers you select.
        </p>
        <p>
          Lottery games can be addictive. If gambling is creating problems for you or someone you know, free and confidential help is available 24/7.
        </p>
        <div className="border border-gold-deep bg-bg-elevated p-6 my-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold mb-3">
            National Council on Problem Gambling
          </p>
          <p className="font-display text-[26px] text-ink mb-2">
            <a href={`tel:${RESPONSIBLE_GAMING_HOTLINE.replace(/\D/g, "")}`} className="hover:text-gold">
              {RESPONSIBLE_GAMING_HOTLINE}
            </a>
          </p>
          <p className="font-mono text-[12px] text-ink-soft">
            <a href={RESPONSIBLE_GAMING_URL} className="hover:text-gold underline">
              ncpgambling.org
            </a>
          </p>
        </div>
        <p>You must be 18 years of age or older to play Powerball.</p>
      </section>

      <Link
        href="/"
        className="inline-block mt-12 font-mono text-[11px] uppercase tracking-[0.2em] text-gold hover:text-gold-bright"
      >
        ← Home
      </Link>
    </main>
  );
}

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

      <section className="space-y-6 text-ink-soft leading-relaxed text-[15px]">
        <p className="font-display italic text-ink text-[18px]">
          Million Mind is statistical analysis software. It does not predict winners. The mathematical odds of winning the Powerball jackpot are {POWERBALL_JACKPOT_ODDS} regardless of which numbers you select.
        </p>

        <h2 className="font-display text-[22px] text-ink pt-4">The numbers</h2>
        <p>
          Lottery jackpots are designed around very long odds. Powerball&apos;s jackpot odds are roughly 1 in 292 million. Mega Millions is similar. For perspective, you are statistically more likely to be struck by lightning, attacked by a shark, or become a U.S. president than to win a jackpot. Treat any money you spend on lottery tickets as entertainment — never as an investment.
        </p>
        <p>
          Million Mind&apos;s algorithms — frequency-weighted, gap analysis, Markov chains, Monte Carlo, and the others — are interesting ways to look at historical drawings. They do not change the odds. Every drawing is mathematically independent of every prior drawing.
        </p>

        <h2 className="font-display text-[22px] text-ink pt-4">Warning signs of a problem</h2>
        <p>If any of the following resonate, please reach out for help:</p>
        <ul className="list-disc ml-6 space-y-2">
          <li>Spending more on lottery tickets than you can afford to lose.</li>
          <li>Lying to family or friends about how much you spend or how often you play.</li>
          <li>Chasing losses — buying more tickets to recover money already lost.</li>
          <li>Feeling restless or irritable when you cannot play.</li>
          <li>Missing work, family time, or other obligations to play or check results.</li>
          <li>Borrowing money or selling possessions to fund play.</li>
        </ul>

        <h2 className="font-display text-[22px] text-ink pt-4">Where to get help</h2>

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
            <a href={RESPONSIBLE_GAMING_URL} target="_blank" rel="noopener noreferrer" className="hover:text-gold underline">
              ncpgambling.org
            </a>
          </p>
          <p className="text-ink-soft text-[13px] mt-3 leading-relaxed">
            Free, confidential, available 24 hours a day in all 50 U.S. states. Counseling and support for the person experiencing problems and their family.
          </p>
        </div>

        <h2 className="font-display text-[22px] text-ink pt-4">Other resources</h2>
        <ul className="list-disc ml-6 space-y-2">
          <li>
            <a href="https://www.gamblersanonymous.org" target="_blank" rel="noopener noreferrer" className="text-gold hover:text-gold-bright underline">
              Gamblers Anonymous
            </a>{" "}
            — peer-support group; in-person and online meetings worldwide.
          </li>
          <li>
            <a href="https://www.gamtalk.org" target="_blank" rel="noopener noreferrer" className="text-gold hover:text-gold-bright underline">
              Gam-Talk
            </a>{" "}
            — anonymous online community for problem gamblers and their families.
          </li>
          <li>
            <a href="https://www.gamcare.org.uk" target="_blank" rel="noopener noreferrer" className="text-gold hover:text-gold-bright underline">
              GamCare (UK)
            </a>{" "}
            — UK-based support; phone, live chat, and forum.
          </li>
        </ul>

        <h2 className="font-display text-[22px] text-ink pt-4">Self-exclusion</h2>
        <p>
          Most U.S. states operate a voluntary lottery self-exclusion list. If you decide you want to be barred from purchasing tickets, contact your state lottery commission directly — they handle enrollment. Million Mind does not sell tickets or operate a wagering platform, so we do not have a self-exclusion mechanism, but we encourage anyone who self-excludes from their state lottery to also clear their local data on this site (by clearing browser storage for this domain).
        </p>

        <h2 className="font-display text-[22px] text-ink pt-4">Age requirement</h2>
        <p>
          You must be at least <strong>18 years old</strong> to use Million Mind (21 in some U.S. states). State lotteries enforce their own minimum ages, typically 18 or 21 depending on the state. Do not provide lottery numbers — generated here or anywhere else — to minors.
        </p>

        <h2 className="font-display text-[22px] text-ink pt-4">A note on this site&apos;s framing</h2>
        <p>
          Million Mind frames lottery play as <em>analytical exploration and entertainment</em>, not as a path to wealth. We do not use words like &quot;winning numbers&quot;, &quot;predict&quot;, &quot;boost odds&quot;, or &quot;smart picks.&quot; The algorithms produce statistically-flavored generations that may be more fun to look at than pure random picks, but they have no predictive power. Please use the site in that spirit.
        </p>
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

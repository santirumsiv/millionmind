import Link from "next/link";
import { NON_AFFILIATION_DISCLAIMER } from "@millionmind/shared";

export const metadata = { title: "Terms of Service — Million Mind" };

const LAST_UPDATED = "2026-05-14";

export default function TermsPage() {
  return (
    <main className="page-content max-w-3xl mx-auto px-6 py-16">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold mb-4">
        § Legal · Terms
      </p>
      <h1 className="font-display text-[44px] leading-[1.05] text-ink mb-3">
        Terms of Service.
      </h1>
      <p className="font-mono text-[11px] tracking-[0.15em] text-ink-faint mb-12">
        Last updated: {LAST_UPDATED}
      </p>

      <section className="space-y-6 text-ink-soft leading-relaxed text-[15px]">
        <p className="text-ink-faint text-[13px] italic">
          These are the rules for using Million Mind. By accessing this site you agree to them. This is a plain-English draft and is not a substitute for attorney review.
        </p>

        <h2 className="font-display text-[22px] text-ink pt-4">1. Purpose of the site</h2>
        <p>
          Million Mind is a <strong>statistical analytics and entertainment tool</strong> for the Powerball and Mega Millions lotteries. We display historical drawings, compute frequency and pattern statistics, and generate valid combinations using various analytical methods. Combinations are produced from historical data and probabilistic algorithms; they are <strong>not predictions</strong>.
        </p>
        <p className="font-display italic text-ink">
          Lottery drawings are independent random events. No algorithm, on this site or elsewhere, can predict winning numbers or improve your odds of winning. The historical drawings displayed here are real and verified; the future remains random.
        </p>

        <h2 className="font-display text-[22px] text-ink pt-4">2. No sale, no wager, no payment</h2>
        <p>
          Million Mind does not sell lottery tickets, accept wagers, or process payments. We do not act as an agent for any lottery operator. To play Powerball or Mega Millions, you must buy a ticket from a state-licensed retailer in your jurisdiction.
        </p>

        <h2 className="font-display text-[22px] text-ink pt-4">3. Eligibility</h2>
        <ul className="list-disc ml-6 space-y-2">
          <li>You must be at least <strong>18 years old</strong> (21 in some U.S. states) to use this site.</li>
          <li>You must not be located in <strong>Utah or Hawaii</strong>. Requests from these states are refused at the API layer. This list may expand based on legal guidance.</li>
          <li>You must comply with all local laws regarding lottery participation in your jurisdiction.</li>
        </ul>

        <h2 className="font-display text-[22px] text-ink pt-4">4. Acceptable use</h2>
        <p>You agree not to:</p>
        <ul className="list-disc ml-6 space-y-2">
          <li>Use the site for any unlawful purpose.</li>
          <li>Scrape, crawl, or otherwise access the API outside the rate limits enforced by the site.</li>
          <li>Attempt to circumvent the rate-limit, geo-block, or ad-grant mechanisms.</li>
          <li>Misrepresent the site, copy its content for the purpose of impersonation, or claim affiliation with us.</li>
          <li>Use the site in a way that disrupts service for others.</li>
        </ul>

        <h2 className="font-display text-[22px] text-ink pt-4">5. Non-affiliation</h2>
        <p>{NON_AFFILIATION_DISCLAIMER}</p>
        <p>
          All trademarks and names used on this site to identify state lotteries are the property of their respective owners and are referenced solely for descriptive purposes.
        </p>

        <h2 className="font-display text-[22px] text-ink pt-4">6. No warranty</h2>
        <p>
          The site is provided <strong>&quot;as is&quot;</strong> without warranties of any kind, either express or implied. We do not warrant that the site will be uninterrupted or error-free, that the data will be accurate, or that the statistical methods will produce winning results — they will not.
        </p>

        <h2 className="font-display text-[22px] text-ink pt-4">7. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, Million Mind and its operators are not liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, arising from your use of the site. This includes, without limitation, losses from purchasing lottery tickets based on combinations generated here.
        </p>

        <h2 className="font-display text-[22px] text-ink pt-4">8. Responsible gaming</h2>
        <p>
          Lottery play can be addictive. If you or someone you know has a gambling problem, free and confidential help is available 24/7 in the United States by calling{" "}
          <a href="tel:18004262537" className="text-gold hover:text-gold-bright underline">
            1-800-GAMBLER
          </a>{" "}
          or visiting{" "}
          <a href="https://www.ncpgambling.org" target="_blank" rel="noopener noreferrer" className="text-gold hover:text-gold-bright underline">
            ncpgambling.org
          </a>
          . See our{" "}
          <Link href="/legal/responsible-gaming" className="text-gold hover:text-gold-bright underline">
            Responsible Gaming
          </Link>{" "}
          page for additional resources.
        </p>

        <h2 className="font-display text-[22px] text-ink pt-4">9. Advertising</h2>
        <p>
          Million Mind is free to use and is supported by display advertising served through Google AdSense. See our{" "}
          <Link href="/legal/privacy" className="text-gold hover:text-gold-bright underline">
            Privacy Policy
          </Link>{" "}
          for details on advertising cookies and your opt-out options.
        </p>

        <h2 className="font-display text-[22px] text-ink pt-4">10. Changes</h2>
        <p>
          We may revise these Terms. Continued use of the site after a revision constitutes acceptance of the new Terms. The &quot;Last updated&quot; date at the top of this page reflects the most recent revision.
        </p>

        <h2 className="font-display text-[22px] text-ink pt-4">11. Governing law</h2>
        <p>
          These Terms are governed by the laws of the United States, without regard to conflict-of-law principles. Any dispute that cannot be resolved informally shall be submitted to binding arbitration in the operator&apos;s home jurisdiction, except where prohibited by law.
        </p>

        <h2 className="font-display text-[22px] text-ink pt-4">12. Contact</h2>
        <p>
          For questions about these Terms, contact us via the site&apos;s official channels. Because Million Mind does not maintain user accounts, we cannot respond to individual user-specific requests, but we read general feedback.
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

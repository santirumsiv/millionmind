import Link from "next/link";

export const metadata = { title: "Privacy Policy — Million Mind" };

const LAST_UPDATED = "2026-05-14";

export default function PrivacyPage() {
  return (
    <main className="page-content max-w-3xl mx-auto px-6 py-16">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold mb-4">
        § Legal · Privacy
      </p>
      <h1 className="font-display text-[44px] leading-[1.05] text-ink mb-3">
        Privacy Policy.
      </h1>
      <p className="font-mono text-[11px] tracking-[0.15em] text-ink-faint mb-12">
        Last updated: {LAST_UPDATED}
      </p>

      <section className="space-y-6 text-ink-soft leading-relaxed text-[15px]">
        <p className="text-ink-faint text-[13px] italic">
          This is a plain-English summary of what Million Mind (&quot;we&quot;, &quot;us&quot;) collects and why. It is not a substitute for legal review. If you operate this codebase in another jurisdiction, consult counsel.
        </p>

        <h2 className="font-display text-[22px] text-ink pt-4">1. What we do not collect</h2>
        <p>
          Million Mind does <strong>not</strong> require an account. We do not ask for your name, email address, date of birth, phone number, address, or any government-issued identifier. We do not process payments and have no credit-card data. We do not sell any personal information.
        </p>

        <h2 className="font-display text-[22px] text-ink pt-4">2. What we do collect</h2>
        <p>
          To enforce the free-tier rate limit (five generations per five-minute window) without requiring accounts, we derive a short non-reversible identifier from your request and store associated counters in a managed Redis store (Upstash). Specifically:
        </p>
        <ul className="list-disc ml-6 space-y-2">
          <li>
            <strong>Rate-limit identifier.</strong> A SHA-256 hash of your IP address, browser user-agent string, and the current date (UTC), truncated to 16 hexadecimal characters. The hash is one-way; we cannot recover your IP or user-agent from it. The identifier scope resets every 24 hours.
          </li>
          <li>
            <strong>Counters keyed by that identifier.</strong> Number of free generations made in the rolling 5-minute window, number of premium uses unlocked via rewarded ads, and number of ad-grants made in the rolling 1-hour window. No data about <em>what</em> you generated is stored server-side.
          </li>
          <li>
            <strong>Geolocation headers.</strong> Vercel and Cloudflare append country and region headers to incoming requests (e.g. <code>cf-ipcountry</code>, <code>x-vercel-ip-country-region</code>). We read these only to refuse service to residents of states where local law restricts lottery-adjacent products (currently Utah and Hawaii). These headers are not stored.
          </li>
        </ul>

        <h2 className="font-display text-[22px] text-ink pt-4">3. Data stored on your device</h2>
        <p>
          The browser&apos;s <code>localStorage</code> is used to remember:
        </p>
        <ul className="list-disc ml-6 space-y-2">
          <li>That you accepted the entertainment-only acknowledgment on first visit (so we don&apos;t prompt you again).</li>
          <li>Up to your last 50 generated combinations, for the &quot;Recent generations&quot; list on the home page. This data never leaves your device and is not synced to any server. Clear browser data to delete it.</li>
        </ul>

        <h2 className="font-display text-[22px] text-ink pt-4">4. Advertising — Google AdSense</h2>
        <p>
          This site is monetized by display advertising served through{" "}
          <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="text-gold hover:text-gold-bright underline">
            Google AdSense
          </a>
          . Google and its third-party partners may use cookies, web beacons, or similar technologies to serve ads based on your prior visits to this site or other sites.
        </p>
        <p>
          Google&apos;s use of advertising cookies enables it and its partners to serve ads based on your visit to this and/or other sites on the Internet. You may opt out of personalized advertising by visiting{" "}
          <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-gold hover:text-gold-bright underline">
            Google Ads Settings
          </a>
          . Alternatively, you may opt out of a third-party vendor&apos;s use of cookies for personalized advertising by visiting{" "}
          <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer" className="text-gold hover:text-gold-bright underline">
            www.aboutads.info
          </a>
          .
        </p>
        <p>
          For visitors in the European Economic Area, the United Kingdom, or Switzerland, Google operates as a controller under GDPR for the data it collects through its ad services. See Google&apos;s{" "}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-gold hover:text-gold-bright underline">
            Privacy Policy
          </a>{" "}
          for details on what they collect and how.
        </p>

        <h2 className="font-display text-[22px] text-ink pt-4">5. Product analytics — PostHog</h2>
        <p>
          We use PostHog to understand which features users engage with (e.g. which generation algorithms are popular, whether the rewarded-ad flow completes). PostHog stores an anonymous device identifier in <code>localStorage</code> and records event names like <code>generation_requested</code> and <code>upgrade_cta_clicked</code>. We do not send PostHog any personally identifying information.
        </p>

        <h2 className="font-display text-[22px] text-ink pt-4">6. Error tracking — Sentry</h2>
        <p>
          We use Sentry to collect application errors and stack traces so we can fix bugs. Sentry receives the URL where the error occurred, the browser&apos;s user-agent, and the page&apos;s JavaScript state at the moment of the error. We do not send Sentry any data you entered into the site.
        </p>

        <h2 className="font-display text-[22px] text-ink pt-4">7. Data retention</h2>
        <p>
          The rate-limit counters expire automatically:
        </p>
        <ul className="list-disc ml-6 space-y-2">
          <li>Free-generation timestamps: cleared after 5 minutes.</li>
          <li>Premium-use counters: cleared after 24 hours.</li>
          <li>Ad-grant timestamps: cleared after 1 hour.</li>
          <li>The rate-limit identifier hash itself rotates daily because the date is part of the input.</li>
        </ul>
        <p>
          PostHog event data is retained per their{" "}
          <a href="https://posthog.com/privacy" target="_blank" rel="noopener noreferrer" className="text-gold hover:text-gold-bright underline">
            standard retention policy
          </a>
          . Sentry error data is retained for 90 days.
        </p>

        <h2 className="font-display text-[22px] text-ink pt-4">8. Your rights</h2>
        <p>
          Because we do not collect personal information directly, there is no account to delete or data subject access request to fulfill on our side. Specifically:
        </p>
        <ul className="list-disc ml-6 space-y-2">
          <li>To clear your local Million Mind data, clear your browser&apos;s site data for this domain.</li>
          <li>To opt out of personalized AdSense ads, see the Google Ads Settings link in section 4.</li>
          <li>For data Google, PostHog, or Sentry collect, contact each provider directly under their respective privacy policies.</li>
        </ul>

        <h2 className="font-display text-[22px] text-ink pt-4">9. Children</h2>
        <p>
          Million Mind is intended for users 18 years of age or older (21 in some jurisdictions). We do not knowingly collect any information from children under 13.
        </p>

        <h2 className="font-display text-[22px] text-ink pt-4">10. Geographic restrictions</h2>
        <p>
          Million Mind is currently not available to residents of <strong>Utah</strong> or <strong>Hawaii</strong>. Requests originating from these states are refused at the API layer before any analysis runs. This list may expand based on attorney guidance.
        </p>

        <h2 className="font-display text-[22px] text-ink pt-4">11. Changes</h2>
        <p>
          We may update this policy. The &quot;Last updated&quot; date at the top of this page reflects the most recent revision. Material changes will be highlighted in a notice on the site.
        </p>

        <h2 className="font-display text-[22px] text-ink pt-4">12. Contact</h2>
        <p>
          Questions about this policy can be sent through any of the contact options listed on the{" "}
          <Link href="/legal/terms" className="text-gold hover:text-gold-bright underline">
            Terms of Service
          </Link>{" "}
          page.
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

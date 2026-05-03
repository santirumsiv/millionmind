import Link from "next/link";

export const metadata = { title: "Privacy Policy — Million Mind" };

export default function PrivacyPage() {
  return (
    <main className="page-content max-w-3xl mx-auto px-6 py-16">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold mb-4">
        § Legal · Privacy
      </p>
      <h1 className="font-display text-[44px] leading-[1.05] text-ink mb-8">
        Privacy Policy.
      </h1>

      <section className="space-y-4 text-ink-soft leading-relaxed text-[15px]">
        <p className="font-display italic text-ink text-[18px]">
          Placeholder. This page must be replaced with a CCPA/GDPR-compliant Privacy Policy before launch — Termly, Iubenda, or attorney-drafted (see legal framework §05).
        </p>
        <p>
          Data collected at launch will include: email (for authentication), purchase history (via RevenueCat), generated number combinations (for personal history), and IP address (for security and rate-limiting only). No tracking, no advertising IDs.
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

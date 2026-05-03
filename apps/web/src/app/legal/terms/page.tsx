import Link from "next/link";
import { DISCLAIMER_FULL, NON_AFFILIATION_DISCLAIMER } from "@millionmind/shared";

export const metadata = { title: "Terms of Service — Million Mind" };

export default function TermsPage() {
  return (
    <main className="page-content max-w-3xl mx-auto px-6 py-16">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold mb-4">
        § Legal · Terms
      </p>
      <h1 className="font-display text-[44px] leading-[1.05] text-ink mb-8">
        Terms of Service.
      </h1>

      <section className="space-y-4 text-ink-soft leading-relaxed text-[15px]">
        <p className="font-display italic text-ink text-[18px]">
          Placeholder. This page must be replaced with attorney-reviewed Terms of Service before launch (see legal framework §10).
        </p>
        <p>{DISCLAIMER_FULL}</p>
        <p>{NON_AFFILIATION_DISCLAIMER}</p>
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

"use client";

import Link from "next/link";
import { PRO_BILLING, TIERS } from "@millionmind/shared";
import { track, type AnalyticsEvent } from "@/lib/analytics";

type UpgradeSource = Extract<
  AnalyticsEvent,
  { name: "upgrade_cta_clicked" }
>["source"];

interface UpgradePromptProps {
  /** What the user is trying to access. e.g. "the Powerball heatmap". */
  feature: string;
  /** Optional one-line context. */
  detail?: string;
  variant?: "block" | "inline";
  /** Where in the app this prompt appears — fed into upgrade_cta_clicked. */
  source: UpgradeSource;
}

/**
 * Lockable-content upgrade card. Drop in wherever a Free user hits a
 * Pro-only feature — explains what's behind the lock and offers the
 * cheapest entry point.
 */
export function UpgradePrompt({
  feature,
  detail,
  variant = "block",
  source,
}: UpgradePromptProps) {
  const onClick = () => track({ name: "upgrade_cta_clicked", source });

  if (variant === "inline") {
    return (
      <div className="inline-flex items-center gap-3 border border-gold-deep bg-bg-elevated/40 px-4 py-2.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">
          🔒 Pro
        </span>
        <span className="text-ink-soft text-[13px]">
          {feature} ·{" "}
          <Link
            href="/sign-up"
            onClick={onClick}
            className="text-gold hover:text-gold-bright"
          >
            Unlock for ${TIERS.pro.priceMonthlyUsd.toFixed(2)}/mo
          </Link>
        </span>
      </div>
    );
  }

  return (
    <div className="border border-gold-deep bg-bg-elevated/60 p-8 flex flex-col items-center text-center gap-3">
      <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold">
        🔒 Pro feature
      </span>
      <h3 className="font-display text-[24px] text-ink leading-tight max-w-[40ch]">
        {feature}
      </h3>
      {detail ? (
        <p className="text-ink-soft text-[14px] leading-relaxed max-w-[55ch]">
          {detail}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3 mt-3">
        <Link
          href="/sign-up"
          onClick={onClick}
          className="inline-block bg-gold text-bg font-mono text-[11px] uppercase tracking-[0.2em] px-6 py-3 hover:bg-gold-bright transition-colors"
        >
          Unlock Pro · ${TIERS.pro.priceMonthlyUsd.toFixed(2)}/mo
        </Link>
        <Link
          href="/sign-up"
          onClick={onClick}
          className="inline-block border border-gold-deep text-gold font-mono text-[11px] uppercase tracking-[0.2em] px-6 py-3 hover:border-gold transition-colors"
        >
          Save with annual · ${PRO_BILLING.annual.priceUsd}/yr
        </Link>
      </div>
    </div>
  );
}

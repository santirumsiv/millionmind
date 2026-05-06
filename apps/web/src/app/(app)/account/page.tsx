"use client";

import Link from "next/link";
import {
  TIERS,
  TIER_ORDER,
  RESPONSIBLE_GAMING_HOTLINE,
  RESPONSIBLE_GAMING_URL,
  generationsToCsv,
  todayStampedFilename,
} from "@millionmind/shared";
import { signOut } from "../../(auth)/actions";
import {
  useProfile,
  useUsageThisWeek,
  useMyCombinations,
  tierLabel,
} from "@/lib/queries";
import { downloadCsv } from "@/lib/download";

export default function AccountPage() {
  const { data: profile } = useProfile();
  const { data: usage } = useUsageThisWeek();
  const { data: myCombinations } = useMyCombinations(500);

  const tier = profile?.tier ?? "free";
  const isPro = tier === "pro";
  const cap = TIERS[tier].weeklyGenerationCap;
  const usedCount = usage?.count ?? 0;

  function onExportGenerations() {
    if (!myCombinations || !isPro) return;
    downloadCsv(
      generationsToCsv(myCombinations),
      todayStampedFilename("my_generations"),
    );
  }

  return (
    <main className="space-y-10">
      <section>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold mb-3">
          § Account
        </p>
        <h1 className="font-display text-[44px] leading-[1.05] text-ink mb-3">
          Your profile.
        </h1>
      </section>

      <section className="grid md:grid-cols-2 gap-6">
        <div className="border border-rule bg-bg-elevated p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold mb-3">
            Email
          </p>
          <p className="font-display text-[20px] text-ink break-all">
            {profile?.email ?? "—"}
          </p>
          <p className="font-mono text-[10px] tracking-[0.15em] text-ink-faint mt-3">
            Member since{" "}
            {profile?.created_at
              ? new Date(profile.created_at).toLocaleDateString()
              : "—"}
          </p>
        </div>

        <div className="border border-rule bg-bg-elevated p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold mb-3">
            Current tier
          </p>
          <p className="font-display text-[28px] text-ink leading-tight">
            {tierLabel(tier)}
          </p>
          <p className="font-mono text-[10px] tracking-[0.15em] text-ink-faint mt-2 mb-4">
            ${TIERS[tier].priceMonthlyUsd}/mo · {String(cap)} weekly{" "}
            {cap === "unlimited" ? "" : "generations"}
          </p>
          <div className="text-sm text-ink-soft">
            Used {usedCount} {cap === "unlimited" ? "" : `of ${cap}`} this week.
          </div>
        </div>
      </section>

      {/* Data export — Pro only */}
      {isPro ? (
        <section>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold mb-4">
            Export your data
          </p>
          <div className="border border-rule bg-bg-elevated p-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-display text-[18px] text-ink mb-1">
                Generation history
              </p>
              <p className="text-ink-soft text-[13px] leading-relaxed">
                Download every combination you&apos;ve generated as a CSV.{" "}
                {myCombinations
                  ? `${myCombinations.length} ${myCombinations.length === 1 ? "row" : "rows"} ready.`
                  : "Loading…"}
              </p>
            </div>
            <button
              type="button"
              onClick={onExportGenerations}
              disabled={!myCombinations || myCombinations.length === 0}
              className="border border-gold-deep text-gold font-mono text-[10px] uppercase tracking-[0.2em] px-5 py-3 hover:border-gold disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              ↓ Download CSV
            </button>
          </div>
        </section>
      ) : null}

      <section>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold mb-4">
          Upgrade
        </p>
        <div className="grid md:grid-cols-3 gap-3">
          {TIER_ORDER.filter((id) => id !== "free" && id !== tier).map((id) => {
            const t = TIERS[id];
            return (
              <div key={id} className="border border-rule bg-bg-elevated p-5">
                <div className="flex items-baseline justify-between mb-2">
                  <span className="font-display text-[20px] text-ink">{t.name}</span>
                  <span className="font-display text-[24px] text-gold-bright">
                    ${t.priceMonthlyUsd}
                  </span>
                </div>
                <p className="text-ink-soft text-sm leading-relaxed mb-4">
                  {t.features[0]}
                </p>
                <button
                  type="button"
                  className="w-full border border-gold-deep text-gold font-mono text-[10px] uppercase tracking-[0.2em] py-3 hover:border-gold transition-colors"
                  disabled
                  title="Subscriptions are managed in the mobile app"
                >
                  Subscribe in app
                </button>
              </div>
            );
          })}
        </div>
        <p className="font-mono text-[10px] tracking-[0.15em] text-ink-faint mt-4">
          Subscriptions are managed via the iOS or Android app to avoid duplicate billing.
        </p>
      </section>

      <section>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold mb-4">
          Legal & support
        </p>
        <ul className="border border-rule bg-bg-elevated divide-y divide-rule">
          <li>
            <Link
              href="/legal/terms"
              className="block px-5 py-4 hover:text-gold text-ink-soft text-sm"
            >
              Terms of Service
            </Link>
          </li>
          <li>
            <Link
              href="/legal/privacy"
              className="block px-5 py-4 hover:text-gold text-ink-soft text-sm"
            >
              Privacy Policy
            </Link>
          </li>
          <li>
            <Link
              href="/legal/responsible-gaming"
              className="block px-5 py-4 hover:text-gold text-ink-soft text-sm"
            >
              Responsible Gaming
            </Link>
          </li>
          <li className="px-5 py-4 text-ink-soft text-sm">
            Problem gambling? Call{" "}
            <a
              href={`tel:${RESPONSIBLE_GAMING_HOTLINE.replace(/\D/g, "")}`}
              className="text-gold hover:text-gold-bright"
            >
              {RESPONSIBLE_GAMING_HOTLINE}
            </a>{" "}
            ·{" "}
            <a
              href={RESPONSIBLE_GAMING_URL}
              className="text-gold hover:text-gold-bright underline"
            >
              ncpgambling.org
            </a>
          </li>
        </ul>
      </section>

      <section className="pt-6">
        <form action={signOut}>
          <button
            type="submit"
            className="w-full border border-warn text-warn font-mono text-[11px] uppercase tracking-[0.2em] py-4 hover:bg-warn hover:text-bg transition-colors"
          >
            Sign out
          </button>
        </form>
      </section>
    </main>
  );
}

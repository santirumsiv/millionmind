"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DISCLAIMER_SHORT,
  NON_AFFILIATION_DISCLAIMER,
  RESPONSIBLE_GAMING_HOTLINE,
  RESPONSIBLE_GAMING_URL,
} from "@millionmind/shared";
import { track } from "@/lib/analytics";

/**
 * Click-wrap legal gate shown on first visit. Blocks all interaction
 * with the site until the user explicitly acknowledges the entertainment-
 * only framing, non-affiliation, age requirement, and responsible-gaming
 * resources.
 *
 * Acceptance is persisted in localStorage under a versioned key. Bump
 * ACCEPTANCE_KEY when the terms materially change so all users re-accept.
 *
 * Does not display on the legal pages themselves — users need to be able
 * to read them before agreeing.
 */

const ACCEPTANCE_KEY = "mm:legal_accepted_v1";

const LEGAL_PATHS = ["/legal/terms", "/legal/privacy", "/legal/responsible-gaming"];

export function LegalGate() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    const onLegalPage = LEGAL_PATHS.some((p) => pathname?.startsWith(p));
    if (onLegalPage) return;
    const accepted = window.localStorage.getItem(ACCEPTANCE_KEY);
    if (!accepted) {
      setOpen(true);
      track({ name: "legal_gate_shown" });
    }
  }, [pathname]);

  // Lock body scroll while the gate is open
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  function onAccept() {
    window.localStorage.setItem(
      ACCEPTANCE_KEY,
      JSON.stringify({ accepted_at: new Date().toISOString() }),
    );
    track({ name: "legal_gate_accepted" });
    setOpen(false);
  }

  if (!hydrated || !open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-gate-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-bg/95 backdrop-blur-sm px-4 py-8 overflow-y-auto"
    >
      <div className="max-w-[640px] w-full bg-bg-elevated border border-gold-deep">
        <div className="px-6 md:px-10 py-8 md:py-10 max-h-[calc(100vh-4rem)] overflow-y-auto">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-gold mb-3">
            ◆ Before you continue
          </p>
          <h2
            id="legal-gate-title"
            className="font-display text-[28px] md:text-[36px] leading-[1.1] text-ink mb-5"
          >
            Million Mind is for <em className="italic text-gold-bright">entertainment only</em>.
          </h2>

          <ul className="space-y-3 text-ink-soft text-[14px] leading-relaxed mb-6">
            <li className="pl-5 relative before:content-['—'] before:absolute before:left-0 before:text-gold">
              {DISCLAIMER_SHORT}
            </li>
            <li className="pl-5 relative before:content-['—'] before:absolute before:left-0 before:text-gold">
              No algorithm on this site changes the mathematical odds of winning the lottery. The historical drawings are real; the future is random.
            </li>
            <li className="pl-5 relative before:content-['—'] before:absolute before:left-0 before:text-gold">
              {NON_AFFILIATION_DISCLAIMER}
            </li>
            <li className="pl-5 relative before:content-['—'] before:absolute before:left-0 before:text-gold">
              Million Mind does <strong>not</strong> sell lottery tickets, place wagers, or process payments. Buy tickets only from authorized retailers in your state.
            </li>
            <li className="pl-5 relative before:content-['—'] before:absolute before:left-0 before:text-gold">
              You must be <strong>18 years of age or older</strong> to use this site (21+ in some jurisdictions).
            </li>
            <li className="pl-5 relative before:content-['—'] before:absolute before:left-0 before:text-gold">
              Problem gambling?{" "}
              <a
                href={`tel:${RESPONSIBLE_GAMING_HOTLINE.replace(/\D/g, "")}`}
                className="text-gold hover:text-gold-bright"
              >
                Call {RESPONSIBLE_GAMING_HOTLINE}
              </a>{" "}
              or visit{" "}
              <a
                href={RESPONSIBLE_GAMING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold hover:text-gold-bright"
              >
                ncpgambling.org
              </a>
              .
            </li>
          </ul>

          <p className="text-ink-faint text-[12px] leading-relaxed mb-7">
            By clicking <strong>I understand and agree</strong>, you confirm that you are 18 or older and that you have read and accept the{" "}
            <Link href="/legal/terms" className="text-gold hover:text-gold-bright underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/legal/privacy" className="text-gold hover:text-gold-bright underline">
              Privacy Policy
            </Link>
            .
          </p>

          <button
            type="button"
            onClick={onAccept}
            className="w-full bg-gold text-bg font-mono text-[12px] uppercase tracking-[0.25em] py-4 hover:bg-gold-bright transition-colors font-semibold"
          >
            I understand and agree
          </button>

          <p className="text-center font-mono text-[10px] uppercase tracking-[0.15em] text-ink-faint mt-4">
            If you do not agree, please close this tab.
          </p>
        </div>
      </div>
    </div>
  );
}

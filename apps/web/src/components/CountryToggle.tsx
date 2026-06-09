"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * US / CA region switch shown top-right in both headers.
 *
 * US section lives at /home, /generate, /analytics, /history.
 * CA section lives under /ca. We persist the last choice so the root route
 * can honor it, and infer the active region from the current path.
 */
export function CountryToggle() {
  const pathname = usePathname();
  const isCa = pathname?.startsWith("/ca") ?? false;

  useEffect(() => {
    try {
      window.localStorage.setItem("mm:country", isCa ? "CA" : "US");
    } catch {
      /* ignore */
    }
  }, [isCa]);

  return (
    <div
      className="flex items-center border border-rule overflow-hidden"
      role="group"
      aria-label="Region"
    >
      <Link
        href="/home"
        aria-current={!isCa ? "page" : undefined}
        className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors ${
          !isCa ? "bg-gold text-bg" : "bg-bg-elevated text-ink-soft hover:text-gold"
        }`}
      >
        🇺🇸 US
      </Link>
      <Link
        href="/ca"
        aria-current={isCa ? "page" : undefined}
        className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors border-l border-rule ${
          isCa ? "bg-gold text-bg" : "bg-bg-elevated text-ink-soft hover:text-gold"
        }`}
      >
        🇨🇦 CA
      </Link>
    </div>
  );
}

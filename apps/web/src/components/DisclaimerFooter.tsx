import Link from "next/link";
import {
  DISCLAIMER_SHORT,
  RESPONSIBLE_GAMING_HOTLINE,
  RESPONSIBLE_GAMING_URL,
} from "@millionmind/shared";

export function DisclaimerFooter() {
  return (
    <footer className="mt-32 pt-10 border-t border-rule text-center font-mono text-[11px] tracking-wider text-ink-faint leading-loose">
      <div className="text-gold text-[14px] mb-4">◆ ◆ ◆</div>
      MILLION MIND &nbsp; · &nbsp; v0.1
      <br />
      <span className="opacity-60">{DISCLAIMER_SHORT}</span>
      <br />
      <span className="opacity-60">
        Problem gambling? Call {RESPONSIBLE_GAMING_HOTLINE} ·{" "}
        <a href={RESPONSIBLE_GAMING_URL} className="underline hover:text-gold">
          ncpgambling.org
        </a>
      </span>
      <br />
      <span className="opacity-40 mt-2 inline-block">
        <Link href="/legal/terms" className="hover:text-gold">Terms</Link>
        {" · "}
        <Link href="/legal/privacy" className="hover:text-gold">Privacy</Link>
        {" · "}
        <Link href="/legal/responsible-gaming" className="hover:text-gold">Responsible Gaming</Link>
      </span>
    </footer>
  );
}

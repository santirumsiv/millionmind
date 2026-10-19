import Link from "next/link";
import { CountryToggle } from "@/components/CountryToggle";

const NAV: Array<{ href: "/home" | "/generate" | "/analytics" | "/history"; label: string }> = [
  { href: "/home", label: "Home" },
  { href: "/generate", label: "Generate" },
  { href: "/analytics", label: "Analytics" },
  { href: "/history", label: "History" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-content max-w-[1180px] mx-auto px-6 md:px-12 py-8">
      <header className="flex items-center justify-between border-b border-rule pb-5 mb-10">
        <Link href="/home" className="font-mono text-[12px] tracking-[0.28em] uppercase text-gold font-medium">
          ◆ Million Mind
        </Link>
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex gap-6">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft hover:text-gold"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <CountryToggle />
        </div>
      </header>

      {children}

      <nav className="md:hidden flex justify-around border-t border-rule mt-16 pt-4">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft hover:text-gold"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

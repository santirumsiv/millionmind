import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { signOut } from "../(auth)/actions";

const NAV: Array<{ href: "/home" | "/analytics" | "/generate" | "/history" | "/account"; label: string }> = [
  { href: "/home", label: "Home" },
  { href: "/analytics", label: "Analytics" },
  { href: "/generate", label: "Generate" },
  { href: "/history", label: "History" },
  { href: "/account", label: "Account" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/sign-in");

  return (
    <div className="page-content max-w-[1180px] mx-auto px-6 md:px-12 py-8">
      <header className="flex items-center justify-between border-b border-rule pb-5 mb-10">
        <Link href="/home" className="font-mono text-[12px] tracking-[0.28em] uppercase text-gold font-medium">
          ◆ Million Mind
        </Link>
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
        <form action={signOut}>
          <button
            type="submit"
            className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint hover:text-warn"
          >
            Sign out
          </button>
        </form>
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

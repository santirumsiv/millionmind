"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { DISCLAIMER_SHORT } from "@millionmind/shared";
import { signUpWithEmail } from "../actions";

export default function SignUpPage() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  function onSubmit(formData: FormData) {
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const result = await signUpWithEmail(formData);
      if (result.error) setError(result.error);
      else if (result.info) setInfo(result.info);
    });
  }

  return (
    <main className="page-content max-w-md mx-auto px-6 py-24">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold mb-3">
        ◆ Million Mind
      </p>
      <h1 className="font-display text-[44px] leading-[1.05] text-ink mb-3">
        Start free.
      </h1>
      <p className="text-ink-soft text-[15px] leading-relaxed mb-8">
        Free Explorer tier — 3 random combinations weekly. Upgrade any time.
      </p>

      <form action={onSubmit} className="space-y-3 mb-3">
        <input
          name="email"
          type="email"
          required
          placeholder="Email"
          autoComplete="email"
          className="w-full bg-bg-elevated border border-rule text-ink px-4 py-4 placeholder:text-ink-faint outline-none focus:border-gold-deep"
        />
        <input
          name="password"
          type="password"
          required
          minLength={8}
          placeholder="Password (min 8 characters)"
          autoComplete="new-password"
          className="w-full bg-bg-elevated border border-rule text-ink px-4 py-4 placeholder:text-ink-faint outline-none focus:border-gold-deep"
        />

        {error ? <p className="text-warn text-sm">{error}</p> : null}
        {info ? <p className="text-green text-sm">{info}</p> : null}

        <button
          type="submit"
          disabled={pending}
          className="w-full bg-gold text-bg font-mono text-[11px] uppercase tracking-[0.2em] py-4 hover:bg-gold-bright disabled:opacity-50 transition-colors"
        >
          {pending ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="text-center text-ink-soft text-sm mt-8">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-gold font-medium hover:text-gold-bright">
          Sign in
        </Link>
      </p>

      <p className="text-ink-faint text-[11px] leading-relaxed mt-10 text-center">
        {DISCLAIMER_SHORT}
      </p>
    </main>
  );
}

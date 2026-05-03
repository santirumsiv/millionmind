"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { signInWithEmail } from "../actions";

export default function SignInPage() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await signInWithEmail(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <main className="page-content max-w-md mx-auto px-6 py-24">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold mb-3">
        ◆ Million Mind
      </p>
      <h1 className="font-display text-[44px] leading-[1.05] text-ink mb-8">
        Welcome back.
      </h1>

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
          placeholder="Password"
          autoComplete="current-password"
          className="w-full bg-bg-elevated border border-rule text-ink px-4 py-4 placeholder:text-ink-faint outline-none focus:border-gold-deep"
        />

        {error ? <p className="text-warn text-sm">{error}</p> : null}

        <button
          type="submit"
          disabled={pending}
          className="w-full bg-gold text-bg font-mono text-[11px] uppercase tracking-[0.2em] py-4 hover:bg-gold-bright disabled:opacity-50 transition-colors"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <Link
        href="/forgot-password"
        className="block text-center font-mono text-[10px] tracking-[0.15em] uppercase text-ink-soft hover:text-gold py-2"
      >
        Forgot password?
      </Link>

      <p className="text-center text-ink-soft text-sm mt-8">
        New here?{" "}
        <Link href="/sign-up" className="text-gold font-medium hover:text-gold-bright">
          Create an account
        </Link>
      </p>
    </main>
  );
}

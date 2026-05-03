"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { resetPassword } from "../(auth)/actions";

export default function ForgotPasswordPage() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  function onSubmit(formData: FormData) {
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const result = await resetPassword(formData);
      if (result.error) setError(result.error);
      else if (result.info) setInfo(result.info);
    });
  }

  return (
    <main className="page-content max-w-md mx-auto px-6 py-24">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold mb-3">
        Reset password
      </p>
      <h1 className="font-display text-[40px] leading-[1.05] text-ink mb-8">
        We&apos;ll send a link.
      </h1>

      <form action={onSubmit} className="space-y-3 mb-6">
        <input
          name="email"
          type="email"
          required
          placeholder="Email"
          autoComplete="email"
          className="w-full bg-bg-elevated border border-rule text-ink px-4 py-4 placeholder:text-ink-faint outline-none focus:border-gold-deep"
        />

        {error ? <p className="text-warn text-sm">{error}</p> : null}
        {info ? <p className="text-green text-sm">{info}</p> : null}

        <button
          type="submit"
          disabled={pending}
          className="w-full bg-gold text-bg font-mono text-[11px] uppercase tracking-[0.2em] py-4 hover:bg-gold-bright disabled:opacity-50 transition-colors"
        >
          {pending ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <Link
        href="/sign-in"
        className="block text-center font-mono text-[10px] uppercase tracking-[0.15em] text-gold hover:text-gold-bright"
      >
        ← Back to sign in
      </Link>
    </main>
  );
}

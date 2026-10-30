"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AUTH_SUBMIT } from "@/components/auth/AuthParts";

/** "Forgot password": asks for an email and sends a reset link. The answer is the same whether or not the email has an account. */
export default function ForgotForm({ expired }: { expired: boolean }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(expired ? "That reset link has expired or was already used. Request a new one below." : null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`;
    const { error } = await createClient().auth.resetPasswordForEmail(email.trim(), { redirectTo });
    setBusy(false);
    // Never reveal whether an email is registered; only report real failures (rate limit, network).
    if (error && error.status !== 400) {
      setError("We couldn't send that email right now. Please wait a minute and try again.");
      return;
    }
    setSent(true);
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-16 shrink-0 items-center justify-between px-6 sm:px-8">
        <Link href="/login" className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wider hover:opacity-70">
          <ChevronLeft className="h-4 w-4" /> Back to log in
        </Link>
      </header>

      <main className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-6 pb-16">
        <div className="w-full max-w-[342px] text-center">
          <h1 className="font-display text-2xl font-semibold">Reset your password</h1>
          {sent ? (
            <p role="status" className="mt-6 bg-sand px-4 py-3 text-sm">
              If that email has an account, a reset link is on its way. Open it in this same browser. It can take a minute, so check your spam folder too.
            </p>
          ) : (
            <>
              <p className="mt-3 text-sm text-slate">Enter your email and we will send you a link to choose a new password.</p>
              <form onSubmit={submit} className="mt-8 space-y-4 text-left">
                <label className="block text-sm">
                  Email
                  <input className="input mt-1" type="email" autoComplete="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
                </label>
                <button disabled={busy} className={AUTH_SUBMIT}>{busy ? "One moment…" : "Send reset link"}</button>
              </form>
            </>
          )}
          {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
        </div>
      </main>
    </div>
  );
}

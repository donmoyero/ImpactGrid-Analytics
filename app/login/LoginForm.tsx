"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ChevronLeft, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AUTH_BTN, AUTH_SUBMIT, GoogleG } from "@/components/auth/AuthParts";

/**
 * Sign in for people who ALREADY have an account: Google, or email + password. Same layout as the last step of
 * Get started ("Create Your Account"), but it only signs in. Creating an account happens in Get started.
 */
export default function LoginForm({ next, linkError }: { next: string; linkError: boolean }) {
  const [manual, setManual] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(linkError ? "That sign-in link didn't work. Please try again." : null);
  const emailRef = useRef<HTMLInputElement>(null);

  const qs = next ? `?next=${encodeURIComponent(next)}` : "";
  const callback = () => `${window.location.origin}/auth/callback${qs}`;

  function openManual() {
    setManual(true);
    setTimeout(() => emailRef.current?.focus(), 0);
  }

  async function google() {
    setBusy(true);
    setError(null);
    // prompt: select_account makes Google show its account chooser every time, so a new email can be used after signing out.
    const { error } = await createClient().auth.signInWithOAuth({ provider: "google", options: { redirectTo: callback(), queryParams: { prompt: "select_account" } } });
    if (error) {
      setError("Google sign-in isn't available right now. Please use email instead.");
      setBusy(false);
    }
  }

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await createClient().auth.signInWithPassword({ email, password });
    if (error) {
      setError("Those details didn't match. Please try again.");
      setBusy(false);
      return;
    }
    // Full page load so the server sees the fresh session; /auth/continue hands them to the platform (or the validated ?next=).
    window.location.assign(`/auth/continue${qs}`);
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-16 shrink-0 items-center justify-between px-6 sm:px-8">
        <Link href="/" className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wider hover:opacity-70">
          <ChevronLeft className="h-4 w-4" /> Back
        </Link>
        <Link href="/get-started" className="text-xs font-medium uppercase tracking-wider hover:opacity-70">Get started</Link>
      </header>

      <main className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-6 pb-16">
        <div className="w-full max-w-[342px] text-center">
          <h1 className="font-display text-2xl font-semibold">Welcome Back</h1>
          <p className="mt-3 text-sm text-slate">Sign in to your ShopPlug account.</p>

          <div className="mt-8 space-y-[11px]">
            <button type="button" onClick={google} disabled={busy} className={AUTH_BTN}>
              <GoogleG />
              <span className="flex-1 pr-[18px]">Sign in with Google</span>
            </button>
            <button type="button" onClick={openManual} disabled={busy} className={AUTH_BTN} aria-expanded={manual}>
              <Mail className="h-[18px] w-[18px]" aria-hidden />
              <span className="flex-1 pr-[18px]">Sign in with Email</span>
            </button>
          </div>

          {manual && (
            <form onSubmit={signIn} className="mt-8 space-y-4 text-left">
              <label className="block text-sm">
                Email
                <input ref={emailRef} className="input mt-1" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>
              <label className="block text-sm">
                Password
                <input className="input mt-1" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </label>
              <button disabled={busy} className={AUTH_SUBMIT}>{busy ? "One moment…" : "Sign in"}</button>
              <p className="text-center text-sm"><Link href="/forgot-password" className="font-medium underline">Forgot password?</Link></p>
            </form>
          )}

          {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}

          <p className="mt-8 text-sm text-slate">
            New to ShopPlug?{" "}
            <Link href="/get-started" className="font-medium text-paper underline">Get started</Link>
          </p>
        </div>
      </main>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowRight, ChevronLeft, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { buildStartUrl, stepUrl, type OnboardingAnswers } from "@/lib/onboarding";

/**
 * Fill these in when the pages exist (e.g. "/terms" and "/privacy"). The "By creating an account…" line only
 * shows when both are set, so the page never says people agree to something that isn't there to read.
 */
const LEGAL = { terms: "", privacy: "" };

const BTN = "flex h-[55px] w-full items-center border border-paper bg-white px-5 text-sm font-medium text-paper transition-colors hover:bg-sand disabled:opacity-60";

/** Last step of Get started: a clean, centred "Create your account" page. Google, email, or "More options" (also email). */
export default function AccountStep({ answers, signedIn }: { answers: OnboardingAnswers; signedIn: boolean }) {
  const startUrl = buildStartUrl(answers);
  const qs = `?next=${encodeURIComponent(startUrl)}`;
  const [manual, setManual] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const callback = () => `${window.location.origin}/auth/callback${qs}`;

  function openManual() {
    setManual(true);
    setTimeout(() => emailRef.current?.focus(), 0);
  }

  async function google() {
    setBusy(true);
    setError(null);
    const { error } = await createClient().auth.signInWithOAuth({ provider: "google", options: { redirectTo: callback() } });
    if (error) {
      setError("Google sign-in isn't available right now. Please use email instead.");
      setBusy(false);
    }
  }

  async function createAccount(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    const { data, error } = await createClient().auth.signUp({ email, password, options: { emailRedirectTo: callback() } });
    setBusy(false);
    if (error) {
      setError(error.message.toLowerCase().includes("password") ? "Please choose a stronger password (at least 8 characters)." : "We couldn't create that account. Please try again.");
      return;
    }
    // Full page load so the server sees the new session; /auth/continue then hands them to the platform.
    if (data.session) window.location.assign(`/auth/continue${qs}`);
    else setNotice("Check your email and click the link to finish creating your account.");
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-16 shrink-0 items-center justify-between px-6 sm:px-8">
        <Link href={stepUrl(2, answers)} className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wider hover:opacity-70">
          <ChevronLeft className="h-4 w-4" /> Back
        </Link>
        <Link href={`/login${qs}`} className="text-xs font-medium uppercase tracking-wider hover:opacity-70">Log in</Link>
      </header>

      <main className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-6 pb-16">
        {signedIn ? (
          <div className="w-full max-w-[342px] text-center">
            <h1 className="font-display text-2xl font-semibold">You are all set, {answers.name}.</h1>
            <p className="mt-4 text-sm text-slate">You are already signed in. Continue to open your dashboard.</p>
            <a href={startUrl} className="mt-8 flex h-[55px] w-full items-center justify-center gap-2 bg-paper text-sm font-medium text-white">
              Open my dashboard <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        ) : (
          <div className="w-full max-w-[342px] text-center">
            <h1 className="font-display text-2xl font-semibold">Create Your Account</h1>

            {LEGAL.terms && LEGAL.privacy && (
              <p className="mt-8 text-xs leading-relaxed text-slate">
                By creating an account, you agree to our{" "}
                <Link href={LEGAL.terms} className="underline">Terms of Service</Link> and have read and understood the{" "}
                <Link href={LEGAL.privacy} className="underline">Privacy Policy</Link>
              </p>
            )}

            <div className="mt-8 space-y-[11px]">
              <button type="button" onClick={google} disabled={busy} className={BTN}>
                <GoogleG />
                <span className="flex-1 pr-[18px]">Continue with Google</span>
              </button>
              <button type="button" onClick={openManual} disabled={busy} className={BTN} aria-expanded={manual}>
                <Mail className="h-[18px] w-[18px]" aria-hidden />
                <span className="flex-1 pr-[18px]">Continue with Email</span>
              </button>
            </div>

            {!manual && (
              <button type="button" onClick={openManual} className="mt-6 text-xs font-medium uppercase tracking-wider hover:opacity-70">
                More options
              </button>
            )}

            {manual && (
              <form onSubmit={createAccount} className="mt-8 space-y-4 text-left">
                <label className="block text-sm">
                  Email
                  <input ref={emailRef} className="input mt-1" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </label>
                <label className="block text-sm">
                  Password
                  <input className="input mt-1" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
                  <span className="mt-1 block text-xs text-slateLight">At least 8 characters.</span>
                </label>
                <button disabled={busy} className="flex h-[55px] w-full items-center justify-center bg-paper text-sm font-medium text-white disabled:opacity-60">
                  {busy ? "One moment…" : "Create account"}
                </button>
              </form>
            )}

            {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
            {notice && <p role="status" className="mt-4 bg-sand px-4 py-3 text-sm">{notice}</p>}
          </div>
        )}
      </main>
    </div>
  );
}

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z" />
      <path fill="#FBBC05" d="M10.5 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowRight, ChevronLeft, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { buildStartUrl, stepUrl, type OnboardingAnswers } from "@/lib/onboarding";
import { AUTH_BTN as BTN, AUTH_SUBMIT, GoogleG } from "@/components/auth/AuthParts";

/**
 * Fill these in when the pages exist (e.g. "/terms" and "/privacy"). The "By creating an account…" line only
 * shows when both are set, so the page never says people agree to something that isn't there to read.
 */
const LEGAL = { terms: "", privacy: "" };

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
  const [exists, setExists] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

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

  async function createAccount(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    setExists(false);
    const { data, error } = await createClient().auth.signUp({ email, password, options: { emailRedirectTo: callback() } });
    setBusy(false);
    if (error) {
      setError(error.message.toLowerCase().includes("password") ? "Please choose a stronger password (at least 8 characters)." : "We couldn't create that account. Please try again.");
      return;
    }
    // Supabase hides whether an email is taken: it answers "success" with no identities. Say so, and point to Log in.
    if (data.user && data.user.identities?.length === 0) {
      setExists(true);
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
        <Link href={`/login${qs}`} className="text-xs font-medium uppercase tracking-wider hover:opacity-70">Already have an account? Log in</Link>
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
                <button disabled={busy} className={AUTH_SUBMIT}>
                  {busy ? "One moment…" : "Create account"}
                </button>
              </form>
            )}

            {exists && (
              <p role="alert" className="mt-4 bg-sand px-4 py-3 text-sm">
                That email already has an account.{" "}
                <Link href={`/login${qs}`} className="font-medium underline">Log in instead</Link>
              </p>
            )}
            {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
            {notice && <p role="status" className="mt-4 bg-sand px-4 py-3 text-sm">{notice}</p>}
          </div>
        )}
      </main>
    </div>
  );
}

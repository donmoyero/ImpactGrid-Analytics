"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm({ next, linkError }: { next: string; linkError: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(linkError ? "That sign-in link didn't work. Please try again." : null);
  const [busy, setBusy] = useState(false);

  const callback = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  // Full page load so the server sees the fresh session; /auth/continue sends admins to /admin and everyone else to the platform.
  const goAfterLogin = () => window.location.assign(`/auth/continue?next=${encodeURIComponent(next)}`);

  async function google() {
    setBusy(true);
    setError(null);
    const { error } = await createClient().auth.signInWithOAuth({ provider: "google", options: { redirectTo: callback() } });
    if (error) {
      setError("Google sign-in isn't available right now. Please use email instead.");
      setBusy(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("Those details didn't match. Please try again.");
      setBusy(false);
      return;
    }
    goAfterLogin();
  }

  return (
    <div className="mt-8">
      <button
        type="button"
        onClick={google}
        disabled={busy}
        className="flex w-full items-center justify-center gap-3 rounded-full border border-line2 bg-ink2 px-5 py-3 text-sm font-medium text-paper transition-colors hover:bg-sand disabled:opacity-60"
      >
        <GoogleG />
        Continue with Google
      </button>

      <div className="my-6 flex items-center gap-3 text-xs text-slateLight" aria-hidden>
        <span className="h-px flex-1 bg-line" />
        or use your email
        <span className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm">
          Email
          <input className="input mt-1" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="block text-sm">
          Password
          <input
            className="input mt-1"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <button disabled={busy} className="w-full rounded-full bg-signal px-5 py-3 text-sm font-medium text-ink disabled:opacity-60">
          {busy ? "One moment…" : "Sign in"}
        </button>
      </form>
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

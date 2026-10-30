"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AUTH_SUBMIT } from "@/components/auth/AuthParts";

export default function ResetForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("The two passwords don't match.");
      return;
    }
    setBusy(true);
    const { error } = await createClient().auth.updateUser({ password });
    if (error) {
      setError(error.message.toLowerCase().includes("password") ? "Please choose a different, stronger password (at least 8 characters)." : "We couldn't update your password. Please request a new link.");
      setBusy(false);
      return;
    }
    // Full page load so the server sees the session; /auth/continue hands them to the platform.
    window.location.assign("/auth/continue");
  }

  return (
    <div className="flex h-full flex-col">
      <header className="h-16 shrink-0" />
      <main className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-6 pb-16">
        <div className="w-full max-w-[342px] text-center">
          <h1 className="font-display text-2xl font-semibold">Choose a new password</h1>
          <form onSubmit={submit} className="mt-8 space-y-4 text-left">
            <label className="block text-sm">
              New password
              <input className="input mt-1" type="password" autoComplete="new-password" required minLength={8} autoFocus value={password} onChange={(e) => setPassword(e.target.value)} />
              <span className="mt-1 block text-xs text-slateLight">At least 8 characters.</span>
            </label>
            <label className="block text-sm">
              Retype new password
              <input className="input mt-1" type="password" autoComplete="new-password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </label>
            <button disabled={busy} className={AUTH_SUBMIT}>{busy ? "One moment…" : "Save new password"}</button>
          </form>
          {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
        </div>
      </main>
    </div>
  );
}

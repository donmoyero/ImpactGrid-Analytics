"use client";

import { createClient } from "@/lib/supabase/client";

export default function SignOutButton({ className, onDone }: { className?: string; onDone?: () => void }) {
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await createClient().auth.signOut();
        } catch {
          // the server step below still clears the cookies
        }
        // The server removes every copy of the sign-in cookie on this site (see app/auth/signout).
        try {
          await fetch("/auth/signout", { method: "POST", redirect: "manual" });
        } catch {
          // fall through to the reload
        }
        onDone?.();
        // Full page load so nothing on screen (or in the server's cache) still thinks someone is signed in.
        window.location.assign("/");
      }}
      className={className ?? "w-full rounded-lg px-3 py-2 text-left text-sm text-slate hover:text-paper"}
    >
      Sign out
    </button>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await createClient().auth.signOut();
        router.replace("/");
        router.refresh();
      }}
      className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate hover:text-paper"
    >
      Sign out
    </button>
  );
}

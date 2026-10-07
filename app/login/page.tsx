import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LoginForm from "./LoginForm";
import { safeDestination } from "@/lib/platform";

export const metadata = { title: "Sign in | ImpactGrid Analytics", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: { next?: string; error?: string } }) {
  // "" means "no particular destination": after sign-in the platform decides where this person belongs.
  const next = safeDestination(searchParams.next) ?? "";

  const { data: { user } } = await createClient().auth.getUser();
  if (user) redirect(`/auth/continue${next ? `?next=${encodeURIComponent(next)}` : ""}`);

  return (
    <main className="mx-auto max-w-md px-6 py-20">
      <h1 className="font-display text-3xl md:text-4xl">Sign in to ImpactGrid</h1>
      <p className="mt-2 text-slate">One account for your business, your team and your website.</p>
      <LoginForm next={next} linkError={searchParams.error === "1"} />
    </main>
  );
}

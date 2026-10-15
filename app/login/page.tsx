import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LoginForm from "./LoginForm";
import { safeDestination } from "@/lib/platform";

export const metadata = { title: "Sign in | ImpactGrid Analytics", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: { next?: string; error?: string; mode?: string } }) {
  // Old "?mode=signup" links: creating an account now only happens through Get started.
  if (searchParams.mode === "signup") redirect("/get-started");

  // "" means "no particular destination": after sign-in the platform decides where this person belongs.
  const next = safeDestination(searchParams.next) ?? "";

  const { data: { user } } = await createClient().auth.getUser();
  if (user) redirect(`/auth/continue${next ? `?next=${encodeURIComponent(next)}` : ""}`);

  return <LoginForm next={next} linkError={searchParams.error === "1"} />;
}

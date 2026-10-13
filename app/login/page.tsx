import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LoginForm from "./LoginForm";
import { PLATFORM_LOGIN_URL } from "@/lib/platform";

export const metadata = { title: "Site admin sign in | ImpactGrid Analytics", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: { next?: string; error?: string } }) {
  // Only allow same-site relative redirects.
  const n = searchParams.next;
  const next = n && n.startsWith("/") && !n.startsWith("//") && !n.startsWith("/\\") ? n : "/admin";

  const { data: { user } } = await createClient().auth.getUser();
  if (user) redirect(`/auth/continue?next=${encodeURIComponent(next)}`);

  return (
    <main className="mx-auto max-w-md px-6 py-20">
      <h1 className="font-display text-3xl md:text-4xl">Site admin sign in</h1>
      <p className="mt-2 text-slate">
        For ImpactGrid site administrators, to edit the homepage. Running a business on ImpactGrid?{" "}
        <a href={PLATFORM_LOGIN_URL} className="underline hover:text-paper">Sign in on the platform</a>.
      </p>
      <LoginForm next={next} linkError={searchParams.error === "1"} />
    </main>
  );
}

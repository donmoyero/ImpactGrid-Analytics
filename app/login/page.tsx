import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LoginForm from "./LoginForm";

export const metadata = { title: "Sign in | ImpactGrid Analytics" };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: { next?: string; error?: string } }) {
  // Only allow same-site relative redirects.
  const n = searchParams.next;
  const next = n && n.startsWith("/") && !n.startsWith("//") && !n.startsWith("/\\") ? n : "/dashboard";

  const { data: { user } } = await createClient().auth.getUser();
  if (user) redirect(next);

  return (
    <main className="mx-auto max-w-md px-6 py-20">
      <h1 className="font-display text-3xl md:text-4xl">Your ImpactGrid account</h1>
      <p className="mt-2 text-slate">Manage your website, Care Plan and invoices in one place.</p>
      <LoginForm next={next} linkError={searchParams.error === "1"} />
    </main>
  );
}

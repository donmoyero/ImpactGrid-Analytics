import { redirect } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/dashboard/Sidebar";
import { getDashboardData } from "@/lib/dashboard/data";
import { sectionsForPackage } from "@/lib/dashboard/sections";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your dashboard | ImpactGrid Analytics", robots: { index: false } };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const data = await getDashboardData();
  if (data === "signed-out") redirect("/login?next=/dashboard");
  if (data === "no-project") {
    return (
      <main className="mx-auto max-w-xl px-6 py-24">
        <h1 className="font-display text-3xl">We can't find your project yet</h1>
        <p className="mt-3 text-slate">
          You're signed in, but no website is linked to this account. If you've just booked, it can take a little while to appear.{" "}
          <Link href="/contact" className="underline">Contact us</Link> and we'll sort it.
        </p>
      </main>
    );
  }
  return (
    <div className="mx-auto grid max-w-7xl gap-10 px-6 py-10 lg:grid-cols-[220px_1fr] lg:px-10">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <Sidebar sections={sectionsForPackage(data.tier)} />
      </aside>
      <div>{children}</div>
    </div>
  );
}

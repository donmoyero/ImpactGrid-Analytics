import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import SignOutButton from "@/components/dashboard/SignOutButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin | ImpactGrid Analytics", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
      <div className="mb-6 flex flex-wrap items-center justify-end gap-4 text-sm text-slate">
        <span>Signed in as {admin.email}</span>
        <Link href="/dashboard" className="underline">My dashboard</Link>
        <SignOutButton className="rounded-full border border-line2 px-4 py-1.5 text-sm font-medium text-paper hover:bg-sand" />
      </div>
      {children}
    </div>
  );
}

import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import AdminNav from "@/components/admin/AdminNav";
import SignOutButton from "@/components/dashboard/SignOutButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin | ImpactGrid Analytics", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="lg:grid lg:min-h-[calc(100vh-65px)] lg:grid-cols-[230px_1fr]">
      <aside className="flex flex-wrap items-center gap-4 border-b border-line bg-ink2 px-4 py-3 lg:sticky lg:top-[65px] lg:h-[calc(100vh-65px)] lg:flex-col lg:items-stretch lg:justify-start lg:gap-6 lg:border-b-0 lg:border-r lg:px-4 lg:py-6">
        <p className="font-display text-lg">Admin</p>
        <AdminNav />
        <div className="ml-auto border-line lg:ml-0 lg:mt-auto lg:border-t lg:pt-4">
          <p className="hidden truncate px-3 pb-2 text-xs text-slateLight lg:block">{admin.email}</p>
          <Link href="/dashboard" className="hidden px-3 py-1.5 text-sm text-slate hover:text-paper lg:block">My dashboard</Link>
          <SignOutButton className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate hover:text-paper" />
        </div>
      </aside>
      <div className="min-w-0 px-6 py-8 lg:px-10">{children}</div>
    </div>
  );
}

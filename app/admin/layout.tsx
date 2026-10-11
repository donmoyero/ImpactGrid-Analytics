import { requireAdmin } from "@/lib/admin/auth";
import AdminNav from "@/components/admin/AdminNav";
import SignOutButton from "@/components/SignOutButton";
import { PLATFORM_CONTINUE_URL } from "@/lib/platform";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin | ImpactGrid Analytics", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="lg:grid lg:min-h-[calc(100vh-65px)] lg:grid-cols-[230px_1fr]">
      <aside className="relative isolate flex flex-wrap items-center gap-4 overflow-hidden border-b border-white/10 bg-charcoal px-4 py-3 text-white lg:sticky lg:top-[65px] lg:h-[calc(100vh-65px)] lg:flex-col lg:items-stretch lg:justify-start lg:gap-8 lg:border-b-0 lg:border-r lg:px-4 lg:py-7">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_100%_40%_at_0%_0%,rgba(45,110,219,0.20),transparent)]" />
        <div className="px-1">
          <p className="font-display text-lg leading-none">Admin</p>
          <p className="label-tag mt-1.5 hidden text-white/40 lg:block">Site control</p>
        </div>
        <AdminNav />
        <div className="ml-auto lg:ml-0 lg:mt-auto lg:border-t lg:border-white/10 lg:pt-4">
          <p className="hidden truncate px-3 pb-2 text-xs text-white/40 lg:block">{admin.email}</p>
          <a href={PLATFORM_CONTINUE_URL} className="hidden rounded-lg px-3 py-1.5 text-sm text-white/60 transition-colors hover:text-white lg:block">Open platform</a>
          <SignOutButton className="w-full rounded-lg px-3 py-2 text-left text-sm text-white/60 transition-colors hover:text-white" />
        </div>
      </aside>
      <div className="min-w-0 bg-[radial-gradient(ellipse_60%_30%_at_70%_0%,rgba(45,110,219,0.05),transparent)] px-6 py-10 lg:px-12">{children}</div>
    </div>
  );
}

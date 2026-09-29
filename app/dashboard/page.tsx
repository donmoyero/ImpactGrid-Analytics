import Link from "next/link";
import { getDashboardData } from "@/lib/dashboard/data";
import { getPackage } from "@/lib/packages";
import type { CarePlanStatus, WebsiteStatus } from "@/types";

export const dynamic = "force-dynamic";

const WEBSITE: Record<WebsiteStatus, { label: string; dot: string }> = {
  live: { label: "Live", dot: "bg-green-600" },
  building: { label: "Being built", dot: "bg-blueprint2" },
  maintenance: { label: "Maintenance", dot: "bg-amber-500" },
  suspended: { label: "Offline", dot: "bg-red-600" },
};
const CARE: Record<CarePlanStatus, string> = {
  trialing: "Active (free first year)",
  active: "Active",
  past_due: "Payment needed",
  cancelled: "Cancelled",
  expired: "Expired",
  suspended: "Suspended",
};

const formatDate = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/London" }).format(new Date(iso)) : "Not set yet";

export default async function Overview() {
  const d = await getDashboardData();
  if (typeof d === "string") return null; // layout already handled these cases

  const site = WEBSITE[d.websiteStatus];
  const pkg = getPackage(d.tier);
  const needsAttention = d.carePlanStatus === "past_due" || d.websiteStatus === "maintenance" || d.websiteStatus === "suspended";

  return (
    <div>
      <h1 className="font-display text-3xl md:text-4xl">Welcome back, {d.businessName}.</h1>
      <p className="mt-2 text-slate">{pkg ? `${pkg.name} package` : "Your package"}</p>

      {needsAttention && (
        <div role="status" className="mt-6 rounded-xl border border-line2 bg-sand px-4 py-3 text-sm">
          {d.carePlanStatus === "past_due"
            ? "Your Care Plan payment didn't go through. Please update your card to keep your website online."
            : d.maintenanceMessage ?? "Your website is currently offline. Contact us if you're not expecting this."}{" "}
          <Link href="/contact" className="underline">Get in touch</Link>
        </div>
      )}

      <dl className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
        <Stat label="Website">
          <span className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${site.dot}`} aria-hidden />{site.label}</span>
        </Stat>
        <Stat label="Domain">{d.domain ?? "Not connected yet"}</Stat>
        <Stat label="Care Plan">{d.carePlanStatus ? CARE[d.carePlanStatus] : "Not set up"}</Stat>
        <Stat label="Next renewal">{formatDate(d.renewalAt)}</Stat>
      </dl>

      {d.tier === "starter" && (
        <p className="mt-8 max-w-prose text-sm text-slate">
          Your Start package doesn't include the management dashboard. Want to edit your own content and images?{" "}
          <Link href="/pricing" className="underline">See the Manage package</Link>.
        </p>
      )}
    </div>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-ink2 p-5">
      <dt className="text-sm text-slateLight">{label}</dt>
      <dd className="mt-1 font-display text-xl">{children}</dd>
    </div>
  );
}

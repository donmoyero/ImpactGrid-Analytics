import { getAdminDb } from "@/lib/supabase/admin";
import type { CarePlanStatus, PackageTier, WebsiteStatus } from "@/types";

export interface AdminRow {
  projectId: string;
  businessName: string;
  tier: PackageTier;
  domain: string | null;
  clientId: string | null;
  contactEmail: string | null;
  linked: boolean;
  websiteStatus: WebsiteStatus | "none";
  carePlanStatus: CarePlanStatus | null;
  renewalAt: string | null;
  daysPastDue: number | null;
}
export interface OrphanClient { clientId: string; businessName: string; contactEmail: string; linked: boolean }

/** Everything the admin overview needs, via the service-role client (server only; callers must have passed requireAdmin). */
export async function getAdminOverview(q?: string) {
  const db = getAdminDb();
  const [projects, clients, websites, plans] = await Promise.all([
    db.from("projects").select("id, business_name, package, domain, client_id, created_at").order("created_at", { ascending: false }),
    db.from("clients").select("id, business_name, contact_email, user_id"),
    db.from("websites").select("project_id, status, live_url"),
    db.from("care_plans").select("project_id, status, renewal_at, trial_ends_at, past_due_since"),
  ]);
  for (const r of [projects, clients, websites, plans]) if (r.error) throw new Error(r.error.message);

  const clientById = new Map((clients.data ?? []).map((c) => [c.id, c]));
  const siteByProject = new Map((websites.data ?? []).map((w) => [w.project_id, w]));
  const planByProject = new Map((plans.data ?? []).map((p) => [p.project_id, p]));

  let rows: AdminRow[] = (projects.data ?? []).map((p) => {
    const c = p.client_id ? clientById.get(p.client_id) : undefined;
    const w = siteByProject.get(p.id);
    const cp = planByProject.get(p.id);
    const domain = p.domain ?? (w?.live_url ? String(w.live_url).replace(/^https?:\/\//, "").replace(/\/.*$/, "") : null);
    return {
      projectId: p.id,
      businessName: p.business_name,
      tier: p.package as PackageTier,
      domain,
      clientId: c?.id ?? null,
      contactEmail: c?.contact_email ?? null,
      linked: !!c?.user_id,
      websiteStatus: (w?.status ?? "none") as WebsiteStatus | "none",
      carePlanStatus: (cp?.status ?? null) as CarePlanStatus | null,
      renewalAt: cp?.renewal_at ?? cp?.trial_ends_at ?? null,
      daysPastDue: cp?.status === "past_due" && cp.past_due_since ? Math.floor((Date.now() - new Date(cp.past_due_since).getTime()) / 86_400_000) : null,
    };
  });

  const term = q?.trim().toLowerCase();
  if (term) {
    rows = rows.filter((r) => [r.businessName, r.contactEmail, r.domain].some((v) => v?.toLowerCase().includes(term)));
  }

  const withProject = new Set((projects.data ?? []).map((p) => p.client_id));
  const orphans: OrphanClient[] = (clients.data ?? [])
    .filter((c) => !withProject.has(c.id))
    .map((c) => ({ clientId: c.id, businessName: c.business_name, contactEmail: c.contact_email, linked: !!c.user_id }));

  return { rows, orphans };
}

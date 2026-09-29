import { createClient } from "@/lib/supabase/server";
import type { CarePlanStatus, PackageTier, WebsiteStatus } from "@/types";

export interface DashboardData {
  businessName: string;
  tier: PackageTier;
  domain: string | null;
  websiteStatus: WebsiteStatus;
  maintenanceMessage: string | null;
  carePlanStatus: CarePlanStatus | null;
  renewalAt: string | null;
}

/**
 * Loads the signed-in customer's own project using the anon key + their session, so Postgres row-level security
 * decides what they can see (clients -> projects -> websites / care_plans). Never uses the service-role key.
 * Returns "signed-out" or "no-project" instead of throwing so the page can respond properly.
 */
export async function getDashboardData(): Promise<DashboardData | "signed-out" | "no-project"> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser(); // validates the session with Supabase
  if (!user) return "signed-out";

  const { data: client } = await supabase.from("clients").select("id, business_name").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!client) return "no-project";

  const { data: project } = await supabase
    .from("projects")
    .select("id, business_name, package, domain")
    .eq("client_id", client.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!project) return "no-project";

  const [{ data: website }, { data: plan }] = await Promise.all([
    supabase.from("websites").select("status, live_url, maintenance_message").eq("project_id", project.id).maybeSingle(),
    supabase.from("care_plans").select("status, renewal_at, trial_ends_at").eq("project_id", project.id).maybeSingle(),
  ]);

  const domain = project.domain ?? (website?.live_url ? website.live_url.replace(/^https?:\/\//, "").replace(/\/.*$/, "") : null);
  return {
    businessName: project.business_name ?? client.business_name,
    tier: project.package as PackageTier,
    domain,
    websiteStatus: (website?.status ?? "building") as WebsiteStatus,
    maintenanceMessage: website?.maintenance_message ?? null,
    carePlanStatus: (plan?.status ?? null) as CarePlanStatus | null,
    renewalAt: plan?.renewal_at ?? plan?.trial_ends_at ?? null,
  };
}

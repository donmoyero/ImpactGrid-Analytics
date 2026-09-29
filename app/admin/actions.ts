"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminDb } from "@/lib/supabase/admin";
import { restoreWebsite, setMaintenance, suspendWebsite } from "@/lib/payments/suspension";

const UUID = /^[0-9a-f-]{36}$/i;
const str = (f: FormData, k: string) => (typeof f.get(k) === "string" ? (f.get(k) as string).trim() : "");

/** Runs an admin action, then returns to the list with a success or error message. redirect() must sit outside try/catch. */
async function run(fn: () => Promise<string>): Promise<never> {
  let ok = true;
  let msg: string;
  try {
    msg = await fn();
  } catch (e) {
    ok = false;
    msg = e instanceof Error ? e.message : "Something went wrong.";
  }
  revalidatePath("/admin");
  redirect(`/admin?${ok ? "ok" : "err"}=${encodeURIComponent(msg)}`);
}

export async function websiteAction(formData: FormData) {
  await requireAdmin();
  const action = str(formData, "action");
  const projectId = str(formData, "projectId");
  const reason = str(formData, "reason") || undefined;
  const force = formData.get("force") === "on";
  await run(async () => {
    if (!UUID.test(projectId)) throw new Error("Invalid project.");
    const db = getAdminDb();
    switch (action) {
      case "create_site": {
        const { error } = await db.from("websites").insert({ project_id: projectId, status: "building" });
        if (error) throw new Error(error.message);
        return "Website record created (status: being built).";
      }
      case "go_live": {
        const { data, error } = await db.from("websites").update({ status: "live" }).eq("project_id", projectId).eq("status", "building").select().maybeSingle();
        if (error) throw new Error(error.message);
        if (!data) throw new Error("That website isn't in the 'being built' state.");
        return "Website is now live.";
      }
      case "maintenance_on":
        await setMaintenance(projectId, true, reason);
        return "Maintenance mode is on. Visitors now see the maintenance page.";
      case "maintenance_off":
        await setMaintenance(projectId, false);
        return "Maintenance mode is off. The website is live.";
      case "suspend":
        await suspendWebsite(projectId, reason, { force });
        return "Website suspended.";
      case "restore":
        await restoreWebsite(projectId);
        return "Website restored to live.";
      default:
        throw new Error("Unknown action.");
    }
  });
}

/** Attach a client record to the account that signed up with the given email. */
export async function linkAccountAction(formData: FormData) {
  await requireAdmin();
  const clientId = str(formData, "clientId");
  const email = str(formData, "email").toLowerCase();
  await run(async () => {
    if (!UUID.test(clientId) || !email) throw new Error("Client and email are required.");
    const db = getAdminDb();
    const { data, error } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) throw new Error(error.message);
    const user = data.users.find((u) => u.email?.toLowerCase() === email);
    if (!user) throw new Error("No account with that email has signed up yet.");
    const { error: upErr } = await db.from("clients").update({ user_id: user.id }).eq("id", clientId);
    if (upErr) throw new Error(upErr.message);
    return `Linked. ${email} can now see this customer's dashboard.`;
  });
}

import { NextRequest, NextResponse } from "next/server";
import { hasBearer } from "@/lib/payments/auth";
import { getSuspensionQueue, restoreWebsite, suspendWebsite } from "@/lib/payments/suspension";

export const dynamic = "force-dynamic";

const unauthorised = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });

/** Admin queue: overdue invoices, each with its available action ("SUSPEND WEBSITE" / "SUSPENDED"). */
export async function GET(req: NextRequest) {
  if (!hasBearer(req, "ADMIN_API_KEY")) return unauthorised();
  try {
    return NextResponse.json({ queue: await getSuspensionQueue() });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}

/** Body: { action: "suspend" | "restore", projectId, reason?, force? } */
export async function POST(req: NextRequest) {
  if (!hasBearer(req, "ADMIN_API_KEY")) return unauthorised();
  const body = await req.json().catch(() => ({}));
  const { action, projectId, reason, force } = body as Record<string, unknown>;
  if (typeof projectId !== "string" || !/^[0-9a-f-]{36}$/i.test(projectId)) {
    return NextResponse.json({ error: "projectId (uuid) is required." }, { status: 400 });
  }
  try {
    if (action === "suspend") {
      const site = await suspendWebsite(projectId, typeof reason === "string" ? reason : undefined, { force: force === true });
      return NextResponse.json({ ok: true, website: site });
    }
    if (action === "restore") return NextResponse.json({ ok: true, website: await restoreWebsite(projectId) });
    return NextResponse.json({ error: 'action must be "suspend" or "restore".' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 409 });
  }
}

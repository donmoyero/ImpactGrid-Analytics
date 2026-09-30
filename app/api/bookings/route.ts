import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { addons, getPackage } from "@/lib/packages";
import { adminEmail, sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const clip = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const gbp = (n: number) => `£${n.toFixed(2).replace(/\.00$/, "")}`;

/**
 * A customer asks for a website. Nothing is created for them yet: the request waits in admin (/admin/bookings)
 * until you approve it. No card, no payment.
 * Body: { packageId, addonIds, businessName, domain, email, phone, notes, palette, website (honeypot) }
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Honeypot: real people never fill this hidden field. Pretend it worked.
  if (clip(body.website, 200)) return NextResponse.json({ ok: true });

  const email = clip(body.email, 200).toLowerCase();
  const businessName = clip(body.businessName, 200);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (!businessName) {
    return NextResponse.json({ error: "Please tell us your business name." }, { status: 400 });
  }

  const pkg = getPackage(clip(body.packageId, 40));
  if (!pkg) return NextResponse.json({ error: "Unknown package selected." }, { status: 400 });

  const wanted = Array.isArray(body.addonIds) ? body.addonIds.map((a) => String(a)) : [];
  const chosen = addons.filter((a) => wanted.includes(a.id));
  const total = pkg.price + chosen.reduce((s, a) => s + a.price, 0);

  const domain = clip(body.domain, 200).toLowerCase() || null;
  const phone = clip(body.phone, 60) || null;
  const palette = clip(body.palette, 60) || null;
  const notes = clip(body.notes, 3000) || null;

  const db = createServiceRoleClient();

  // Gentle spam guard: at most 3 requests per email per hour.
  const since = new Date(Date.now() - 3_600_000).toISOString();
  const { count } = await db
    .from("booking_requests")
    .select("id", { count: "exact", head: true })
    .ilike("contact_email", email)
    .gte("created_at", since);
  if ((count ?? 0) >= 3) {
    return NextResponse.json({ error: "We already have your request. Please wait a little before sending another." }, { status: 429 });
  }

  const { error } = await db.from("booking_requests").insert({
    business_name: businessName,
    contact_email: email,
    contact_phone: phone,
    package: pkg.id,
    addon_ids: chosen.map((a) => a.id),
    domain,
    palette,
    notes,
    total,
  });
  if (error) {
    console.error("Booking insert failed:", error);
    return NextResponse.json({ error: "We couldn't save your request. Please try again." }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  // Emails are best-effort: the request is already saved and shows in admin.
  await sendEmail({
    to: adminEmail(),
    replyTo: email,
    subject: `New booking request: ${businessName} (${pkg.name})`,
    text:
      `${businessName} has asked for a website.\n\n` +
      `Package: ${pkg.name} (${gbp(pkg.price)})\n` +
      `Add-ons: ${chosen.length ? chosen.map((a) => a.name).join(", ") : "none"}\n` +
      `Build total: ${gbp(total)}\n` +
      `Domain: ${domain ?? "to be chosen"}\n` +
      `Email: ${email}\nPhone: ${phone ?? "-"}\nPalette: ${palette ?? "-"}\n\n` +
      `What they want:\n${notes ?? "(nothing added)"}\n\n` +
      `Review and approve it here: ${appUrl}/admin/bookings`,
  });
  await sendEmail({
    to: email,
    replyTo: adminEmail(),
    subject: "We've got your website request",
    text:
      `Hi ${businessName},\n\nThanks for your request for a ${pkg.name} website. We'll look it over and email you as soon as it's approved. ` +
      `You don't need to pay anything yet.\n\nThank you,\nImpactGrid Analytics\nhello@impactgridanalytics.com`,
  });

  return NextResponse.json({ ok: true });
}

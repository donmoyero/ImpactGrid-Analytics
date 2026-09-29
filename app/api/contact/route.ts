import { NextRequest, NextResponse } from "next/server";

/** Sends contact-form messages to CONTACT_EMAIL via Resend's REST API. */
export async function POST(req: NextRequest) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "Contact form isn't available right now." }, { status: 503 });
  }

  const { name, email, message } = await req.json().catch(() => ({}));
  if (!name || typeof email !== "string" || !email.includes("@") || !message) {
    return NextResponse.json({ error: "Please fill in every field." }, { status: 400 });
  }

  const to = process.env.CONTACT_EMAIL ?? "hello@impactgrid.digital";
  const from = process.env.RESEND_FROM_EMAIL ?? "hello@impactgrid.digital";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: `ImpactGrid Website <${from}>`,
      to: [to],
      reply_to: email,
      subject: `New enquiry from ${String(name).slice(0, 80)}`,
      text: `From: ${name} <${email}>\n\n${String(message).slice(0, 5000)}`,
    }),
  });

  if (!res.ok) {
    console.error("Resend error:", await res.text());
    return NextResponse.json({ error: "Couldn't send your message. Please try again." }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}

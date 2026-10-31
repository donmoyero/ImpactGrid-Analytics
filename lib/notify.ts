/** Emails the site owner (CONTACT_EMAIL) through Resend. Best effort: never throws, does nothing if Resend isn't set up. */
export async function notifyOwner(subject: string, text: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  const to = process.env.CONTACT_EMAIL ?? "hello@shopplug.uk";
  const from = process.env.RESEND_FROM_EMAIL ?? "hello@shopplug.uk";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: `ShopPlug Orders <${from}>`, to: [to], subject, text }),
    });
    if (!res.ok) console.error("owner email failed:", res.status);
  } catch (e) {
    console.error("owner email failed:", e);
  }
}

/** Minimal Resend sender (same REST call as the contact form). Returns false instead of throwing. */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
  /** content is base64 */
  attachments?: { filename: string; content: string }[];
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error("RESEND_API_KEY is not set; email not sent:", opts.subject);
    return false;
  }
  const from = process.env.RESEND_FROM_EMAIL ?? "hello@impactgridanalytics.com";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: `ImpactGrid Analytics <${from}>`,
        to: [opts.to],
        reply_to: opts.replyTo,
        subject: opts.subject,
        text: opts.text,
        attachments: opts.attachments,
      }),
    });
    if (!res.ok) {
      console.error("Resend error:", res.status, await res.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error("Resend request failed:", e);
    return false;
  }
}

export const adminEmail = () =>
  process.env.ADMIN_EMAIL ?? process.env.CONTACT_EMAIL?.split(/\s/)[0] ?? "hello@impactgridanalytics.com";

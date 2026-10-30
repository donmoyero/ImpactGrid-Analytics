import { Mail } from "lucide-react";
import ContactForm from "@/components/ContactForm";

export const metadata = { title: "Contact — ShopPlug" };
export const dynamic = "force-dynamic"; // reads env vars at request time

export default function ContactPage() {
  const email = process.env.CONTACT_EMAIL ?? "hello@impactgridanalytics.com";
  const formEnabled = Boolean(process.env.RESEND_API_KEY);

  return (
    <main className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-5 lg:gap-20 lg:px-10 lg:py-28">
      <div className="lg:col-span-2">
        <p className="eyebrow">Contact</p>
        <h1 className="mt-5 font-display text-4xl leading-[1.05] tracking-tight lg:text-6xl">Get in touch.</h1>
        <p className="mt-6 max-w-sm text-lg leading-relaxed text-slate">
          Have a question about ShopPlug? Send us a message.
        </p>
        {formEnabled && (
          <a
            href={`mailto:${email}`}
            className="mt-10 inline-flex items-center gap-3 text-sm text-slate transition-colors hover:text-paper"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blueprint2/10 text-blueprint2">
              <Mail className="h-4 w-4" />
            </span>
            {email}
          </a>
        )}
      </div>

      <div className="lg:col-span-3">
        <div className="admin-card p-6 lg:p-10">
          {formEnabled ? (
            <ContactForm />
          ) : (
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blueprint2/10 text-blueprint2">
                <Mail className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm text-slate">Email us at</p>
                <a href={`mailto:${email}`} className="font-display text-xl text-paper hover:text-blueprint2">
                  {email}
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

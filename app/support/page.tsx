import Link from "next/link";
import { packages } from "@/lib/packages";
import { formatGBP } from "@/lib/utils";

export const metadata = { title: "Support & FAQ — ImpactGrid Analytics" };

const faqs = [
  {
    q: "How do I pay for my website?",
    a: "The website build is invoiced by bank transfer. After you complete the project form we email your invoice with our bank details, and we start once it's paid.",
  },
  {
    q: "What is the Care Plan?",
    a: "Hosting, SSL, daily backups, uptime monitoring, software updates and small content edits, all looked after by us so your site stays live and secure.",
  },
  {
    q: "Is the first year really free?",
    a: "Yes. You register a card with Stripe when you order, but nothing is charged for 12 months.",
  },
  {
    q: "What happens after the free year?",
    a: `Your card is charged once a year (${packages.map((p) => `${p.name} ${formatGBP(p.carePlanYearly)}`).join(", ")}) until you cancel. Stripe emails you before the first charge.`,
  },
  {
    q: "Can I cancel the Care Plan?",
    a: "Yes, any time. Cancel before your free year ends and you will never be charged. Email us and we will cancel it for you.",
  },
  {
    q: "Do you set up my domain?",
    a: "Yes. Tell us the domain you want and we check availability and set it up as part of the build.",
  },
];

export default function SupportPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-20 lg:px-10">
      <p className="label-tag text-slate">Support</p>
      <h1 className="mt-3 font-display text-4xl lg:text-5xl">Questions, answered.</h1>

      <div className="mt-12 divide-y divide-line rounded-2xl border border-line bg-ink2">
        {faqs.map((f) => (
          <details key={f.q} className="group p-6">
            <summary className="flex cursor-pointer list-none items-center justify-between font-display text-lg">
              {f.q}
              <span className="ml-4 text-slate transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-slate">{f.a}</p>
          </details>
        ))}
      </div>

      <p className="mt-10 text-slate">
        Still stuck?{" "}
        <Link href="/contact" className="text-paper underline underline-offset-4">
          Get in touch
        </Link>
        .
      </p>
    </main>
  );
}

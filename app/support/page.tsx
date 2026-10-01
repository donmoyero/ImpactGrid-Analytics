import Link from "next/link";

export const metadata = { title: "Support & FAQ — ImpactGrid Analytics" };

const faqs = [
  {
    q: "How do I get started?",
    a: "Choose Get started, create an account and sign in. Once your account is approved and linked to your business, you will see your business dashboard.",
  },
  {
    q: "Can I add my team?",
    a: "Yes. Business owners and admins can invite staff by email from the Team page and choose a role for each person. Each person accepts by signing in with the email address the invitation was sent to.",
  },
  {
    q: "Is my business data kept separate?",
    a: "Yes. Each business's information is kept separate, and only people who belong to that business can see it.",
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

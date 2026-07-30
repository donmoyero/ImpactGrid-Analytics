const faqs = [
  { q: "How long does a build take?", a: "Starter builds typically take 1–2 weeks, Business 2–4 weeks, and Premium depends on scope — you'll get a deadline in your dashboard after checkout." },
  { q: "Can I change my package after paying?", a: "Yes — message your project team from the dashboard and we'll send an updated invoice for the difference." },
  { q: "Do you register the domain for me?", a: "Yes. Domains added during checkout are purchased and connected as part of your build." },
  { q: "What happens after I pay?", a: "You'll get dashboard access immediately, and your project moves into Planning while we reach out to confirm details." },
];

export const metadata = { title: "Support — ImpactGrid Digital" };

export default function SupportPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-20 lg:px-10">
      <p className="label-tag text-slate">Support</p>
      <h1 className="mt-3 font-display text-4xl">Common questions.</h1>

      <div className="mt-10 divide-y divide-line border-t border-line">
        {faqs.map((f) => (
          <div key={f.q} className="py-6">
            <h3 className="font-medium">{f.q}</h3>
            <p className="mt-2 text-sm text-slate">{f.a}</p>
          </div>
        ))}
      </div>

      <p className="mt-10 text-sm text-slate">
        Still stuck? Message your project team directly from{" "}
        <a href="/dashboard" className="text-blueprint2 hover:underline">
          your dashboard
        </a>
        , or <a href="/contact" className="text-blueprint2 hover:underline">contact us</a>.
      </p>
    </main>
  );
}

const faqs = [
  { q: "How long does a build take?", a: "Starter builds typically take 1–2 weeks, Business 2–4 weeks, and Premium depends on scope. We'll confirm a timeline with you after you order." },
  { q: "Can I change my package after paying?", a: "Yes. Get in touch and we'll send an updated invoice for the difference." },
  { q: "Do you register the domain for me?", a: "Yes. Tell us the domain you'd like when you start your project and we'll check availability and set it up as part of your build." },
  { q: "What happens after I pay?", a: "We'll email you to confirm the details, then your project moves into planning." },
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
        Still stuck?{" "}
        <a href="/contact" className="text-blueprint2 hover:underline">
          Contact us
        </a>
        .
      </p>
    </main>
  );
}

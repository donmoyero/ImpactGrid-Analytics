export const metadata = { title: "Contact — ImpactGrid Digital" };

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-xl px-6 py-20 lg:px-10">
      <p className="label-tag text-slate">Contact</p>
      <h1 className="mt-3 font-display text-4xl">Get in touch.</h1>
      <p className="mt-4 text-slate">
        Have a question before you start a project? Send a message and we'll
        reply within one business day.
      </p>

      <form className="mt-10 space-y-5">
        <input className="input" placeholder="Your name" />
        <input className="input" type="email" placeholder="Email" />
        <textarea className="input resize-none" rows={5} placeholder="How can we help?" />
        <button
          type="button"
          className="rounded-full bg-signal px-6 py-3 text-sm font-medium text-ink hover:bg-blueprint2"
        >
          Send message
        </button>
      </form>
    </main>
  );
}

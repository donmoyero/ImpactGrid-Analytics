import ContactForm from "@/components/ContactForm";

export const metadata = { title: "Contact — ImpactGrid Analytics" };
export const dynamic = "force-dynamic"; // reads env vars at request time

export default function ContactPage() {
  const email = process.env.CONTACT_EMAIL ?? "hello@impactgridanalytics.com";
  const formEnabled = Boolean(process.env.RESEND_API_KEY);

  return (
    <main className="mx-auto max-w-xl px-6 py-20 lg:px-10">
      <p className="label-tag text-slate">Contact</p>
      <h1 className="mt-3 font-display text-4xl">Get in touch.</h1>
      <p className="mt-4 text-slate">
        Have a question before you start a project? Send us a message.
      </p>

      {formEnabled ? (
        <ContactForm />
      ) : (
        <p className="mt-10 text-sm text-slate">
          Email us at{" "}
          <a href={`mailto:${email}`} className="text-blueprint2 hover:underline">
            {email}
          </a>
          .
        </p>
      )}
    </main>
  );
}

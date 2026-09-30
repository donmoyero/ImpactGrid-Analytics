import Link from "next/link";
import { Examples, Platform, AiSection } from "@/components/HomeSections";
import { getHomepageContent } from "@/lib/site/content";

const services = [
  { name: "Business website", detail: "A credible site that explains what you do and how to book you." },
  { name: "E-commerce website", detail: "Sell products online with secure checkout and inventory." },
  { name: "Booking website", detail: "Let customers book appointments without a phone call." },
  { name: "Restaurant website", detail: "Menu, location, and ordering — built for hungry visitors." },
  { name: "Hair salon website", detail: "Gallery-led sites that show off the work and fill the chair." },
  { name: "AI integration", detail: "Chat assistants, quote tools, and automations tailored to your site." },
  { name: "SEO", detail: "Technical setup and content structure so you're found on Google." },
  { name: "Brand identity", detail: "Logo, palette, and a short guide so everything looks consistent." },
  { name: "Logo design", detail: "A mark that works everywhere — from favicon to signage." },
  { name: "Care Plan", detail: "Hosting, SSL, backups, monitoring and small edits. First year free, then yearly." },
  { name: "Google Business setup", detail: "A verified, complete listing so you show up on Maps." },
];

export const metadata = { title: "Services — ImpactGrid Analytics" };

export const revalidate = 60;

export default async function ServicesPage() {
  const c = await getHomepageContent();
  return (
    <main>
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
      <p className="label-tag text-slate">Services</p>
      <h1 className="mt-3 max-w-2xl font-display text-4xl lg:text-5xl">
        Everything a business needs to be online, done for you.
      </h1>

      <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s, i) => (
          <div key={s.name} className="crosshair bg-ink2 p-6">
            <span className="font-mono text-xs text-slateLight">{String(i + 1).padStart(2, "0")}</span>
            <h3 className="mt-3 font-display text-lg">{s.name}</h3>
            <p className="mt-2 text-sm text-slate">{s.detail}</p>
          </div>
        ))}
      </div>

      </div>

      <Examples />
      <Platform />
      <AiSection ai={c.ai} />

      <div className="px-6 py-20 text-center">
        <Link
          href="/book-project"
          className="inline-flex items-center gap-2 rounded-full bg-signal px-7 py-3.5 text-sm font-medium text-ink hover:bg-blueprint2"
        >
          Start a project
        </Link>
      </div>
    </main>
  );
}

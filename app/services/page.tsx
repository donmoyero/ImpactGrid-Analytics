/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Platform, AiSection } from "@/components/HomeSections";
import { getHomepageContent } from "@/lib/site/content";

export const metadata = { title: "Services — ImpactGrid Analytics" };
export const revalidate = 60; // edited in Admin → Homepage → Services page

export default async function ServicesPage() {
  const c = await getHomepageContent();
  const sp = c.servicesPage;
  return (
    <main>
      <section className="border-b border-line">
        <div className="mx-auto max-w-7xl px-6 pb-14 pt-20 lg:px-10 lg:pb-20 lg:pt-28">
          {sp.eyebrow && <p className="label-tag text-slate">{sp.eyebrow}</p>}
          <h1 className="mt-4 max-w-3xl font-display text-4xl leading-[1.05] tracking-tight lg:text-6xl">{sp.heading}</h1>
          {sp.intro && <p className="mt-6 max-w-xl text-lg text-slate">{sp.intro}</p>}
        </div>
      </section>

      {sp.items.length > 0 && (
        <section className="border-b border-line bg-sand/40">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-24">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {sp.items.map((s, i) => (
                <article
                  key={s.name + i}
                  className="group flex flex-col overflow-hidden rounded-3xl border border-line bg-ink2 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
                >
                  <div className="relative aspect-[16/11] overflow-hidden bg-gradient-to-br from-sand via-ink2 to-line">
                    {s.imageUrl ? (
                      <img
                        src={s.imageUrl}
                        alt={s.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <span aria-hidden className="absolute inset-0 flex items-center justify-center font-display text-7xl text-paper/10">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    )}
                    <span className="absolute left-4 top-4 rounded-full bg-ink2/90 px-3 py-1 font-mono text-xs text-slate backdrop-blur">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-7">
                    <h2 className="font-display text-2xl leading-tight">{s.name}</h2>
                    {s.detail && <p className="mt-3 flex-1 text-sm leading-relaxed text-slate">{s.detail}</p>}
                    <Link
                      href="/book-project"
                      className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-paper transition-colors hover:text-blueprint2"
                    >
                      Get started
                      <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <Platform />
      <AiSection ai={c.ai} />

      <section>
        <div className="mx-auto max-w-7xl px-6 py-24 text-center lg:px-10">
          <h2 className="mx-auto max-w-2xl font-display text-3xl lg:text-4xl">{c.cta.heading}</h2>
          <Link
            href="/book-project"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-signal px-7 py-3.5 text-sm font-medium text-ink hover:bg-blueprint2"
          >
            {c.cta.button}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}

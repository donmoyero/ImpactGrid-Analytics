/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { HomepageContent } from "@/lib/site/content";

/** Each block renders nothing until the admin adds real content, so the homepage never shows invented proof. */
export function HomeStats({ stats }: { stats: HomepageContent["stats"] }) {
  if (!stats.length) return null;
  return (
    <section className="border-b border-line bg-ink2" aria-label="ImpactGrid in numbers">
      <dl className="mx-auto grid max-w-7xl grid-cols-2 gap-px px-6 py-10 lg:grid-cols-4 lg:px-10">
        {stats.map((s) => (
          <div key={s.label} className="py-2 lg:px-6 lg:first:pl-0">
            <dd className="font-display text-4xl lg:text-5xl">{s.value}</dd>
            <dt className="mt-1 text-sm text-slate">{s.label}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function HomeWork({ work }: { work: HomepageContent["work"] }) {
  if (!work.length) return null;
  return (
    <section className="border-b border-line">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <p className="label-tag text-slate">Our work</p>
        <h2 className="mt-3 max-w-2xl font-display text-3xl lg:text-4xl">Websites we&apos;ve built.</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {work.map((w) => {
            const body = (
              <>
                {w.imageUrl ? (
                  <img src={w.imageUrl} alt={w.title} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                ) : (
                  <div className="aspect-[4/3] w-full bg-sand" aria-hidden />
                )}
                <div className="p-5">
                  {w.category && <p className="text-xs text-slateLight">{w.category}</p>}
                  <h3 className="mt-1 font-display text-xl">{w.title}</h3>
                  {w.blurb && <p className="mt-2 text-sm text-slate">{w.blurb}</p>}
                </div>
              </>
            );
            const cls = "block overflow-hidden rounded-2xl border border-line bg-ink2 transition-colors hover:border-paper";
            return w.url ? (
              <Link key={w.title} href={w.url} className={cls} target={w.url.startsWith("http") ? "_blank" : undefined} rel={w.url.startsWith("http") ? "noopener noreferrer" : undefined}>{body}</Link>
            ) : (
              <div key={w.title} className={cls}>{body}</div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function HomeReviews({ reviews }: { reviews: HomepageContent["reviews"] }) {
  if (!reviews.length) return null;
  return (
    <section className="border-b border-line bg-ink2">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <p className="label-tag text-slate">Client reviews</p>
        <h2 className="mt-3 max-w-2xl font-display text-3xl lg:text-4xl">What clients say.</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r) => (
            <figure key={r.name + r.quote.slice(0, 12)} className="rounded-2xl border border-line p-6">
              <blockquote className="font-display text-lg leading-snug">&ldquo;{r.quote}&rdquo;</blockquote>
              <figcaption className="mt-4 text-sm text-slate">
                <span className="font-medium text-paper">{r.name}</span>
                {r.role && <span>, {r.role}</span>}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

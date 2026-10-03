import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Palette, Search, ShoppingBag, LayoutDashboard, MessageSquare, Upload, PenLine } from "lucide-react";
import HeroScene from "@/components/HeroScene";
import { HowItWorks, Examples, Platform, AiSection } from "@/components/HomeSections";
import { getHomepageContent, type Block, type HomepageContent } from "@/lib/site/content";
import { HomeReviews, HomeStats, HomeWork } from "@/components/home/HomeProof";
import { Widget } from "@/components/home/HomeWidgets";
import { PLATFORM_LOGIN_URL } from "@/lib/platform";

const IDEA_ICONS = [MessageSquare, Upload, PenLine];
const SERVICE_ICONS = [LayoutDashboard, ShoppingBag, Palette, Search];

export const revalidate = 60; // homepage is cached; saving in /admin/homepage refreshes it straight away

type C = HomepageContent;

function Announcement({ c }: { c: C }) {
  return (
    <>
      {c.announcement.text &&
        (c.announcement.href ? (
          <Link href={c.announcement.href} className="block bg-blueprint2 px-6 py-2 text-center text-sm text-white hover:opacity-90">
            {c.announcement.text}
          </Link>
        ) : (
          <p className="bg-blueprint2 px-6 py-2 text-center text-sm text-white">{c.announcement.text}</p>
        ))}
    </>
  );
}

function Hero({ c }: { c: C }) {
  void c;
  return (
      <section className="relative isolate overflow-hidden border-b border-line bg-[#0c0d10] text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_75%_40%,rgba(45,110,219,0.18),transparent)]"
        />
        <div className="relative z-10 mx-auto flex max-w-7xl flex-col justify-center px-6 pb-10 pt-20 lg:min-h-[calc(100vh-65px)] lg:px-10 lg:pb-24 lg:pt-24">
          <div className="max-w-xl">
            <div className="label-tag mb-6 flex items-center gap-2 text-white/60">
              <span className="h-1.5 w-1.5 rounded-full bg-blueprint2" /> {c.hero.eyebrow}
            </div>
            <h1 className="font-display text-5xl leading-[1.02] tracking-tight lg:text-7xl">
              {c.hero.line1}
              <br />
              <span className="bg-gradient-to-r from-white via-[#9db8ff] to-[#8b5cff] bg-clip-text text-transparent">
                {c.hero.line2}
              </span>
            </h1>
            <p className="mt-6 max-w-md text-lg text-white/65">
              {c.hero.sub}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href={PLATFORM_LOGIN_URL}
                className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-medium text-paper transition-colors hover:bg-blueprint2 hover:text-white"
              >
                {c.hero.primaryLabel}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className="relative z-0 h-72 sm:h-96 lg:absolute lg:inset-0 lg:h-auto">
          {c.hero.imageUrl ? (
            <div className="flex h-full items-center justify-center px-6 lg:justify-end lg:pr-10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.hero.imageUrl} alt="" className="max-h-full w-full max-w-xl rounded-3xl object-cover shadow-2xl lg:max-h-[75%]" />
            </div>
          ) : (
            <HeroScene />
          )}
        </div>
      </section>
  );
}

function Idea({ c }: { c: C }) {
  void c;
  return (
      <section className="border-b border-line">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
          {c.idea.eyebrow && <p className="label-tag text-slate">{c.idea.eyebrow}</p>}
          <h2 className="mt-3 max-w-2xl font-display text-3xl lg:text-4xl">{c.idea.heading}</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {c.idea.items.map((i, n) => {
              const Icon = IDEA_ICONS[n] ?? MessageSquare;
              return (
              <Link
                key={i.title}
                href={PLATFORM_LOGIN_URL}
                className="crosshair group rounded-2xl border border-line bg-ink2 p-6 transition-colors hover:border-paper"
              >
                <div className="flex items-center justify-between">
                  <Icon className="h-5 w-5 text-blueprint2" />
                  {n > 0 && <span className="label-tag text-slateLight">Coming soon</span>}
                </div>
                <h3 className="mt-4 font-display text-xl">{i.title}</h3>
                <p className="mt-2 text-sm text-slate">{i.detail}</p>
              </Link>
            );
            })}
          </div>
          <div className="mt-8 flex items-center gap-4 font-mono text-xs text-slate" aria-label="Sketch, then prototype, then website">
            <span className="rounded-full border border-dashed border-line2 px-4 py-2">Sketch</span>
            <span aria-hidden>→</span>
            <span className="rounded-full border border-line2 px-4 py-2">Prototype</span>
            <span aria-hidden>→</span>
            <span className="rounded-full bg-signal px-4 py-2 text-ink">Website</span>
          </div>
        </div>
      </section>
  );
}

function Services({ c }: { c: C }) {
  void c;
  return (
      <section className="border-b border-line">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
          <div className="flex items-end justify-between">
            <div>
              {c.services.eyebrow && <p className="label-tag text-slate">{c.services.eyebrow}</p>}
              <h2 className="mt-3 font-display text-3xl lg:text-4xl">{c.services.heading}</h2>
            </div>
            {c.services.linkLabel && (<Link href="/services" className="hidden text-sm text-slate hover:text-paper md:block">{c.services.linkLabel}</Link>)}
          </div>

          <div className="mt-10 grid items-center gap-10 lg:grid-cols-5">
            <Image
              src="/images/studio-process.svg"
              alt="Wireframe, brand palette, and finished site side by side"
              width={640}
              height={440}
              unoptimized
              className="w-full rounded-2xl border border-line lg:col-span-2"
            />
            <div className="grid gap-6 sm:grid-cols-2 lg:col-span-3">
              {c.services.items.map((s, n) => {
                const Icon = SERVICE_ICONS[n % SERVICE_ICONS.length];
                return (
                <div key={s.name + n} className="crosshair rounded-2xl border border-line p-6">
                  <Icon className="h-5 w-5 text-blueprint2" />
                  <h3 className="mt-4 font-display text-lg">{s.name}</h3>
                  <p className="mt-2 text-sm text-slate">{s.detail}</p>
                </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
  );
}

function Cta({ c }: { c: C }) {
  void c;
  return (
      <section>
        <div className="mx-auto max-w-7xl px-6 py-24 text-center lg:px-10">
          <h2 className="mx-auto max-w-2xl font-display text-3xl lg:text-4xl">
            {c.cta.heading}
          </h2>
          <Link
            href={PLATFORM_LOGIN_URL}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-signal px-7 py-3.5 text-sm font-medium text-ink hover:bg-blueprint2"
          >
            {c.cta.button}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
  );
}


function renderBlock(b: Block, c: C) {
  switch (b.type) {
    case "announcement": return <Announcement key={b.id} c={c} />;
    case "hero": return <Hero key={b.id} c={c} />;
    case "stats": return <HomeStats key={b.id} stats={c.stats} />;
    case "idea": return <Idea key={b.id} c={c} />;
    case "how": return <HowItWorks key={b.id} how={c.how} />;
    case "examples": return <Examples key={b.id} />;
    case "platform": return <Platform key={b.id} />;
    case "ai": return <AiSection key={b.id} ai={c.ai} />;
    case "work": return <HomeWork key={b.id} work={c.work} />;
    case "reviews": return <HomeReviews key={b.id} reviews={c.reviews} />;
    case "services": return <Services key={b.id} c={c} />;
    case "cta": return <Cta key={b.id} c={c} />;
    default: return <Widget key={b.id} block={b} />;
  }
}

export default async function Home() {
  const c = await getHomepageContent();
  return <main>{c.blocks.map((b) => renderBlock(b, c))}</main>;
}

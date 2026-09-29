import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Palette, Search, ShoppingBag, LayoutDashboard, MessageSquare, Upload, PenLine } from "lucide-react";
import HeroScene from "@/components/HeroScene";
import PackageCard from "@/components/PackageCard";
import { packages } from "@/lib/packages";

const process = [
  { label: "Tell us", detail: "Share your business, your goals, and the domain you'd like." },
  { label: "Choose", detail: "Pick a package and any add-ons you need." },
  { label: "Confirm", detail: "Register a card for the Care Plan. The first year is free." },
  { label: "We build", detail: "Pay the build invoice by bank transfer and we design, build and launch." },
];

const ideas = [
  { icon: MessageSquare, title: "Tell us", detail: "Describe your business and what you need.", live: true },
  { icon: Upload, title: "Show us", detail: "Upload a design, screenshot or inspiration.", live: false },
  { icon: PenLine, title: "Draw it", detail: "Sketch your idea and we build the prototype.", live: false },
];

const health = [
  ["SSL", "Protected"],
  ["Hosting", "Active"],
  ["Backups", "Daily"],
  ["Monitoring", "Active"],
  ["Care Plan", "Active"],
];

const services = [
  { icon: LayoutDashboard, name: "Business websites", detail: "Clean, fast sites that convert visitors into enquiries." },
  { icon: ShoppingBag, name: "E-commerce & booking", detail: "Sell products or take bookings without the friction." },
  { icon: Palette, name: "Brand identity", detail: "Logo, colour, and voice, sorted before launch." },
  { icon: Search, name: "SEO & Google Business", detail: "Be findable the day your site goes live." },
];

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="relative isolate overflow-hidden border-b border-line bg-[#0c0d10] text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_75%_40%,rgba(45,110,219,0.18),transparent)]"
        />
        <div className="relative z-10 mx-auto flex max-w-7xl flex-col justify-center px-6 pb-10 pt-20 lg:min-h-[calc(100vh-65px)] lg:px-10 lg:pb-24 lg:pt-24">
          <div className="max-w-xl">
            <div className="label-tag mb-6 flex items-center gap-2 text-white/60">
              <span className="h-1.5 w-1.5 rounded-full bg-blueprint2" /> Website studio
            </div>
            <h1 className="font-display text-5xl leading-[1.02] tracking-tight lg:text-7xl">
              Your business.
              <br />
              <span className="bg-gradient-to-r from-white via-[#9db8ff] to-[#8b5cff] bg-clip-text text-transparent">
                Built for the web.
              </span>
            </h1>
            <p className="mt-6 max-w-md text-lg text-white/65">
              Websites, e-commerce and digital business systems designed around how you actually work.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/book-project"
                className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-medium text-paper transition-colors hover:bg-blueprint2 hover:text-white"
              >
                Start building
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link href="/pricing" className="text-sm text-white/80 hover:text-white">
                Explore packages
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              {packages.map((p) => (
                <Link
                  key={p.id}
                  href={`/book-project?package=${p.id}`}
                  className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 backdrop-blur transition-colors hover:border-[#8b5cff]"
                >
                  <span className="block text-sm font-medium">{p.name}</span>
                  <span className="block font-mono text-xs text-white/60">{p.priceLabel}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-0 h-72 sm:h-96 lg:absolute lg:inset-0 lg:h-auto">
          <HeroScene />
        </div>
      </section>

      {/* Start with an idea */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
          <p className="label-tag text-slate">Start with an idea</p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl lg:text-4xl">
            You bring the idea. We build the infrastructure.
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {ideas.map((i) => (
              <Link
                key={i.title}
                href="/book-project"
                className="crosshair group rounded-2xl border border-line bg-ink2 p-6 transition-colors hover:border-paper"
              >
                <div className="flex items-center justify-between">
                  <i.icon className="h-5 w-5 text-blueprint2" />
                  {!i.live && <span className="label-tag text-slateLight">Coming soon</span>}
                </div>
                <h3 className="mt-4 font-display text-xl">{i.title}</h3>
                <p className="mt-2 text-sm text-slate">{i.detail}</p>
              </Link>
            ))}
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

      {/* Domain */}
      <section className="border-b border-line bg-ink2">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-2 lg:px-10">
          <div>
            <p className="label-tag text-slate">Your domain</p>
            <h2 className="mt-3 font-display text-3xl lg:text-4xl">Your website starts with the right address.</h2>
            <p className="mt-4 max-w-md text-slate">
              Tell us the address you want. We check it and register it as part of your build.
            </p>
          </div>
          <form action="/book-project" method="get" className="self-center">
            <label htmlFor="domain" className="label-tag text-slate">Domain you would like</label>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <input id="domain" name="domain" placeholder="yourbusiness.co.uk" className="input" />
              <button
                type="submit"
                className="shrink-0 rounded-full bg-signal px-7 py-3 text-sm font-medium text-ink hover:bg-blueprint2"
              >
                Continue
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Process */}
      <section id="how" className="border-b border-line bg-ink2">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
          <p className="label-tag text-slate">How it works</p>
          <div className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-4">
            {process.map((step, i) => (
              <div key={step.label} className="bg-ink2 p-6">
                <span className="font-mono text-xs text-slateLight">0{i + 1}</span>
                <h3 className="mt-3 font-display text-xl">{step.label}</h3>
                <p className="mt-2 text-sm text-slate">{step.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Care Plan */}
      <section className="border-b border-line">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-20 lg:grid-cols-2 lg:px-10">
          <div>
            <p className="label-tag text-slate">Care Plan</p>
            <h2 className="mt-3 font-display text-3xl lg:text-4xl">Your website stays looked after. First year included.</h2>
            <p className="mt-4 max-w-md text-slate">
              Hosting, SSL, backups, security updates and monitoring. Then{" "}
              {packages.map((p) => `${p.name} £${p.carePlanYearly}`).join(", ")} a year.
            </p>
          </div>
          <div className="rounded-2xl bg-[#0c0d10] p-6 text-white">
            <div className="flex items-center justify-between">
              <span className="label-tag text-white/60">Website health</span>
              <span className="label-tag flex items-center gap-2 text-white/60">
                <span className="h-2 w-2 rounded-full bg-blueprint2" /> Live · example
              </span>
            </div>
            <dl className="mt-5 divide-y divide-white/10">
              {health.map(([k, v]) => (
                <div key={k} className="flex items-center justify-between py-3 text-sm">
                  <dt className="text-white/60">{k}</dt>
                  <dd className="font-mono">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Services + image */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
          <div className="flex items-end justify-between">
            <div>
              <p className="label-tag text-slate">What we build</p>
              <h2 className="mt-3 font-display text-3xl lg:text-4xl">
                One studio, every piece of your web presence.
              </h2>
            </div>
            <Link href="/services" className="hidden text-sm text-slate hover:text-paper md:block">
              All services →
            </Link>
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
              {services.map((s) => (
                <div key={s.name} className="crosshair rounded-2xl border border-line p-6">
                  <s.icon className="h-5 w-5 text-blueprint2" />
                  <h3 className="mt-4 font-display text-lg">{s.name}</h3>
                  <p className="mt-2 text-sm text-slate">{s.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Packages preview */}
      <section className="border-b border-line bg-ink2">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
          <p className="label-tag text-slate">Packages</p>
          <h2 className="mt-3 font-display text-3xl lg:text-4xl">Choose how far you want to go.</h2>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {packages.map((pkg, i) => (
              <PackageCard key={pkg.id} pkg={pkg} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="mx-auto max-w-7xl px-6 py-24 text-center lg:px-10">
          <h2 className="mx-auto max-w-2xl font-display text-3xl lg:text-4xl">
            Tell us what you do. We&apos;ll take it from there.
          </h2>
          <Link
            href="/book-project"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-signal px-7 py-3.5 text-sm font-medium text-ink hover:bg-blueprint2"
          >
            Start your project
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}

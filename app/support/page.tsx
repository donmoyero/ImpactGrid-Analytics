import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Palette, Search, ShoppingBag, LayoutDashboard, ShieldCheck, PoundSterling, Globe, Rocket } from "lucide-react";
import BlueprintGrid from "@/components/BlueprintGrid";
import PackageCard from "@/components/PackageCard";
import { packages } from "@/lib/packages";

const process = [
  { label: "Tell us", detail: "Share your business, your goals, and the domain you'd like." },
  { label: "Choose", detail: "Pick a package and any add-ons you need." },
  { label: "Pay", detail: "Checkout securely online with one clear price." },
  { label: "We build", detail: "We design, build, and launch. We keep you updated by email." },
];

const trust = [
  { icon: ShieldCheck, label: "Secure checkout with Stripe" },
  { icon: PoundSterling, label: "Fixed prices, no hidden fees" },
  { icon: Globe, label: "Domain setup handled for you" },
  { icon: Rocket, label: "Designed, built and launched by our studio" },
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
      {/* Hero: drop a photo at public/images/hero.png; the gradient shows until then */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-ink via-ink2 to-[#1a2244]" />
        <Image src="/images/hero.png" alt="" fill priority sizes="100vw" className="-z-10 object-cover opacity-70" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink via-ink/80 to-ink/10" />
        <BlueprintGrid />
        <div className="relative mx-auto flex min-h-[78vh] max-w-7xl flex-col justify-center px-6 py-24 lg:px-10">
          <div className="label-tag mb-6 flex items-center gap-2 text-slate">
            <span className="h-1.5 w-1.5 rounded-full bg-signal" /> Website studio
          </div>
          <h1 className="max-w-3xl font-display text-6xl leading-[1.02] tracking-tight lg:text-8xl">
            Websites that
            <br />
            <span className="italic text-blueprint2">mean business.</span>
          </h1>
          <p className="mt-8 max-w-xl text-lg text-paper/80">
            Choose a package, pay online, and we design, build and launch your
            website from start to finish.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/book-project"
              className="inline-flex items-center gap-2 rounded-full bg-signal px-8 py-4 text-sm font-medium text-ink transition-colors hover:bg-blueprint2"
            >
              Start your project
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center rounded-full border border-paper/30 px-8 py-4 text-sm text-paper transition-colors hover:border-paper"
            >
              See packages
            </Link>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-line bg-ink2">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 sm:grid-cols-2 lg:grid-cols-4 lg:px-10">
          {trust.map((t) => (
            <div key={t.label} className="flex items-center gap-3 text-sm text-paper/90">
              <t.icon className="h-5 w-5 shrink-0 text-blueprint2" />
              {t.label}
            </div>
          ))}
        </div>
      </section>

      {/* Process */}
      <section className="border-b border-line bg-ink2">
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
          <h2 className="mt-3 font-display text-3xl lg:text-4xl">Clear prices. Nothing to configure.</h2>

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

import Link from "next/link";
import { ArrowUpRight, Palette, Search, ShoppingBag, LayoutDashboard } from "lucide-react";
import BlueprintGrid from "@/components/BlueprintGrid";
import DomainSearchBox from "@/components/DomainSearchBox";
import PackageCard from "@/components/PackageCard";
import { packages } from "@/lib/packages";

const process = [
  { label: "Search", detail: "Search and reserve your domain in one step." },
  { label: "Choose", detail: "Pick a package and any add-ons you need." },
  { label: "Pay", detail: "Checkout securely — one clear price, no surprises." },
  { label: "Build", detail: "We design and build while you track progress." },
];

const services = [
  { icon: LayoutDashboard, name: "Business websites", detail: "Clean, fast sites that convert visitors into enquiries." },
  { icon: ShoppingBag, name: "E-commerce & booking", detail: "Sell products or take bookings without the friction." },
  { icon: Palette, name: "Brand identity", detail: "Logo, colour, and voice — sorted before launch." },
  { icon: Search, name: "SEO & Google Business", detail: "Be findable the day your site goes live." },
];

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line">
        <BlueprintGrid />
        <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-20 lg:px-10 lg:pb-32 lg:pt-28">
          <div className="label-tag mb-6 flex items-center gap-2 text-slate">
            <span className="h-1.5 w-1.5 rounded-full bg-signal" /> Website studio — domain to launch
          </div>
          <h1 className="max-w-3xl font-display text-5xl leading-[1.05] tracking-tight lg:text-7xl">
            Buy your website
            <br />
            like a <span className="italic text-blueprint2">finished thing.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-slate">
            Search a domain, choose a package, and pay online. We design and build
            the site — you just watch it come together in your dashboard.
          </p>

          <div className="mt-10 max-w-xl">
            <DomainSearchBox />
          </div>

          <div className="mt-6 flex items-center gap-6">
            <Link
              href="/pricing"
              className="group flex items-center gap-1.5 text-sm text-paper hover:text-blueprint2"
            >
              See packages
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <Link href="/portfolio" className="text-sm text-slate hover:text-paper">
              View our work
            </Link>
          </div>
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

      {/* Services */}
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

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((s) => (
              <div key={s.name} className="crosshair rounded-2xl border border-line p-6">
                <s.icon className="h-5 w-5 text-blueprint2" />
                <h3 className="mt-4 font-display text-lg">{s.name}</h3>
                <p className="mt-2 text-sm text-slate">{s.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages preview */}
      <section className="border-b border-line bg-ink2">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
          <p className="label-tag text-slate">Packages</p>
          <h2 className="mt-3 font-display text-3xl lg:text-4xl">One price. Nothing to configure.</h2>

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
            Tell us what you do. We'll take it from there.
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

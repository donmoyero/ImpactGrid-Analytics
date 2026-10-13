"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import HeroScene from "@/components/HeroScene";
import { GET_STARTED_URL } from "@/lib/platform";

type Card = {
  kind: string;
  note: string;
  brand: string;
  brandSub?: string;
  links: string[];
  navButton: string;
  heading: string;
  sub: string;
  button: string;
  image: string;
  alt: string;
  tone: "dark" | "light";
  accent: string; // button colours
  nameClass: string;
};

const CARDS: Card[] = [
  {
    kind: "Service business",
    note: "Beauty salon with online booking, services and gallery.",
    brand: "LUXE BEAUTY",
    brandSub: "Salon & Spa",
    links: ["Home", "About", "Gallery", "Contact"],
    navButton: "Book Now",
    heading: "Enhance Your Natural Beauty",
    sub: "Hair · Skin · Nails · Beauty · Relaxation",
    button: "Book Appointment",
    image: "/images/showcase-service.jpg",
    alt: "Example salon website with a woman wearing an orchid in her hair",
    tone: "dark",
    accent: "bg-[#f1d9b8] text-[#2a1d10]",
    nameClass: "font-serif tracking-[0.08em]",
  },
  {
    kind: "Local business",
    note: "Construction business with enquiries, project gallery and contact tools.",
    brand: "ProBuild",
    brandSub: "Construction",
    links: ["Home", "About", "Services", "Gallery", "Contact"],
    navButton: "Get a Quote",
    heading: "Quality Construction You Can Trust",
    sub: "Residential · Commercial · Renovations",
    button: "Get a Free Quote",
    image: "/images/showcase-local.jpg",
    alt: "Example construction website with a modern house lit at dusk",
    tone: "dark",
    accent: "bg-[#2563eb] text-white",
    nameClass: "font-display",
  },
  {
    kind: "Online store",
    note: "Fashion store with product catalogue, payments and order management.",
    brand: "VELORA",
    brandSub: "Boutique",
    links: ["Home", "Shop", "About", "Contact"],
    navButton: "",
    heading: "Modern Style for Every You",
    sub: "Timeless pieces for a confident you.",
    button: "Shop Collection",
    image: "/images/showcase-store.jpg",
    alt: "Example fashion store website with a model in a cream suit",
    tone: "light",
    accent: "bg-[#14110d] text-white",
    nameClass: "font-serif tracking-[0.14em]",
  },
];

function Mock({ c }: { c: Card }) {
  const dark = c.tone === "dark";
  return (
    <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-line bg-charcoal shadow-soft">
      <Image src={c.image} alt={c.alt} fill sizes="(min-width: 1024px) 33vw, 85vw" className="object-cover" style={{ objectPosition: dark ? "center" : "right center" }} />
      <div
        aria-hidden
        className={`absolute inset-0 ${dark ? "bg-gradient-to-r from-black/80 via-black/35 to-transparent" : "bg-gradient-to-r from-[#e9d5bd] via-[#e9d5bd]/70 to-transparent"}`}
      />
      <div className={`relative flex h-full flex-col p-4 sm:p-5 ${dark ? "text-white" : "text-[#14110d]"}`}>
        <div className="flex items-center justify-between gap-2 whitespace-nowrap text-[9px] sm:text-[10px]">
          <span className={`text-[13px] leading-none sm:text-sm ${c.nameClass}`}>
            {c.brand}
            {c.brandSub && <span className="mt-0.5 block text-[7px] font-normal tracking-widest opacity-70 sm:text-[8px]">{c.brandSub.toUpperCase()}</span>}
          </span>
          <span className="hidden items-center gap-2.5 opacity-90 sm:flex">
            {c.links.map((l) => (
              <span key={l}>{l}</span>
            ))}
            {c.navButton && <span className={`rounded-full px-3 py-1 ${c.accent}`}>{c.navButton}</span>}
          </span>
        </div>
        <div className="mt-auto max-w-[62%]">
          <p className="font-serif text-2xl leading-[1.05] sm:text-[1.7rem] lg:text-[1.9rem]">{c.heading}</p>
          <p className="mt-2 text-[10px] opacity-80 sm:text-xs">{c.sub}</p>
          <span className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[10px] font-medium sm:text-xs ${c.accent}`}>
            {c.button} <ArrowUpRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Showcase() {
  const scroller = useRef<HTMLDivElement>(null);
  const go = (dir: 1 | -1) => {
    const el = scroller.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };
  return (
    <section className="border-b border-line bg-sand/60" aria-labelledby="showcase-heading">
      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-10 lg:py-16">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="label-tag text-slate">Real businesses. Real results.</p>
            <h2 id="showcase-heading" className="mt-3 font-display text-3xl lg:text-4xl">
              Built around your business
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <p className="max-w-xs text-sm text-slate">We design and build websites and digital systems for businesses of every type.</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => go(-1)} aria-label="Previous examples" className="flex h-11 w-11 items-center justify-center rounded-full border border-line2 bg-ink2 transition-colors hover:border-paper">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => go(1)} aria-label="Next examples" className="flex h-11 w-11 items-center justify-center rounded-full border border-line2 bg-ink2 transition-colors hover:border-paper">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div ref={scroller} className="-mx-6 mt-8 flex snap-x snap-mandatory scroll-px-6 gap-6 overflow-x-auto px-6 pb-2 [scrollbar-width:none] lg:mx-0 lg:scroll-px-0 lg:px-0 [&::-webkit-scrollbar]:hidden">
          {CARDS.map((c) => (
            <article key={c.kind} className="w-[85%] shrink-0 snap-start sm:w-[60%] lg:w-[calc((100%-3rem)/3)]">
              <Mock c={c} />
              <h3 className="mt-4 font-display text-base">{c.kind}</h3>
              <p className="mt-1 text-sm text-slate">{c.note}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Slim call to action under the showcase. */
export function CtaStrip({ heading, button }: { heading: string; button: string }) {
  return (
    <section className="relative isolate overflow-hidden bg-[#0c0d10] text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_75%_50%,rgba(45,110,219,0.18),transparent)]"
      />
      <div className="relative z-10 mx-auto flex max-w-7xl flex-col justify-center px-6 py-16 lg:min-h-[30rem] lg:px-10 lg:py-24">
        <div className="max-w-xl">
          <h2 className="font-display text-3xl leading-tight tracking-tight lg:text-5xl">{heading}</h2>
          <Link
            href={GET_STARTED_URL}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-medium text-paper transition-colors hover:bg-blueprint2 hover:text-white"
          >
            {button}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
      <div className="relative z-0 h-72 sm:h-96 lg:absolute lg:inset-0 lg:h-auto">
        <HeroScene />
      </div>
    </section>
  );
}

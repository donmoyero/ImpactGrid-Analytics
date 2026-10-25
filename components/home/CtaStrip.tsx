import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import HeroScene from "@/components/HeroScene";
import { GET_STARTED_URL } from "@/lib/platform";

/** Slim call to action at the bottom of the homepage. */
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

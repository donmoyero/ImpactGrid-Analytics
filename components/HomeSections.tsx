import PlatformFlow from "@/components/PlatformFlow";
import IndustryTabs from "@/components/IndustryTabs";
import type { HomepageContent } from "@/lib/site/content";

export function HowItWorks({ how }: { how: HomepageContent["how"] }) {
  return (
      <section id="how" className="border-b border-line bg-ink2">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
          {how.eyebrow && <p className="label-tag text-slate">{how.eyebrow}</p>}
          <ol className="mt-10 grid gap-8 md:grid-cols-6 md:gap-0">
            {how.steps.map((s, i) => (
              <li key={s.label} className="relative md:pr-6">
                <div className="hidden h-px bg-line2 md:block" />
                <span className="absolute -top-[3px] left-0 hidden h-1.5 w-1.5 rounded-full bg-signal md:block" />
                <span className="font-mono text-4xl text-slateLight md:mt-6 md:block lg:text-5xl">0{i + 1}</span>
                <h3 className="mt-2 font-display text-xl">{s.label}</h3>
                <p className="mt-2 text-sm text-slate">{s.detail}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
  );
}

export function Examples() {
  return (
      <section className="border-b border-line">
        <div className="mx-auto max-w-4xl px-6 py-20 lg:px-10">
          <p className="label-tag text-slate">Examples</p>
          <h2 className="mt-3 mb-8 font-display text-3xl lg:text-4xl">Imagine your business online.</h2>
          <IndustryTabs />
        </div>
      </section>
  );
}

export function Platform() {
  return (
      <section className="border-b border-white/10 bg-[#0c0d10] text-white">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
          <p className="label-tag text-white/60">Business package</p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl lg:text-5xl">More than a website.</h2>
          <p className="mt-4 mb-10 max-w-xl text-white/65">
            Your website can become the operating layer for your business.
          </p>
          <PlatformFlow />
        </div>
      </section>
  );
}

export function AiSection({ ai }: { ai: HomepageContent["ai"] }) {
  return (
      <section className="border-b border-line">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
          {ai.eyebrow && <p className="label-tag text-slate">{ai.eyebrow}</p>}
          <h2 className="mt-3 max-w-2xl font-display text-3xl lg:text-4xl">{ai.heading}</h2>
          <ul className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-5">
            {ai.items.map((a) => (
              <li key={a.area} className="bg-ink2 p-6">
                <span className="label-tag text-blueprint2">{a.area}</span>
                <p className="mt-4 font-display text-lg leading-snug">&ldquo;{a.prompt}&rdquo;</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
  );
}


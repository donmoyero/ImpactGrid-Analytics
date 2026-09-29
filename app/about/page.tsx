import Image from "next/image";

export const metadata = { title: "About — ImpactGrid Analytics" };

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <p className="label-tag text-slate">About</p>
          <h1 className="mt-3 font-display text-4xl lg:text-5xl">A studio, not a self-serve tool.</h1>
          <div className="mt-8 space-y-5 text-slate">
            <p>
              ImpactGrid Analytics is the website studio inside the ImpactGrid
              ecosystem. Where most page builders hand you a blank canvas and
              hope for the best, we work the way a good agency always has: you
              tell us about your business, and we design and build it for you.
            </p>
            <p>
              We keep the studio focused: domains, design, build, and the
              ongoing care a live site needs. Nothing you don&apos;t need,
              nothing you have to configure yourself.
            </p>
          </div>
        </div>
        <Image
          src="/images/studio-process.svg"
          alt="Wireframe, brand palette, and finished site side by side"
          width={640}
          height={440}
          unoptimized
          className="w-full rounded-2xl border border-line"
        />
      </div>
    </main>
  );
}

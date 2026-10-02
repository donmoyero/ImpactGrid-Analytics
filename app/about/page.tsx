import Image from "next/image";

export const metadata = { title: "About — ImpactGrid Analytics" };

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <p className="label-tag text-slate">About</p>
          <h1 className="mt-3 font-display text-4xl lg:text-5xl">One place to run your business.</h1>
          <div className="mt-8 space-y-5 text-slate">
            <p>
              ImpactGrid Analytics is the business platform inside the ImpactGrid ecosystem. Customers, staff, appointments, products and your own website live in one place, so you spend less time juggling tools and more time running your business.
            </p>
            <p>
              We keep it focused on what a working business needs. Nothing you don&apos;t need, and nothing you have to piece together yourself.
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

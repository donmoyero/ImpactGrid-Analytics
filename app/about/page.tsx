import Image from "next/image";
import { Users, CalendarCheck, ShoppingBag, Globe, LayoutDashboard } from "lucide-react";

export const metadata = { title: "About — ShopPlug" };

const pieces = [
  { icon: Users, label: "Customers & staff" },
  { icon: CalendarCheck, label: "Appointments" },
  { icon: ShoppingBag, label: "Products" },
  { icon: Globe, label: "Your own website" },
];

export default function AboutPage() {
  return (
    <main>
      <section className="border-b border-line">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 pb-20 pt-20 lg:grid-cols-2 lg:gap-20 lg:px-10 lg:pb-28 lg:pt-28">
          <div>
            <p className="eyebrow">About</p>
            <h1 className="mt-5 font-display text-4xl leading-[1.05] tracking-tight lg:text-6xl">
              One place to run your business.
            </h1>
            <div className="mt-8 space-y-5 text-lg leading-relaxed text-slate">
              <p>
                ShopPlug is the business platform built for running everything in one place. Customers, staff, appointments, products and your own website all live together, so you spend less time juggling tools and more time running your business.
              </p>
              <p>
                We keep it focused on what a working business needs. Nothing you don&apos;t need, and nothing you have to piece together yourself.
              </p>
            </div>
          </div>

          <div className="relative">
            <div
              aria-hidden
              className="absolute -inset-6 -z-10 rounded-[2rem] bg-[radial-gradient(ellipse_70%_70%_at_50%_50%,rgba(45,110,219,0.12),transparent)]"
            />
            <Image
              src="/images/studio-process.svg"
              alt="Wireframe, brand palette, and finished site side by side"
              width={640}
              height={440}
              unoptimized
              className="w-full rounded-3xl border border-line bg-ink2 p-2 shadow-lift"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-24">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-5 w-5 text-blueprint2" />
          <p className="eyebrow">Everything in one dashboard</p>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {pieces.map(({ icon: Icon, label }) => (
            <div key={label} className="card-premium flex items-center gap-4 p-6">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blueprint2/10 text-blueprint2">
                <Icon className="h-5 w-5" />
              </span>
              <span className="font-display text-lg leading-tight">{label}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

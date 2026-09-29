import PackageCard from "@/components/PackageCard";
import { packages, addons, carePlanIncludes } from "@/lib/packages";
import { formatGBP } from "@/lib/utils";

export const metadata = { title: "Pricing — ImpactGrid Analytics" };

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
      <p className="label-tag text-slate">Pricing</p>
      <h1 className="mt-3 max-w-2xl font-display text-4xl lg:text-5xl">
        Three ways to get online. No hidden line items.
      </h1>
      <p className="mt-4 max-w-xl text-slate">
        Domain setup is handled for you with every package.
        Add extras below if you need more than the base build.
      </p>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {packages.map((pkg, i) => (
          <PackageCard key={pkg.id} pkg={pkg} index={i} />
        ))}
      </div>

      <div className="mt-20 grid gap-8 rounded-2xl border border-line bg-ink2 p-8 lg:grid-cols-2 lg:p-10">
        <div>
          <p className="label-tag text-slate">Care Plan</p>
          <h2 className="mt-3 font-display text-2xl lg:text-3xl">Your first year is free.</h2>
          <p className="mt-3 text-slate">
            Every website comes with our Care Plan. You register a card with Stripe and agree to a yearly
            debit, but nothing is taken for the first 12 months. After that it renews once a year until
            you cancel. The website build itself is invoiced separately, by bank transfer.
          </p>
        </div>
        <ul className="space-y-3 self-center text-sm">
          {carePlanIncludes.map((item) => (
            <li key={item} className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-blueprint2" />
              {item}
            </li>
          ))}
          <li className="pt-2 text-slate">
            {packages.map((p) => `${p.name} ${formatGBP(p.carePlanYearly)}/yr`).join("  ·  ")}
          </li>
        </ul>
      </div>

      <div className="mt-20">
        <p className="label-tag text-slate">Add-ons</p>
        <h2 className="mt-3 font-display text-2xl">Add to any package</h2>

        <div className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
          {addons.map((a) => (
            <div key={a.id} className="flex items-center justify-between bg-ink2 p-6">
              <div>
                <h3 className="font-medium">{a.name}</h3>
                <p className="mt-1 text-sm text-slate">{a.description}</p>
              </div>
              <span className="ml-4 shrink-0 font-mono text-sm text-blueprint2">
                {formatGBP(a.price)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

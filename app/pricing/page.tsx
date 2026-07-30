import PackageCard from "@/components/PackageCard";
import { packages, addons } from "@/lib/packages";
import { formatGBP } from "@/lib/utils";

export const metadata = { title: "Pricing — ImpactGrid Digital" };

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
      <p className="label-tag text-slate">Pricing</p>
      <h1 className="mt-3 max-w-2xl font-display text-4xl lg:text-5xl">
        Three ways to get online. No hidden line items.
      </h1>
      <p className="mt-4 max-w-xl text-slate">
        Every package includes the domain search and setup handled for you.
        Add extras below if you need more than the base build.
      </p>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {packages.map((pkg, i) => (
          <PackageCard key={pkg.id} pkg={pkg} index={i} />
        ))}
      </div>

      <div className="mt-20">
        <p className="label-tag text-slate">Add-ons</p>
        <h2 className="mt-3 font-display text-2xl">Add to any package</h2>

        <div className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
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

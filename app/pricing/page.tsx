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

      <div className="mt-20">
        <p className="label-tag text-slate">What you pay, and when</p>
        <h2 className="mt-3 font-display text-2xl lg:text-3xl">Build fee once. Care Plan yearly.</h2>
        <p className="mt-3 max-w-2xl text-slate">
          The build is a one-off invoice, paid by bank transfer. Hosting, maintenance and support
          are the Care Plan, billed separately and free for the first year.
        </p>

        <div className="mt-8 overflow-x-auto rounded-2xl border border-line bg-ink2">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="p-5 font-normal text-slate"> </th>
                {packages.map((p) => (
                  <th key={p.id} className="p-5 font-display text-lg">
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-line">
                <td className="p-5 text-slate">Website build (one-off, bank transfer)</td>
                {packages.map((p) => (
                  <td key={p.id} className="p-5 font-mono">{formatGBP(p.price)}</td>
                ))}
              </tr>
              <tr className="border-b border-line">
                <td className="p-5 text-slate">Care Plan, first year</td>
                {packages.map((p) => (
                  <td key={p.id} className="p-5 font-mono text-blueprint2">Free</td>
                ))}
              </tr>
              <tr className="border-b border-line">
                <td className="p-5 font-medium">Total in year one</td>
                {packages.map((p) => (
                  <td key={p.id} className="p-5 font-mono font-medium">{formatGBP(p.price)}</td>
                ))}
              </tr>
              <tr>
                <td className="p-5 text-slate">Care Plan from year two (card, yearly)</td>
                {packages.map((p) => (
                  <td key={p.id} className="p-5 font-mono">{formatGBP(p.carePlanYearly)}/yr</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-slate">
          You can cancel the Care Plan before it renews.
        </p>
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

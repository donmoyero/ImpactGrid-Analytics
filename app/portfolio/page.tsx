const work = [
  { name: "Impact Bakery", type: "Restaurant website", package: "Business" },
  { name: "North Fade Barbers", type: "Booking website", package: "Business" },
  { name: "Willow & Co", type: "E-commerce website", package: "Premium" },
  { name: "Harper Legal", type: "Business website", package: "Starter" },
];

export const metadata = { title: "Portfolio — ImpactGrid Digital" };

export default function PortfolioPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
      <p className="label-tag text-slate">Portfolio</p>
      <h1 className="mt-3 max-w-2xl font-display text-4xl lg:text-5xl">Recent builds.</h1>
      <p className="mt-4 max-w-xl text-slate">
        A sample of projects delivered through the studio. Replace these with
        real case studies as projects launch.
      </p>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {work.map((w) => (
          <div key={w.name} className="crosshair overflow-hidden rounded-2xl border border-line">
            <div className="flex aspect-video items-center justify-center bg-grid bg-grid bg-ink2">
              <span className="label-tag text-slate">{w.package} package</span>
            </div>
            <div className="p-6">
              <h3 className="font-display text-xl">{w.name}</h3>
              <p className="mt-1 text-sm text-slate">{w.type}</p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

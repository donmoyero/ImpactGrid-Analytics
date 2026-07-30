import Link from "next/link";

const columns = [
  {
    title: "Studio",
    links: [
      { href: "/about", label: "About" },
      { href: "/portfolio", label: "Portfolio" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Buy",
    links: [
      { href: "/pricing", label: "Packages" },
      { href: "/domain-search", label: "Domain search" },
      { href: "/book-project", label: "Start a project" },
    ],
  },
  {
    title: "Clients",
    links: [
      { href: "/login", label: "Client login" },
      { href: "/support", label: "Support" },
      { href: "/dashboard", label: "Dashboard" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-line bg-ink">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <div className="grid grid-cols-2 gap-10 lg:grid-cols-5">
          <div className="col-span-2">
            <div className="flex items-center gap-2 font-display text-xl">
              <span className="inline-block h-2 w-2 rounded-full bg-signal" />
              ImpactGrid Digital
            </div>
            <p className="mt-4 max-w-xs text-sm text-slate">
              A done-for-you web studio. Pick a package, register your domain, and
              we build it — while you watch it come together in your dashboard.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <p className="label-tag text-slateLight">{col.title}</p>
              <ul className="mt-4 space-y-3">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-slate hover:text-paper">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-line pt-8 text-xs text-slateLight lg:flex-row lg:items-center">
          <span>© {new Date().getFullYear()} ImpactGrid Digital. Part of the ImpactGrid ecosystem.</span>
          <span className="label-tag">Built on Next.js · Supabase · Stripe</span>
        </div>
      </div>
    </footer>
  );
}

import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import { GET_STARTED_URL } from "@/lib/platform";

const columns = [
  {
    title: "Company",
    links: [
      { href: "/templates", label: "Templates" },
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Platform",
    links: [{ href: GET_STARTED_URL, label: "Get started" }],
  },
  {
    title: "Help",
    links: [{ href: "/support", label: "Support & FAQ" }],
  },
];

export default function Footer() {
  return (
    <footer className="bg-ink text-paper">
      <div className="mx-auto max-w-7xl px-6 pb-10 pt-12 lg:px-10 lg:pt-14">
        <div className="grid grid-cols-2 gap-10 lg:grid-cols-5">
          <div className="col-span-2">
            <div className="flex items-center gap-2 font-display text-lg">
              <BrandMark className="h-8 w-8" />
              <span>
                ImpactGrid <span className="text-slate">Business</span>
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate">
              Run your business, your team and your website from one dashboard.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <p className="label-tag text-slateLight">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="link-underline text-sm text-slate transition-colors hover:text-paper">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-line pt-6 text-xs text-slateLight lg:flex-row lg:items-center">
          <span>© {new Date().getFullYear()} ImpactGrid Business. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}

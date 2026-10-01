import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import { PLATFORM_LOGIN_URL } from "@/lib/platform";

const columns = [
  {
    title: "Studio",
    links: [
      { href: "/about", label: "About" },
      { href: "/services", label: "Services" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Platform",
    links: [{ href: PLATFORM_LOGIN_URL, label: "Get started" }],
  },
  {
    title: "Help",
    links: [{ href: "/support", label: "Support & FAQ" }],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-line bg-ink">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <div className="grid grid-cols-2 gap-10 lg:grid-cols-5">
          <div className="col-span-2">
            <div className="flex items-center gap-2 font-display text-xl">
              <BrandMark dot="inline-block h-2 w-2 rounded-full bg-signal" />
              ImpactGrid Analytics
            </div>
            <p className="mt-4 max-w-xs text-sm text-slate">
              Run your business, your team and your website from one dashboard.
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
          <span>© {new Date().getFullYear()} ImpactGrid Analytics. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}

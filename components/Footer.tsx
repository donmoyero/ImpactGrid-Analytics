import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import { LOGIN_URL } from "@/lib/platform";

const columns = [
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Platform",
    links: [{ href: LOGIN_URL, label: "Get started" }],
  },
  {
    title: "Help",
    links: [{ href: "/support", label: "Support & FAQ" }],
  },
];

export default function Footer() {
  return (
    <footer className="relative isolate overflow-hidden bg-charcoal text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_45%_70%_at_85%_0%,rgba(45,110,219,0.16),transparent),radial-gradient(ellipse_35%_50%_at_0%_100%,rgba(139,92,255,0.10),transparent)]"
      />
      <div className="relative mx-auto max-w-7xl px-6 pb-10 pt-16 lg:px-10 lg:pt-20">
        <div className="grid grid-cols-2 gap-10 lg:grid-cols-5">
          <div className="col-span-2">
            <div className="flex items-center gap-2 font-display text-xl">
              <BrandMark dot="inline-block h-2 w-2 rounded-full bg-blueprint2" />
              ImpactGrid Analytics
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
              Run your business, your team and your website from one dashboard.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <p className="label-tag text-white/40">{col.title}</p>
              <ul className="mt-5 space-y-3">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="link-underline text-sm text-white/70 transition-colors hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-8 text-xs text-white/40 lg:flex-row lg:items-center">
          <span>© {new Date().getFullYear()} ImpactGrid Analytics. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}

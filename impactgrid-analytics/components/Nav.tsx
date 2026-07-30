"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, ArrowUpRight } from "lucide-react";

const links = [
  { href: "/services", label: "Services" },
  { href: "/pricing", label: "Pricing" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/domain-search", label: "Domain search" },
  { href: "/about", label: "About" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-ink/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
        <Link href="/" className="flex items-center gap-2 font-display text-lg tracking-tight">
          <span className="inline-block h-2 w-2 rounded-full bg-signal" />
          ImpactGrid <span className="text-slate">Digital</span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="label-tag text-slate transition-colors hover:text-paper"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/login" className="label-tag text-slate hover:text-paper">
            Client login
          </Link>
          <Link
            href="/book-project"
            className="group flex items-center gap-1.5 rounded-full bg-paper px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-blueprint2 hover:text-ink"
          >
            Start a project
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        <button
          className="text-paper lg:hidden"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-line px-6 py-6 lg:hidden">
          <div className="flex flex-col gap-5">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="text-base text-paper" onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            ))}
            <Link href="/login" className="text-base text-slate" onClick={() => setOpen(false)}>
              Client login
            </Link>
            <Link
              href="/book-project"
              className="mt-2 rounded-full bg-paper px-4 py-3 text-center text-sm font-medium text-ink"
              onClick={() => setOpen(false)}
            >
              Start a project
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

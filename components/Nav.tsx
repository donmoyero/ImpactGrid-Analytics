"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/services", label: "Services" },
  { href: "/#how", label: "How it works" },
  { href: "/pricing", label: "Packages" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isHome = usePathname() === "/";
  // On the homepage the bar sits dark over the hero, then turns solid cream after scrolling.
  const dark = isHome && !scrolled && !open;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b backdrop-blur transition-colors duration-300",
        dark ? "border-white/10 bg-[#0c0d10]/80 text-white" : "border-line bg-ink/90 text-paper"
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
        <Link href="/" className="flex items-center gap-2 font-display text-lg tracking-tight">
          <span className={cn("inline-block h-2 w-2 rounded-full", dark ? "bg-blueprint2" : "bg-signal")} />
          ImpactGrid <span className={dark ? "text-white/60" : "text-slate"}>Analytics</span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn("label-tag transition-colors", dark ? "text-white/70 hover:text-white" : "text-slate hover:text-paper")}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/login"
            className={cn("label-tag transition-colors", dark ? "text-white/70 hover:text-white" : "text-slate hover:text-paper")}
          >
            Sign in
          </Link>
          <Link
            href="/book-project"
            className={cn(
              "group flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors hover:bg-blueprint2 hover:text-white",
              dark ? "bg-white text-paper" : "bg-paper text-ink"
            )}
          >
            Start a project
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>

        <button
          className="lg:hidden"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-line bg-ink px-6 py-6 text-paper lg:hidden">
          <div className="flex flex-col gap-5">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="text-base" onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            ))}
            <Link href="/login" className="text-base" onClick={() => setOpen(false)}>
              Sign in
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

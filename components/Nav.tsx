"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import BrandMark from "@/components/BrandMark";
import SignOutButton from "@/components/dashboard/SignOutButton";
import { PLATFORM_LOGIN_URL, PLATFORM_URL } from "@/lib/platform";

const links = [
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isHome = usePathname() === "/";
  const [signedIn, setSignedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Display only: the admin pages re-check the session on the server (requireAdmin).
  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    const apply = (session: { user: { id: string } } | null) => {
      setSignedIn(!!session);
      if (!session) {
        setIsAdmin(false);
        return;
      }
      // Asked of our own server, which checks profiles.is_admin itself (no browser-side database rules involved).
      fetch("/api/me", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : { isAdmin: false }))
        .then((j) => {
          if (!cancelled) setIsAdmin(!!j.isAdmin);
        })
        .catch(() => {});
    };

    supabase.auth.getSession().then(({ data }) => apply(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => apply(session));
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const dashHref = isAdmin ? "/admin" : PLATFORM_URL;
  const dashLabel = isAdmin ? "Admin dashboard" : "Open platform";

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
          <BrandMark dot={cn("inline-block h-2 w-2 rounded-full", dark ? "bg-blueprint2" : "bg-signal")} />
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
            href={signedIn ? dashHref : "/login"}
            className={cn("label-tag transition-colors", dark ? "text-white/70 hover:text-white" : "text-slate hover:text-paper")}
          >
            {signedIn ? dashLabel : "Sign in"}
          </Link>
          {signedIn && (
            <SignOutButton
              className={cn("label-tag transition-colors", dark ? "text-white/70 hover:text-white" : "text-slate hover:text-paper")}
            />
          )}
          <Link
            href={PLATFORM_LOGIN_URL}
            className={cn(
              "group flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors hover:bg-blueprint2 hover:text-white",
              dark ? "bg-white text-paper" : "bg-paper text-ink"
            )}
          >
            Get started
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
            <Link href={signedIn ? dashHref : "/login"} className="text-base" onClick={() => setOpen(false)}>
              {signedIn ? dashLabel : "Sign in"}
            </Link>
            {signedIn && <SignOutButton className="text-left text-base" onDone={() => setOpen(false)} />}
            <Link
              href={PLATFORM_LOGIN_URL}
              className="mt-2 rounded-full bg-paper px-4 py-3 text-center text-sm font-medium text-ink"
              onClick={() => setOpen(false)}
            >
              Get started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

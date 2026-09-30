"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin/bookings", label: "Bookings", exact: false },
  { href: "/admin/invoices", label: "Invoices", exact: false },
  { href: "/admin", label: "Customers", exact: true },
  { href: "/admin/homepage", label: "Homepage", exact: false },
  { href: "/admin/settings", label: "Settings", exact: false },
];

export default function AdminNav({ pending = 0 }: { pending?: number }) {
  const path = usePathname();
  return (
    <nav aria-label="Admin" className="flex gap-1 lg:flex-col">
      {items.map((i) => {
        const active = i.exact ? path === i.href : path.startsWith(i.href);
        return (
          <Link
            key={i.href}
            href={i.href}
            aria-current={active ? "page" : undefined}
            className={cn("rounded-lg px-3 py-2 text-sm font-medium", active ? "bg-paper text-ink" : "text-slate hover:bg-sand hover:text-paper")}
          >
            {i.label}
            {i.href === "/admin/bookings" && pending > 0 && (
              <span className="ml-2 rounded-full bg-signal px-2 py-0.5 text-xs text-ink">{pending}</span>
            )}
          </Link>
        );
      })}
      <Link href="/" target="_blank" className="rounded-lg px-3 py-2 text-sm text-slate hover:bg-sand hover:text-paper">
        View site
      </Link>
    </nav>
  );
}

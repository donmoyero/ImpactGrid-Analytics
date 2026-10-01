"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [{ href: "/admin/homepage", label: "Homepage" }];

export default function AdminNav() {
  const path = usePathname();
  return (
    <nav aria-label="Admin" className="flex gap-1 lg:flex-col">
      {items.map((i) => {
        const active = path.startsWith(i.href);
        return (
          <Link
            key={i.href}
            href={i.href}
            aria-current={active ? "page" : undefined}
            className={cn("rounded-lg px-3 py-2 text-sm font-medium", active ? "bg-paper text-ink" : "text-slate hover:bg-sand hover:text-paper")}
          >
            {i.label}
          </Link>
        );
      })}
      <Link href="/" target="_blank" className="rounded-lg px-3 py-2 text-sm text-slate hover:bg-sand hover:text-paper">
        View site
      </Link>
    </nav>
  );
}

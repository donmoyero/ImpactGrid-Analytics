"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutTemplate, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [{ href: "/admin/homepage", label: "Homepage", icon: LayoutTemplate }];

export default function AdminNav() {
  const path = usePathname();
  return (
    <nav aria-label="Admin" className="flex gap-1 lg:flex-col">
      {items.map((i) => {
        const active = path.startsWith(i.href);
        const Icon = i.icon;
        return (
          <Link
            key={i.href}
            href={i.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
            )}
          >
            {active && <span aria-hidden className="absolute -left-4 top-2 hidden h-6 w-[3px] rounded-r-full bg-blueprint2 lg:block" />}
            <Icon className="h-4 w-4" />
            {i.label}
          </Link>
        );
      })}
      <Link
        href="/"
        target="_blank"
        className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white"
      >
        <ExternalLink className="h-4 w-4" />
        View site
      </Link>
    </nav>
  );
}

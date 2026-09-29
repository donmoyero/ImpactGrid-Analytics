"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { DashboardSection } from "@/lib/dashboard/sections";
import SignOutButton from "./SignOutButton";

export default function Sidebar({ sections }: { sections: DashboardSection[] }) {
  const path = usePathname();
  return (
    <nav aria-label="Dashboard" className="flex flex-col gap-6 text-sm">
      <Link
        href="/dashboard"
        className={cn("rounded-lg px-3 py-2 font-medium", path === "/dashboard" ? "bg-sand text-paper" : "text-slate hover:text-paper")}
      >
        Overview
      </Link>
      {sections.map((s) => (
        <div key={s.id}>
          <p className="px-3 pb-1 font-display text-base text-paper">{s.label}</p>
          <ul>
            {s.items.map((i) => (
              <li key={i.href}>
                {i.built ? (
                  <Link
                    href={i.href}
                    className={cn("block rounded-lg px-3 py-1.5", path === i.href ? "bg-sand text-paper" : "text-slate hover:text-paper")}
                  >
                    {i.label}
                  </Link>
                ) : (
                  <span className="flex items-center justify-between px-3 py-1.5 text-slateLight" aria-disabled="true">
                    {i.label}
                    <span className="text-xs">Soon</span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div className="border-t border-line pt-4">
        <SignOutButton />
      </div>
    </nav>
  );
}

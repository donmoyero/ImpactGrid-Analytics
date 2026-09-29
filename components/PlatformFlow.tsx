"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const steps = [
  { label: "Website", detail: "Your public site, on your own domain." },
  { label: "Products", detail: "Add and edit products, prices and images." },
  { label: "Orders", detail: "See and process every order in one place." },
  { label: "Customers", detail: "Customer records and their order history." },
  { label: "Campaigns", detail: "Create promotions and campaigns for your customers." },
  { label: "Staff", detail: "Staff accounts, each with their own permissions." },
  { label: "Rota", detail: "Plan who is working, and when." },
  { label: "AI", detail: "An assistant that helps with content and business tasks." },
];

export default function PlatformFlow() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setActive((a) => (a + 1) % steps.length), 2200);
    return () => clearInterval(id);
  }, [paused]);

  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="flex flex-wrap items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.label} className="flex items-center gap-2">
            <button
              onClick={() => setActive(i)}
              onFocus={() => setPaused(true)}
              onBlur={() => setPaused(false)}
              aria-pressed={i === active}
              className={cn(
                "rounded-full border px-4 py-2 text-sm transition-all duration-300",
                i === active
                  ? "border-blueprint2 bg-blueprint2 text-white shadow-[0_0_24px_rgba(45,110,219,0.55)]"
                  : "border-white/20 text-white/70 hover:border-white/50"
              )}
            >
              {s.label}
            </button>
            {i < steps.length - 1 && <span aria-hidden className="text-white/30">→</span>}
          </div>
        ))}
      </div>
      <p className="mt-8 min-h-[3.5rem] max-w-lg font-display text-2xl text-white">{steps[active].detail}</p>
    </div>
  );
}

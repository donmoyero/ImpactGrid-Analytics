"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const industries = [
  { id: "fashion", label: "Fashion", brand: "Example Studio", headline: "New season, now in", cta: "Shop the collection", tint: "#e9e4f5", sections: ["Collections", "Lookbook", "Shop", "Size guide", "Reviews", "Contact"] },
  { id: "restaurant", label: "Restaurant", brand: "Example Kitchen", headline: "A table for two?", cta: "Reserve a table", tint: "#f5e6dc", sections: ["Menu", "Reservations", "Gallery", "Opening hours", "Reviews", "Find us"] },
  { id: "salon", label: "Salon", brand: "Example Salon", headline: "Book your next appointment", cta: "Book now", tint: "#f3e3e8", sections: ["Hero", "Services", "Booking", "Gallery", "Reviews", "Contact"] },
  { id: "professional", label: "Professional", brand: "Example & Co", headline: "Advice you can rely on", cta: "Make an enquiry", tint: "#dfe8f5", sections: ["Services", "Team", "Case studies", "Enquiry form", "FAQs", "Contact"] },
  { id: "retail", label: "Retail", brand: "Example Store", headline: "Shop the range", cta: "View products", tint: "#e3f0e6", sections: ["Featured products", "Categories", "Basket", "Delivery", "Reviews", "Contact"] },
  { id: "services", label: "Services", brand: "Example Services", headline: "Get a free quote", cta: "Request a quote", tint: "#f5efd9", sections: ["Services", "Pricing", "Quote request", "Areas covered", "Reviews", "Contact"] },
];

export default function IndustryTabs() {
  const [active, setActive] = useState("salon");
  const current = industries.find((i) => i.id === active) ?? industries[0];

  return (
    <div>
      <div role="tablist" aria-label="Industry examples" className="flex flex-wrap gap-2">
        {industries.map((i) => (
          <button
            key={i.id}
            role="tab"
            id={`tab-${i.id}`}
            aria-selected={i.id === active}
            aria-controls="industry-panel"
            onClick={() => setActive(i.id)}
            className={cn(
              "rounded-full border px-5 py-2 text-sm transition-colors",
              i.id === active ? "border-paper bg-paper text-ink" : "border-line text-slate hover:border-paper hover:text-paper"
            )}
          >
            {i.label}
          </button>
        ))}
      </div>

      <div
        id="industry-panel"
        role="tabpanel"
        aria-labelledby={`tab-${current.id}`}
        className="mt-6 overflow-hidden rounded-2xl border border-line bg-white shadow-sm"
      >
        <div className="flex items-center gap-2 border-b border-line bg-sand px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-line2" />
          <span className="h-2.5 w-2.5 rounded-full bg-line2" />
          <span className="h-2.5 w-2.5 rounded-full bg-line2" />
          <span className="ml-3 rounded-full bg-white px-4 py-1 font-mono text-xs text-slateLight">yourbusiness.co.uk</span>
        </div>
        <div className="flex items-center justify-between px-6 py-4 text-sm">
          <span className="font-display text-base">{current.brand}</span>
          <span className="hidden gap-5 text-slateLight sm:flex">
            {current.sections.slice(0, 3).map((s) => (
              <span key={s}>{s}</span>
            ))}
          </span>
        </div>
        <div className="px-6 py-14 text-paper transition-colors duration-500" style={{ backgroundColor: current.tint }}>
          <p className="max-w-md font-display text-3xl lg:text-4xl">{current.headline}</p>
          <span className="mt-6 inline-block rounded-full bg-paper px-6 py-2.5 text-sm text-ink">{current.cta}</span>
        </div>
        <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-3">
          {current.sections.map((s) => (
            <div key={s} className="bg-white p-5 text-sm">
              <div className="mb-3 h-2 w-10 rounded bg-line2" />
              {s}
            </div>
          ))}
        </div>
      </div>
      <p className="mt-3 text-xs text-slate">Example layout only, not a client site. Built with ImpactGrid Analytics.</p>
    </div>
  );
}

import Link from "next/link";
import { Check } from "lucide-react";
import { WebsitePackage } from "@/types";
import { cn } from "@/lib/utils";

export default function PackageCard({ pkg, index }: { pkg: WebsitePackage; index: number }) {
  return (
    <div
      className={cn(
        "crosshair flex flex-col rounded-2xl border p-8",
        pkg.highlighted ? "border-blueprint2 bg-ink2" : "border-line bg-ink2/50"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="label-tag text-slate">0{index + 1}</span>
        {pkg.highlighted && (
          <span className="label-tag rounded-full border border-blueprint2 px-2.5 py-1 text-blueprint2">
            Most chosen
          </span>
        )}
      </div>

      <h3 className="mt-6 font-display text-2xl">{pkg.name}</h3>
      <p className="mt-2 text-sm text-slate">{pkg.tagline}</p>

      <div className="mt-6 font-display text-4xl">{pkg.priceLabel}</div>

      <ul className="mt-8 flex-1 space-y-3">
        {pkg.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-paper/90">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-blueprint2" />
            {f}
          </li>
        ))}
      </ul>

      <Link
        href={`/book-project?package=${pkg.id}`}
        className={cn(
          "mt-8 rounded-full px-5 py-3 text-center text-sm font-medium transition-colors",
          pkg.highlighted
            ? "bg-signal text-ink hover:bg-blueprint2"
            : "border border-line text-paper hover:border-paper"
        )}
      >
        Choose {pkg.name}
      </Link>
    </div>
  );
}

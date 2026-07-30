"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { packages, addons } from "@/lib/packages";
import { cn, formatGBP } from "@/lib/utils";
import { Check, Loader2 } from "lucide-react";

const steps = [
  "Business",
  "Domain",
  "Package",
  "Add-ons",
  "Details",
  "Colours",
  "Review",
] as const;

const palettes = [
  { name: "Ink & Blueprint", colors: ["#0F1115", "#3856F0", "#F7F5EF"] },
  { name: "Warm Studio", colors: ["#221D1A", "#FF5A3C", "#F4EFE6"] },
  { name: "Fresh Slate", colors: ["#12181F", "#2FBE8F", "#EFF3F1"] },
  { name: "Classic", colors: ["#101010", "#B8A369", "#F5F5F0"] },
];

export default function BookProjectFlow() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    businessName: "",
    domain: searchParams.get("domain") ?? "",
    packageId: searchParams.get("package") ?? "business",
    addonIds: [] as string[],
    email: "",
    phone: "",
    notes: "",
    palette: palettes[0].name,
  });

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleAddon(id: string) {
    setForm((f) => ({
      ...f,
      addonIds: f.addonIds.includes(id) ? f.addonIds.filter((a) => a !== id) : [...f.addonIds, id],
    }));
  }

  const selectedPackage = packages.find((p) => p.id === form.packageId) ?? packages[1];
  const selectedAddons = addons.filter((a) => form.addonIds.includes(a.id));
  const total = selectedPackage.price + selectedAddons.reduce((sum, a) => sum + a.price, 0);

  async function handleCheckout() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: form.packageId,
          addonIds: form.addonIds,
          businessName: form.businessName,
          domain: form.domain,
          email: form.email,
        }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {/* Step indicator */}
      <div className="mb-10 flex flex-wrap gap-2">
        {steps.map((s, i) => (
          <button
            key={s}
            onClick={() => setStep(i)}
            className={cn(
              "label-tag rounded-full border px-3 py-1.5 transition-colors",
              i === step
                ? "border-signal text-signal"
                : i < step
                ? "border-blueprint2 text-blueprint2"
                : "border-line text-slate"
            )}
          >
            {i < step ? "✓ " : ""}
            {s}
          </button>
        ))}
      </div>

      <div className="crosshair rounded-2xl border border-line bg-ink2 p-8">
        {step === 0 && (
          <Field label="What's your business called?">
            <input
              autoFocus
              value={form.businessName}
              onChange={(e) => update("businessName", e.target.value)}
              placeholder="Impact Bakery"
              className="input"
            />
          </Field>
        )}

        {step === 1 && (
          <Field label="Domain (search on the Domain search page, or type it here)">
            <input
              value={form.domain}
              onChange={(e) => update("domain", e.target.value)}
              placeholder="impactbakery.co.uk"
              className="input"
            />
          </Field>
        )}

        {step === 2 && (
          <Field label="Choose a package">
            <div className="grid gap-3 sm:grid-cols-3">
              {packages.map((p) => (
                <button
                  key={p.id}
                  onClick={() => update("packageId", p.id)}
                  className={cn(
                    "rounded-xl border p-4 text-left transition-colors",
                    form.packageId === p.id ? "border-signal bg-ink" : "border-line hover:border-slate"
                  )}
                >
                  <p className="font-display text-lg">{p.name}</p>
                  <p className="mt-1 font-mono text-sm text-blueprint2">{p.priceLabel}</p>
                </button>
              ))}
            </div>
          </Field>
        )}

        {step === 3 && (
          <Field label="Any add-ons?">
            <div className="space-y-2">
              {addons.map((a) => (
                <label
                  key={a.id}
                  className={cn(
                    "flex cursor-pointer items-center justify-between rounded-xl border p-4",
                    form.addonIds.includes(a.id) ? "border-signal bg-ink" : "border-line"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={form.addonIds.includes(a.id)}
                      onChange={() => toggleAddon(a.id)}
                      className="h-4 w-4 accent-signal"
                    />
                    <div>
                      <p className="text-sm font-medium">{a.name}</p>
                      <p className="text-xs text-slate">{a.description}</p>
                    </div>
                  </div>
                  <span className="font-mono text-sm text-blueprint2">{formatGBP(a.price)}</span>
                </label>
              ))}
            </div>
          </Field>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <Field label="Email">
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="you@business.co.uk"
                className="input"
              />
            </Field>
            <Field label="Phone (optional)">
              <input
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="07000 000000"
                className="input"
              />
            </Field>
            <Field label="Anything we should know?">
              <textarea
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                rows={3}
                placeholder="e.g. we already have a logo, launch date, competitors you like…"
                className="input resize-none"
              />
            </Field>
          </div>
        )}

        {step === 5 && (
          <Field label="Pick a starting palette (we'll refine this with you)">
            <div className="grid gap-3 sm:grid-cols-2">
              {palettes.map((p) => (
                <button
                  key={p.name}
                  onClick={() => update("palette", p.name)}
                  className={cn(
                    "flex items-center justify-between rounded-xl border p-4",
                    form.palette === p.name ? "border-signal bg-ink" : "border-line"
                  )}
                >
                  <span className="text-sm">{p.name}</span>
                  <div className="flex gap-1.5">
                    {p.colors.map((c) => (
                      <span key={c} className="h-5 w-5 rounded-full border border-line" style={{ background: c }} />
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </Field>
        )}

        {step === 6 && (
          <div>
            <h3 className="font-display text-xl">Review your order</h3>
            <dl className="mt-6 space-y-3 text-sm">
              <Row label="Business" value={form.businessName || "—"} />
              <Row label="Domain" value={form.domain || "To be chosen"} />
              <Row label="Package" value={`${selectedPackage.name} — ${selectedPackage.priceLabel}`} />
              <Row
                label="Add-ons"
                value={selectedAddons.length ? selectedAddons.map((a) => a.name).join(", ") : "None"}
              />
              <Row label="Email" value={form.email || "—"} />
            </dl>
            <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
              <span className="label-tag text-slate">Total due today</span>
              <span className="font-display text-2xl text-signal">{formatGBP(total)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Nav buttons */}
      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="label-tag text-slate hover:text-paper disabled:opacity-30"
        >
          ← Back
        </button>

        {step < steps.length - 1 ? (
          <button
            onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
            className="rounded-full bg-paper px-6 py-2.5 text-sm font-medium text-ink hover:bg-blueprint2"
          >
            Continue
          </button>
        ) : (
          <button
            onClick={handleCheckout}
            disabled={submitting || !form.email}
            className="flex items-center gap-2 rounded-full bg-signal px-6 py-2.5 text-sm font-medium text-ink hover:bg-blueprint2 disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Proceed to payment
          </button>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label-tag text-slate">{label}</label>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-slate">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

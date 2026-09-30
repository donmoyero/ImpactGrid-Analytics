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
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    businessName: "",
    domain: searchParams.get("domain") ?? "",
    packageId: searchParams.get("package") ?? "business",
    addonIds: [] as string[],
    email: "",
    phone: "",
    notes: "",
    palette: palettes[0].name,
    website: "", // honeypot
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

  const [done, setDone] = useState(false);
  const [domainState, setDomainState] = useState<"idle" | "checking" | "available" | "taken" | "unknown" | "invalid">("idle");

  async function checkDomain() {
    if (!form.domain.trim()) return;
    setDomainState("checking");
    try {
      const res = await fetch(`/api/domain-check?domain=${encodeURIComponent(form.domain)}`);
      const data = await res.json();
      setDomainState(data.status ?? "unknown");
    } catch {
      setDomainState("unknown");
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: form.packageId,
          addonIds: form.addonIds,
          businessName: form.businessName,
          domain: form.domain,
          email: form.email,
          phone: form.phone,
          notes: form.notes,
          palette: form.palette,
          website: form.website, // honeypot, must stay empty
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setDone(true);
      } else {
        setError(data.error ?? "Something went wrong sending your request. Please try again.");
      }
    } catch {
      setError("Couldn't reach us. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="crosshair rounded-2xl border border-line bg-ink2 p-8">
        <Check className="h-8 w-8 text-green-600" aria-hidden />
        <h2 className="mt-4 font-display text-2xl">Request received</h2>
        <p className="mt-3 text-slate">
          Thanks{form.businessName ? `, ${form.businessName}` : ""}. We'll look over what you've asked for and email{" "}
          <span className="font-medium text-paper">{form.email}</span> as soon as it's approved. You don't need to pay anything yet.
        </p>
      </div>
    );
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
              placeholder="Your business name"
              className="input"
            />
          </Field>
        )}

        {step === 1 && (
          <div>
            <Field label="Domain you'd like (optional). Type it and check if it's free. We'll confirm and set it up for you">
              <div className="flex gap-2">
                <input
                  value={form.domain}
                  onChange={(e) => { update("domain", e.target.value); setDomainState("idle"); }}
                  placeholder="yourbusiness.co.uk"
                  className="input"
                />
                <button
                  type="button"
                  onClick={checkDomain}
                  disabled={!form.domain.trim() || domainState === "checking"}
                  className="shrink-0 rounded-full border border-line2 px-5 text-sm font-medium hover:bg-sand disabled:opacity-50"
                >
                  {domainState === "checking" ? "Checking…" : "Check"}
                </button>
              </div>
            </Field>
            {domainState === "available" && <p role="status" className="mt-3 text-sm text-green-700">Looks available. We'll confirm before we register it.</p>}
            {domainState === "taken" && <p role="status" className="mt-3 text-sm text-red-700">That one is already registered. Try another name, or keep it and tell us in your notes.</p>}
            {domainState === "unknown" && <p role="status" className="mt-3 text-sm text-slate">We couldn't check that one automatically. No problem, we'll check it for you.</p>}
            {domainState === "invalid" && <p role="status" className="mt-3 text-sm text-red-700">That doesn't look like a domain name, e.g. yourbusiness.co.uk</p>}
          </div>
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
            <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label>Leave this empty<input tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => update("website", e.target.value)} /></label>
            </div>
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
            <Field label="What do you want your website to do? Tell us as much as you can">
              <textarea
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                rows={6}
                placeholder="e.g. what your business does, pages you need, a logo you already have, launch date, websites you like…"
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
            <h3 className="font-display text-xl">Review your request</h3>
            <dl className="mt-6 space-y-3 text-sm">
              <Row label="Business" value={form.businessName || "—"} />
              <Row label="Domain" value={form.domain || "To be chosen"} />
              <Row label="Package" value={`${selectedPackage.name} — ${selectedPackage.priceLabel}`} />
              <Row
                label="Add-ons"
                value={selectedAddons.length ? selectedAddons.map((a) => a.name).join(", ") : "None"}
              />
              <Row label="Email" value={form.email || "—"} />
              <Row label="Palette" value={form.palette} />
            </dl>
            <div className="mt-6 space-y-3 border-t border-line pt-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate">Website build (invoiced by bank transfer once approved)</span>
                <span className="font-display text-xl">{formatGBP(total)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate">Care Plan, year 1</span>
                <span className="font-display text-xl text-blueprint2">Free</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate">Care Plan, from year 2</span>
                <span className="font-medium">{formatGBP(selectedPackage.carePlanYearly)} / year (invoiced)</span>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-line bg-ink p-4 text-sm text-slate">
              <p className="font-medium text-paper">What happens next</p>
              <p className="mt-1">
                You pay nothing today and there's no card to enter. We review your request and email you when it's approved,
                then send your invoice by email.
              </p>
            </div>
          </div>
        )}
      </div>

      {error && <p className="mt-4 text-sm text-signal">{error}</p>}

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
            onClick={handleSubmit}
            disabled={submitting || !form.email}
            className="flex items-center gap-2 rounded-full bg-signal px-6 py-2.5 text-sm font-medium text-ink hover:bg-blueprint2 disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Send my request
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

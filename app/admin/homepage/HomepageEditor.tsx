/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { LIMITS, type HomepageContent } from "@/lib/site/content";
import { createUploadUrl, saveHomepage } from "./actions";

type Work = HomepageContent["work"][number];
type Review = HomepageContent["reviews"][number];
type Stat = HomepageContent["stats"][number];

export default function HomepageEditor({ initial }: { initial: HomepageContent }) {
  const [c, setC] = useState<HomepageContent>(initial);
  const [dirty, setDirty] = useState(false);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const edit = (fn: (d: HomepageContent) => HomepageContent) => { setC(fn); setDirty(true); setMsg(null); };
  const setAt = <T,>(arr: T[], i: number, patch: Partial<T>) => arr.map((x, n) => (n === i ? { ...x, ...patch } : x));

  const save = () => start(async () => {
    const r = await saveHomepage(JSON.stringify(c));
    setMsg({ ok: r.ok, text: r.message });
    if (r.ok) setDirty(false);
  });

  return (
    <div className="max-w-3xl pb-28">
      <h1 className="font-display text-3xl">Homepage</h1>
      <p className="mt-1 text-slate">Change what visitors see. Sections with nothing in them stay hidden, so nothing looks half-finished.</p>

      <Card title="Announcement bar" hint="A slim banner across the top of the homepage. Leave the text empty to hide it.">
        <Field label="Message" value={c.announcement.text} max={140} onChange={(v) => edit((d) => ({ ...d, announcement: { ...d.announcement, text: v } }))} />
        <Field label="Link (optional)" value={c.announcement.href} placeholder="/book-project or https://…" onChange={(v) => edit((d) => ({ ...d, announcement: { ...d.announcement, href: v } }))} />
      </Card>

      <Card title="Top section" hint="The first thing visitors see.">
        <Field label="Small label" value={c.hero.eyebrow} max={40} onChange={(v) => edit((d) => ({ ...d, hero: { ...d.hero, eyebrow: v } }))} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Headline, line 1" value={c.hero.line1} max={60} onChange={(v) => edit((d) => ({ ...d, hero: { ...d.hero, line1: v } }))} />
          <Field label="Headline, line 2 (coloured)" value={c.hero.line2} max={60} onChange={(v) => edit((d) => ({ ...d, hero: { ...d.hero, line2: v } }))} />
        </div>
        <Field label="Description" value={c.hero.sub} max={260} multiline onChange={(v) => edit((d) => ({ ...d, hero: { ...d.hero, sub: v } }))} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Main button" value={c.hero.primaryLabel} max={30} onChange={(v) => edit((d) => ({ ...d, hero: { ...d.hero, primaryLabel: v } }))} />
          <Field label="Second link (empty hides it)" value={c.hero.secondaryLabel} max={30} onChange={(v) => edit((d) => ({ ...d, hero: { ...d.hero, secondaryLabel: v } }))} />
        </div>
        <ImageField label="Photo (optional, replaces the 3D animation)" value={c.hero.imageUrl} onChange={(v) => edit((d) => ({ ...d, hero: { ...d.hero, imageUrl: v } }))} />
      </Card>

      <Card title="Numbers" hint={`Up to ${LIMITS.stats} real figures, e.g. websites launched. Only add numbers that are true.`}>
        {c.stats.map((s, i) => (
          <Row key={i} onRemove={() => edit((d) => ({ ...d, stats: d.stats.filter((_, n) => n !== i) }))}>
            <Field label="Number" value={s.value} max={16} placeholder="25+" onChange={(v) => edit((d) => ({ ...d, stats: setAt<Stat>(d.stats, i, { value: v }) }))} />
            <Field label="What it counts" value={s.label} max={50} placeholder="Websites launched" onChange={(v) => edit((d) => ({ ...d, stats: setAt<Stat>(d.stats, i, { label: v }) }))} />
          </Row>
        ))}
        <Add disabled={c.stats.length >= LIMITS.stats} onClick={() => edit((d) => ({ ...d, stats: [...d.stats, { value: "", label: "" }] }))} label="Add a number" />
      </Card>

      <Card title="Our work" hint={`Up to ${LIMITS.work} real websites you've built, shown as cards with a photo.`}>
        {c.work.map((w, i) => (
          <Row key={i} onRemove={() => edit((d) => ({ ...d, work: d.work.filter((_, n) => n !== i) }))}>
            <Field label="Name" value={w.title} max={80} onChange={(v) => edit((d) => ({ ...d, work: setAt<Work>(d.work, i, { title: v }) }))} />
            <Field label="Type of business" value={w.category} max={40} placeholder="Fashion retailer" onChange={(v) => edit((d) => ({ ...d, work: setAt<Work>(d.work, i, { category: v }) }))} />
            <Field label="Short description" value={w.blurb} max={200} multiline onChange={(v) => edit((d) => ({ ...d, work: setAt<Work>(d.work, i, { blurb: v }) }))} />
            <Field label="Website link (optional)" value={w.url} placeholder="https://…" onChange={(v) => edit((d) => ({ ...d, work: setAt<Work>(d.work, i, { url: v }) }))} />
            <ImageField label="Screenshot or photo" value={w.imageUrl} onChange={(v) => edit((d) => ({ ...d, work: setAt<Work>(d.work, i, { imageUrl: v }) }))} />
          </Row>
        ))}
        <Add disabled={c.work.length >= LIMITS.work} onClick={() => edit((d) => ({ ...d, work: [...d.work, { title: "", category: "", url: "", imageUrl: "", blurb: "" }] }))} label="Add a website" />
      </Card>

      <Card title="Client reviews" hint={`Up to ${LIMITS.reviews}. Use words your clients actually said, with their permission.`}>
        {c.reviews.map((r, i) => (
          <Row key={i} onRemove={() => edit((d) => ({ ...d, reviews: d.reviews.filter((_, n) => n !== i) }))}>
            <Field label="Review" value={r.quote} max={400} multiline onChange={(v) => edit((d) => ({ ...d, reviews: setAt<Review>(d.reviews, i, { quote: v }) }))} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" value={r.name} max={60} onChange={(v) => edit((d) => ({ ...d, reviews: setAt<Review>(d.reviews, i, { name: v }) }))} />
              <Field label="Business (optional)" value={r.role} max={60} onChange={(v) => edit((d) => ({ ...d, reviews: setAt<Review>(d.reviews, i, { role: v }) }))} />
            </div>
          </Row>
        ))}
        <Add disabled={c.reviews.length >= LIMITS.reviews} onClick={() => edit((d) => ({ ...d, reviews: [...d.reviews, { quote: "", name: "", role: "" }] }))} label="Add a review" />
      </Card>

      <Card title="Bottom call to action">
        <Field label="Heading" value={c.cta.heading} max={120} onChange={(v) => edit((d) => ({ ...d, cta: { ...d.cta, heading: v } }))} />
        <Field label="Button" value={c.cta.button} max={30} onChange={(v) => edit((d) => ({ ...d, cta: { ...d.cta, button: v } }))} />
      </Card>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ink/95 px-6 py-3 backdrop-blur lg:left-[230px]">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-4">
          <button onClick={save} disabled={pending || !dirty} className="rounded-full bg-signal px-6 py-2.5 text-sm font-medium text-ink disabled:opacity-50">
            {pending ? "Saving…" : "Save changes"}
          </button>
          <a href="/" target="_blank" rel="noopener noreferrer" className="text-sm underline">View homepage</a>
          <span role="status" className={`text-sm ${msg ? (msg.ok ? "text-green-700" : "text-red-700") : "text-slateLight"}`}>
            {msg ? msg.text : dirty ? "You have unsaved changes." : ""}
          </span>
        </div>
      </div>
    </div>
  );
}

function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 rounded-2xl border border-line bg-ink2 p-6">
      <h2 className="font-display text-xl">{title}</h2>
      {hint && <p className="mt-1 text-sm text-slate">{hint}</p>}
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function Row({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <div className="space-y-4 rounded-xl border border-line p-4">
      {children}
      <button type="button" onClick={onRemove} className="text-sm text-red-700 underline">Remove</button>
    </div>
  );
}

function Add({ onClick, label, disabled }: { onClick: () => void; label: string; disabled: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="rounded-full border border-line2 px-4 py-2 text-sm font-medium hover:bg-sand disabled:opacity-40">
      {disabled ? "Limit reached" : `+ ${label}`}
    </button>
  );
}

function Field({ label, value, onChange, max, multiline, placeholder }: { label: string; value: string; onChange: (v: string) => void; max?: number; multiline?: boolean; placeholder?: string }) {
  return (
    <label className="block text-sm">
      {label}
      {multiline ? (
        <textarea className="input mt-1 min-h-[80px]" value={value} maxLength={max} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className="input mt-1" value={value} maxLength={max} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}

function ImageField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return setErr("Please choose an image under 5 MB.");
    setBusy(true);
    setErr(null);
    const t = await createUploadUrl(file.type);
    if (!t.ok) { setErr(t.message); setBusy(false); return; }
    const { error } = await createClient().storage.from("site-media").uploadToSignedUrl(t.path, t.token, file);
    setBusy(false);
    if (error) return setErr("Upload failed. Please try again.");
    onChange(t.publicUrl);
  }

  return (
    <div className="text-sm">
      <p>{label}</p>
      {value && <img src={value} alt="" className="mt-2 max-h-40 rounded-xl border border-line object-cover" />}
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <label className="cursor-pointer rounded-full border border-line2 px-4 py-2 font-medium hover:bg-sand">
          {busy ? "Uploading…" : value ? "Replace image" : "Upload image"}
          <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={pick} disabled={busy} />
        </label>
        {value && !busy && <button type="button" onClick={() => onChange("")} className="text-red-700 underline">Remove</button>}
      </div>
      {err && <p role="alert" className="mt-2 text-red-700">{err}</p>}
    </div>
  );
}

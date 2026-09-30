/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  BUILTIN_LABELS, BUILTIN_TYPES, EDITABLE_BUILTINS, LIMITS, OTHER_PAGE, WIDGET_LABELS, WIDGET_TYPES, newWidget,
  type Block, type BuiltinType, type HomepageContent,
} from "@/lib/site/content";
import { createUploadUrl, saveHomepage } from "./actions";

type Work = HomepageContent["work"][number];
type Review = HomepageContent["reviews"][number];
type Stat = HomepageContent["stats"][number];

export default function HomepageEditor({ initial }: { initial: HomepageContent }) {
  const [c, setC] = useState<HomepageContent>(initial);
  const [dirty, setDirty] = useState(false);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [openId, setOpenId] = useState<string | null>(null);
  const isBuiltin = (b: Block): b is Extract<Block, { type: BuiltinType }> => (BUILTIN_TYPES as readonly string[]).includes(b.type);
  const otherPage = (Object.keys(OTHER_PAGE) as BuiltinType[]).filter((t) => !c.blocks.some((b) => b.type === t));
  const missing = BUILTIN_TYPES.filter((t) => !c.blocks.some((b) => b.type === t));
  const addBlock = (b: Block) => { edit((d) => ({ ...d, blocks: [...d.blocks, b] })); setOpenId(b.id); };
  const deleteBlock = (i: number) => {
    const b = c.blocks[i];
    const name = isBuiltin(b) ? BUILTIN_LABELS[b.type] : WIDGET_LABELS[b.type].name;
    if (!window.confirm(`Delete "${name}" from the homepage? You can add it back later${isBuiltin(b) ? "" : ", but this widget's text will be lost"}.`)) return;
    edit((d) => ({ ...d, blocks: d.blocks.filter((_, n) => n !== i) }));
  };
  const moveBlock = (i: number, dir: -1 | 1) =>
    edit((d) => {
      const j = i + dir;
      if (j < 0 || j >= d.blocks.length) return d;
      const blocks = [...d.blocks];
      [blocks[i], blocks[j]] = [blocks[j], blocks[i]];
      return { ...d, blocks };
    });
  const patchBlock = (id: string, patch: Record<string, unknown>) =>
    edit((d) => ({ ...d, blocks: d.blocks.map((b) => (b.id === id ? ({ ...b, ...patch } as Block) : b)) }));

  const builtinBody = (t: BuiltinType) => {
    switch (t) {
      case "announcement":
        return (
          <>
        <Field label="Message" value={c.announcement.text} max={140} onChange={(v) => edit((d) => ({ ...d, announcement: { ...d.announcement, text: v } }))} />
        <Field label="Link (optional)" value={c.announcement.href} placeholder="/book-project or https://…" onChange={(v) => edit((d) => ({ ...d, announcement: { ...d.announcement, href: v } }))} />
          </>
        );
      case "hero":
        return (
          <>
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
          </>
        );
      case "stats":
        return (
          <>
        {c.stats.map((s, i) => (
          <Row key={i} onRemove={() => edit((d) => ({ ...d, stats: d.stats.filter((_, n) => n !== i) }))}>
            <Field label="Number" value={s.value} max={16} placeholder="25+" onChange={(v) => edit((d) => ({ ...d, stats: setAt<Stat>(d.stats, i, { value: v }) }))} />
            <Field label="What it counts" value={s.label} max={50} placeholder="Websites launched" onChange={(v) => edit((d) => ({ ...d, stats: setAt<Stat>(d.stats, i, { label: v }) }))} />
          </Row>
        ))}
        <Add disabled={c.stats.length >= LIMITS.stats} onClick={() => edit((d) => ({ ...d, stats: [...d.stats, { value: "", label: "" }] }))} label="Add a number" />
          </>
        );
      case "work":
        return (
          <>
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
          </>
        );
      case "reviews":
        return (
          <>
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
          </>
        );
      case "idea":
        return (
          <>
            <Field label="Small label" value={c.idea.eyebrow} max={40} onChange={(v) => edit((d) => ({ ...d, idea: { ...d.idea, eyebrow: v } }))} />
            <Field label="Heading" value={c.idea.heading} max={120} onChange={(v) => edit((d) => ({ ...d, idea: { ...d.idea, heading: v } }))} />
            {c.idea.items.map((it, i) => (
              <div key={i} className="space-y-3 rounded-xl border border-line p-4">
                <Field label={`Card ${i + 1} title`} value={it.title} max={40} onChange={(v) => edit((d) => ({ ...d, idea: { ...d.idea, items: setAt(d.idea.items, i, { title: v }) } }))} />
                <Field label={`Card ${i + 1} text`} value={it.detail} max={140} onChange={(v) => edit((d) => ({ ...d, idea: { ...d.idea, items: setAt(d.idea.items, i, { detail: v }) } }))} />
              </div>
            ))}
          </>
        );
      case "domain":
        return (
          <>
            <Field label="Small label" value={c.domain.eyebrow} max={40} onChange={(v) => edit((d) => ({ ...d, domain: { ...d.domain, eyebrow: v } }))} />
            <Field label="Heading" value={c.domain.heading} max={120} onChange={(v) => edit((d) => ({ ...d, domain: { ...d.domain, heading: v } }))} />
            <Field label="Text" value={c.domain.text} max={260} multiline onChange={(v) => edit((d) => ({ ...d, domain: { ...d.domain, text: v } }))} />
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Box label" value={c.domain.label} max={60} onChange={(v) => edit((d) => ({ ...d, domain: { ...d.domain, label: v } }))} />
              <Field label="Box example" value={c.domain.placeholder} max={60} onChange={(v) => edit((d) => ({ ...d, domain: { ...d.domain, placeholder: v } }))} />
              <Field label="Button" value={c.domain.button} max={30} onChange={(v) => edit((d) => ({ ...d, domain: { ...d.domain, button: v } }))} />
            </div>
          </>
        );
      case "how":
        return (
          <>
            <Field label="Small label" value={c.how.eyebrow} max={40} onChange={(v) => edit((d) => ({ ...d, how: { ...d.how, eyebrow: v } }))} />
            {c.how.steps.map((st, i) => (
              <div key={i} className="grid gap-3 rounded-xl border border-line p-4 sm:grid-cols-[160px_1fr]">
                <Field label={`Step ${i + 1}`} value={st.label} max={24} onChange={(v) => edit((d) => ({ ...d, how: { ...d.how, steps: setAt(d.how.steps, i, { label: v }) } }))} />
                <Field label="Description" value={st.detail} max={140} onChange={(v) => edit((d) => ({ ...d, how: { ...d.how, steps: setAt(d.how.steps, i, { detail: v }) } }))} />
              </div>
            ))}
          </>
        );
      case "ai":
        return (
          <>
            <Field label="Small label" value={c.ai.eyebrow} max={40} onChange={(v) => edit((d) => ({ ...d, ai: { ...d.ai, eyebrow: v } }))} />
            <Field label="Heading" value={c.ai.heading} max={120} onChange={(v) => edit((d) => ({ ...d, ai: { ...d.ai, heading: v } }))} />
            {c.ai.items.map((it, i) => (
              <div key={i} className="grid gap-3 rounded-xl border border-line p-4 sm:grid-cols-[160px_1fr]">
                <Field label="Area" value={it.area} max={24} onChange={(v) => edit((d) => ({ ...d, ai: { ...d.ai, items: setAt(d.ai.items, i, { area: v }) } }))} />
                <Field label="Example request" value={it.prompt} max={120} onChange={(v) => edit((d) => ({ ...d, ai: { ...d.ai, items: setAt(d.ai.items, i, { prompt: v }) } }))} />
              </div>
            ))}
          </>
        );
      case "careplan":
        return (
          <>
            <Field label="Small label" value={c.careplan.eyebrow} max={40} onChange={(v) => edit((d) => ({ ...d, careplan: { ...d.careplan, eyebrow: v } }))} />
            <Field label="Heading" value={c.careplan.heading} max={120} onChange={(v) => edit((d) => ({ ...d, careplan: { ...d.careplan, heading: v } }))} />
            <Field label="Text (yearly prices are added after it automatically)" value={c.careplan.text} max={260} multiline onChange={(v) => edit((d) => ({ ...d, careplan: { ...d.careplan, text: v } }))} />
            <Field label="Example box title" value={c.careplan.healthTitle} max={40} onChange={(v) => edit((d) => ({ ...d, careplan: { ...d.careplan, healthTitle: v } }))} />
            {c.careplan.rows.map((r, i) => (
              <Row key={i} onRemove={() => edit((d) => ({ ...d, careplan: { ...d.careplan, rows: d.careplan.rows.filter((_, n) => n !== i) } }))}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Item" value={r.k} max={30} onChange={(v) => edit((d) => ({ ...d, careplan: { ...d.careplan, rows: setAt(d.careplan.rows, i, { k: v }) } }))} />
                  <Field label="Status" value={r.v} max={30} onChange={(v) => edit((d) => ({ ...d, careplan: { ...d.careplan, rows: setAt(d.careplan.rows, i, { v }) } }))} />
                </div>
              </Row>
            ))}
            <Add disabled={c.careplan.rows.length >= LIMITS.health} onClick={() => edit((d) => ({ ...d, careplan: { ...d.careplan, rows: [...d.careplan.rows, { k: "", v: "" }] } }))} label="Add a row" />
          </>
        );
      case "services":
        return (
          <>
            <Field label="Small label" value={c.services.eyebrow} max={40} onChange={(v) => edit((d) => ({ ...d, services: { ...d.services, eyebrow: v } }))} />
            <Field label="Heading" value={c.services.heading} max={120} onChange={(v) => edit((d) => ({ ...d, services: { ...d.services, heading: v } }))} />
            <Field label="Link text (goes to the Services page; empty hides it)" value={c.services.linkLabel} max={30} onChange={(v) => edit((d) => ({ ...d, services: { ...d.services, linkLabel: v } }))} />
            {c.services.items.map((it, i) => (
              <Row key={i} onRemove={() => edit((d) => ({ ...d, services: { ...d.services, items: d.services.items.filter((_, n) => n !== i) } }))}>
                <Field label="Name" value={it.name} max={50} onChange={(v) => edit((d) => ({ ...d, services: { ...d.services, items: setAt(d.services.items, i, { name: v }) } }))} />
                <Field label="Description" value={it.detail} max={160} multiline onChange={(v) => edit((d) => ({ ...d, services: { ...d.services, items: setAt(d.services.items, i, { detail: v }) } }))} />
              </Row>
            ))}
            <Add disabled={c.services.items.length >= LIMITS.services} onClick={() => edit((d) => ({ ...d, services: { ...d.services, items: [...d.services.items, { name: "", detail: "" }] } }))} label="Add a service" />
          </>
        );
      case "cta":
        return (
          <>
        <Field label="Heading" value={c.cta.heading} max={120} onChange={(v) => edit((d) => ({ ...d, cta: { ...d.cta, heading: v } }))} />
        <Field label="Button" value={c.cta.button} max={30} onChange={(v) => edit((d) => ({ ...d, cta: { ...d.cta, button: v } }))} />
          </>
        );
      default:
        return <p className="text-sm text-slate">This section stays as designed. You can move it, delete it or add it back, but its text isn&apos;t editable here.</p>;
    }
  };

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

      <div className="mt-8 rounded-2xl border border-line bg-ink2 p-6">
        <h2 className="font-display text-xl">Page sections</h2>
        <p className="mt-1 text-sm text-slate">Everything on your homepage, top to bottom. How it works, Services extras and Packages have their own pages now. Move sections with the arrows, delete ones you don&apos;t want, or add more below. Nothing changes on the live site until you press Save.</p>
      </div>

      {c.blocks.length > 0 && (
        <div className="mt-4 flex gap-4 text-sm">
          <button type="button" onClick={() => setOpenId("*")} className="underline">Open all</button>
          <button type="button" onClick={() => setOpenId(null)} className="underline">Close all</button>
        </div>
      )}

      {c.blocks.length === 0 && <p className="mt-6 rounded-xl border border-dashed border-line2 p-6 text-center text-sm text-slate">The homepage is empty. Add a section below.</p>}

      {c.blocks.map((b, idx) => (
        <BlockShell
          key={b.id}
          title={isBuiltin(b) ? BUILTIN_LABELS[b.type] : WIDGET_LABELS[b.type].name}
          kind={isBuiltin(b) ? (EDITABLE_BUILTINS.includes(b.type) ? "Standard section" : "Standard section, fixed") : "Widget"}
          first={idx === 0}
          last={idx === c.blocks.length - 1}
          open={openId === b.id || openId === "*"}
          onToggle={() => setOpenId(openId === b.id ? null : b.id)}
          onMove={(dir) => moveBlock(idx, dir)}
          onDelete={() => deleteBlock(idx)}
        >
          {isBuiltin(b) ? builtinBody(b.type) : <WidgetEditor block={b} onChange={(patch) => patchBlock(b.id, patch)} />}
        </BlockShell>
      ))}

      {otherPage.length > 0 && (
        <div className="mt-8">
          <h2 className="font-display text-xl">Text on other pages</h2>
          <p className="mt-1 text-sm text-slate">These sections are not on the homepage. They show on their own pages, and you edit their words here.</p>
          {otherPage.map((t) => (
            <BlockShell
              key={t}
              title={BUILTIN_LABELS[t]}
              kind={OTHER_PAGE[t] ?? ""}
              open={openId === `o-${t}` || openId === "*"}
              onToggle={() => setOpenId(openId === `o-${t}` ? null : `o-${t}`)}
            >
              {builtinBody(t)}
            </BlockShell>
          ))}
        </div>
      )}

      <Card title="Services page" hint={`The /services page. Add up to ${LIMITS.servicesPage} services, each with an optional photo. Without a photo a soft placeholder is shown.`}>
        <Field label="Small label" value={c.servicesPage.eyebrow} max={40} onChange={(v) => edit((d) => ({ ...d, servicesPage: { ...d.servicesPage, eyebrow: v } }))} />
        <Field label="Heading" value={c.servicesPage.heading} max={140} onChange={(v) => edit((d) => ({ ...d, servicesPage: { ...d.servicesPage, heading: v } }))} />
        <Field label="Intro (optional)" value={c.servicesPage.intro} max={300} multiline onChange={(v) => edit((d) => ({ ...d, servicesPage: { ...d.servicesPage, intro: v } }))} />
        {c.servicesPage.items.map((it, i) => (
          <Row key={i} onRemove={() => edit((d) => ({ ...d, servicesPage: { ...d.servicesPage, items: d.servicesPage.items.filter((_, n) => n !== i) } }))}>
            <Field label="Service name" value={it.name} max={60} onChange={(v) => edit((d) => ({ ...d, servicesPage: { ...d.servicesPage, items: setAt(d.servicesPage.items, i, { name: v }) } }))} />
            <Field label="Description" value={it.detail} max={200} multiline onChange={(v) => edit((d) => ({ ...d, servicesPage: { ...d.servicesPage, items: setAt(d.servicesPage.items, i, { detail: v }) } }))} />
            <ImageField label="Photo" value={it.imageUrl} onChange={(v) => edit((d) => ({ ...d, servicesPage: { ...d.servicesPage, items: setAt(d.servicesPage.items, i, { imageUrl: v }) } }))} />
          </Row>
        ))}
        <Add disabled={c.servicesPage.items.length >= LIMITS.servicesPage} onClick={() => edit((d) => ({ ...d, servicesPage: { ...d.servicesPage, items: [...d.servicesPage.items, { name: "", detail: "", imageUrl: "" }] } }))} label="Add a service" />
      </Card>

      <div className="mt-8 rounded-2xl border border-line bg-ink2 p-6">
        <h2 className="font-display text-xl">Add a section</h2>
        {missing.length > 0 && (
          <>
            <p className="mt-4 text-sm font-medium">Standard sections you removed</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {missing.map((t) => (
                <button key={t} type="button" onClick={() => addBlock({ id: t, type: t })} className="rounded-full border border-line2 px-4 py-2 text-sm font-medium hover:bg-sand">+ {BUILTIN_LABELS[t]}</button>
              ))}
            </div>
          </>
        )}
        <p className="mt-5 text-sm font-medium">New widgets</p>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          {WIDGET_TYPES.map((t) => (
            <button key={t} type="button" disabled={c.blocks.length >= LIMITS.blocks} onClick={() => addBlock(newWidget(t))} className="rounded-xl border border-line p-4 text-left hover:bg-sand disabled:opacity-40">
              <span className="block text-sm font-medium">+ {WIDGET_LABELS[t].name}</span>
              <span className="mt-1 block text-xs text-slate">{WIDGET_LABELS[t].hint}</span>
            </button>
          ))}
        </div>
      </div>

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

function BlockShell({ title, kind, first, last, open, onToggle, onMove, onDelete, children }: {
  title: string; kind: string; first?: boolean; last?: boolean; open: boolean;
  onToggle: () => void; onMove?: (d: -1 | 1) => void; onDelete?: () => void; children: React.ReactNode;
}) {
  const btn = "rounded-full border border-line2 px-3 py-1.5 text-sm hover:bg-sand disabled:opacity-30";
  return (
    <section className="mt-4 rounded-2xl border border-line bg-ink2">
      <div className="flex flex-wrap items-center gap-3 p-4">
        <button type="button" onClick={onToggle} aria-expanded={open} className="min-w-0 flex-1 text-left">
          <span className="block font-display text-lg">{title}</span>
          <span className="block text-xs text-slateLight">{kind} · {open ? "click to close" : "click to edit"}</span>
        </button>
        {onMove && <button type="button" onClick={() => onMove(-1)} disabled={first} className={btn} aria-label={`Move ${title} up`}>↑</button>}
        {onMove && <button type="button" onClick={() => onMove(1)} disabled={last} className={btn} aria-label={`Move ${title} down`}>↓</button>}
        {onDelete && <button type="button" onClick={onDelete} className="rounded-full border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50">Delete</button>}
      </div>
      {open && <div className="space-y-4 border-t border-line p-5">{children}</div>}
    </section>
  );
}

function WidgetEditor({ block, onChange }: { block: Block; onChange: (patch: Record<string, unknown>) => void }) {
  const b = block as Record<string, unknown> & { type: string };
  const str = (k: string) => (typeof b[k] === "string" ? (b[k] as string) : "");
  const F = (k: string, label: string, max: number, extra: { multiline?: boolean; placeholder?: string } = {}) => (
    <Field label={label} value={str(k)} max={max} multiline={extra.multiline} placeholder={extra.placeholder} onChange={(v) => onChange({ [k]: v })} />
  );
  const button = (
    <div className="grid gap-4 sm:grid-cols-2">
      {F("buttonLabel", "Button text (optional)", 30)}
      {F("buttonHref", "Button link", 500, { placeholder: "/book-project or https://…" })}
    </div>
  );
  const items = (Array.isArray(b.items) ? b.items : []) as Record<string, string>[];
  const setItem = (i: number, patch: Record<string, string>) => onChange({ items: items.map((x, n) => (n === i ? { ...x, ...patch } : x)) });
  const dropItem = (i: number) => onChange({ items: items.filter((_, n) => n !== i) });

  switch (b.type) {
    case "text":
      return (<>
        {F("eyebrow", "Small label (optional)", 40)}
        {F("heading", "Heading", 120)}
        {F("body", "Text", 1500, { multiline: true })}
        <label className="block text-sm">Alignment
          <select className="input mt-1" value={str("align")} onChange={(e) => onChange({ align: e.target.value })}>
            <option value="left">Left</option><option value="center">Centred</option>
          </select>
        </label>
        {button}
      </>);
    case "imageText":
      return (<>
        {F("heading", "Heading", 120)}
        {F("body", "Text", 1200, { multiline: true })}
        <ImageField label="Image" value={str("imageUrl")} onChange={(v) => onChange({ imageUrl: v })} />
        <label className="block text-sm">Image position
          <select className="input mt-1" value={str("imageSide")} onChange={(e) => onChange({ imageSide: e.target.value })}>
            <option value="right">Right</option><option value="left">Left</option>
          </select>
        </label>
        {button}
      </>);
    case "cards":
      return (<>
        {F("eyebrow", "Small label (optional)", 40)}
        {F("heading", "Heading", 120)}
        {items.map((it, i) => (
          <Row key={i} onRemove={() => dropItem(i)}>
            <Field label="Card title" value={it.title ?? ""} max={60} onChange={(v) => setItem(i, { title: v })} />
            <Field label="Card text" value={it.text ?? ""} max={240} multiline onChange={(v) => setItem(i, { text: v })} />
          </Row>
        ))}
        <Add disabled={items.length >= LIMITS.cards} onClick={() => onChange({ items: [...items, { title: "", text: "" }] })} label="Add a card" />
      </>);
    case "faq":
      return (<>
        {F("heading", "Heading", 120, { placeholder: "Questions" })}
        {items.map((it, i) => (
          <Row key={i} onRemove={() => dropItem(i)}>
            <Field label="Question" value={it.q ?? ""} max={160} onChange={(v) => setItem(i, { q: v })} />
            <Field label="Answer" value={it.a ?? ""} max={800} multiline onChange={(v) => setItem(i, { a: v })} />
          </Row>
        ))}
        <Add disabled={items.length >= LIMITS.faq} onClick={() => onChange({ items: [...items, { q: "", a: "" }] })} label="Add a question" />
      </>);
    case "video":
      return (<>
        {F("heading", "Heading (optional)", 120)}
        {F("url", "YouTube or Vimeo link", 300, { placeholder: "https://www.youtube.com/watch?v=…" })}
        <p className="text-xs text-slate">Only YouTube and Vimeo links work. Anything else is ignored.</p>
      </>);
    case "gallery": {
      const images = (Array.isArray(b.images) ? b.images : []) as string[];
      return (<>
        {F("heading", "Heading (optional)", 120)}
        {images.map((u, i) => (
          <Row key={i} onRemove={() => onChange({ images: images.filter((_, n) => n !== i) })}>
            <ImageField label={`Photo ${i + 1}`} value={u} onChange={(v) => onChange({ images: images.map((x, n) => (n === i ? v : x)) })} />
          </Row>
        ))}
        <Add disabled={images.length >= LIMITS.gallery} onClick={() => onChange({ images: [...images, ""] })} label="Add a photo" />
      </>);
    }
    case "banner":
      return (<>
        {F("heading", "Heading", 120)}
        {F("text", "Text (optional)", 300, { multiline: true })}
        {button}
      </>);
    default:
      return <p className="text-sm text-slate">Adds empty space between sections. Nothing to edit.</p>;
  }
}

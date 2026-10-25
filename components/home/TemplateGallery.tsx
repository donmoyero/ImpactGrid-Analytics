"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight, ExternalLink, Monitor, Smartphone, X } from "lucide-react";
import { stepUrl } from "@/lib/onboarding";
import { SITE_TEMPLATES, TEMPLATE_CATEGORIES, templateDemoUrl, type SiteTemplate } from "@/lib/site-templates";

const ALL = "All";
const PAGE = 8;

/**
 * Home page: every website template, grouped by business type. Click a card to open the whole site (every page, working menu and
 * buttons) in a preview window, with no account needed. "Use this template" starts sign-up with that business type already chosen.
 */
export default function TemplateGallery() {
  const [tab, setTab] = useState<string>(ALL);
  const [shown, setShown] = useState(PAGE);
  const [openId, setOpenId] = useState<string | null>(null);

  const list = useMemo(() => (tab === ALL ? SITE_TEMPLATES : SITE_TEMPLATES.filter((t) => t.category === tab)), [tab]);
  const visible = list.slice(0, shown);
  const hint = tab === ALL ? null : TEMPLATE_CATEGORIES.find((c) => c.label === tab)?.hint;
  const openAt = openId ? list.findIndex((t) => t.id === openId) : -1;
  const open = openAt >= 0 ? list[openAt] : null;

  const pickTab = (t: string) => { setTab(t); setShown(PAGE); };
  const close = useCallback(() => setOpenId(null), []);
  const step = useCallback((dir: -1 | 1) => {
    if (openAt < 0) return;
    setOpenId(list[(openAt + dir + list.length) % list.length].id);
  }, [list, openAt]);

  return (
    <section id="templates" className="border-b border-line" aria-labelledby="templates-heading">
      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-10 lg:py-20">
        <p className="label-tag text-slate">{SITE_TEMPLATES.length} website templates</p>
        <h2 id="templates-heading" className="mt-3 max-w-2xl font-display text-3xl lg:text-4xl">Start from a design made for your business</h2>
        <p className="mt-3 max-w-xl text-sm text-slate">Browse by business type, then open any template to explore the whole site before you sign up.</p>

        <div className="-mx-6 mt-8 overflow-x-auto px-6 pb-2 lg:mx-0 lg:px-0" role="tablist" aria-label="Business type">
          <div className="flex w-max gap-2 lg:w-auto lg:flex-wrap">
            {[ALL, ...TEMPLATE_CATEGORIES.map((c) => c.label)].map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                onClick={() => pickTab(t)}
                className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm transition-colors ${tab === t ? "border-paper bg-paper text-white" : "border-line2 bg-ink2 text-slate hover:border-paper"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-3 min-h-[1.25rem] text-xs text-slateLight" aria-live="polite">{hint ? `${hint} · ${list.length} templates` : `${list.length} templates`}</p>

        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" role="tabpanel">
          {visible.map((t) => (
            <button key={t.id} type="button" onClick={() => setOpenId(t.id)} aria-label={`Preview ${t.brand}, ${t.category}`} className="group text-left">
              <span className="relative block aspect-[16/10] overflow-hidden rounded-2xl border border-line bg-sand shadow-soft transition group-hover:border-paper group-hover:shadow-lift">
                <Thumb t={t} />
                <span className="absolute inset-x-0 bottom-0 flex justify-end bg-gradient-to-t from-black/55 to-transparent p-3 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-paper">Preview</span>
                </span>
              </span>
              <span className="mt-3 flex items-baseline justify-between gap-3">
                <span className="font-display text-lg leading-tight">{t.brand}</span>
                <span className="shrink-0 font-mono text-[11px] text-slateLight">{t.pages} {t.pages === 1 ? "page" : "pages"}</span>
              </span>
              <span className="mt-0.5 block text-sm text-slate">{t.tagline}</span>
              {tab === ALL && <span className="mt-1 block label-tag text-slateLight">{t.category}</span>}
            </button>
          ))}
        </div>

        {shown < list.length && (
          <div className="mt-10 flex justify-center">
            <button type="button" onClick={() => setShown((n) => n + PAGE)} className="inline-flex items-center gap-2 rounded-full border border-line2 bg-ink2 px-6 py-3 text-sm font-medium transition-colors hover:border-paper">
              Show more <span className="text-slateLight">({list.length - shown} left)</span>
            </button>
          </div>
        )}
      </div>

      {open && <PreviewWindow t={open} total={list.length} onClose={close} onStep={step} />}
    </section>
  );
}

/** The card image. If a picture is missing or cannot load, a plain tile with the template's name shows instead of a broken icon. */
function Thumb({ t }: { t: SiteTemplate }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span className="grid h-full w-full place-items-center bg-sand px-4 text-center font-display text-xl text-slate">{t.brand}</span>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={t.thumb} alt="" width={800} height={500} loading="lazy" decoding="async" onError={() => setFailed(true)} className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-[1.03]" />;
}

function PreviewWindow({ t, total, onClose, onStep }: { t: SiteTemplate; total: number; onClose: () => void; onStep: (dir: -1 | 1) => void }) {
  const [mobile, setMobile] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const url = templateDemoUrl(t);

  useEffect(() => { setLoaded(false); }, [t.id, mobile]);

  // Latest handlers live in a ref so the listener and scroll lock are set up once, when the window opens, and focus returns to the card that opened it.
  const handlers = useRef({ onClose, onStep, total });
  handlers.current = { onClose, onStep, total };
  useEffect(() => {
    const trigger = document.activeElement as HTMLElement | null;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      const h = handlers.current;
      if (e.key === "Escape") h.onClose();
      else if (e.key === "ArrowLeft" && h.total > 1) h.onStep(-1);
      else if (e.key === "ArrowRight" && h.total > 1) h.onStep(1);
    };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; trigger?.focus?.(); };
  }, []);

  const toggle = (on: boolean) => `inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs ${on ? "bg-paper text-white" : "text-slate"}`;

  return (
    <div role="dialog" aria-modal="true" aria-label={`${t.brand} preview`} className="fixed inset-0 z-50 flex flex-col bg-black/60 p-3 sm:p-6" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div className="min-w-0">
            <p className="truncate font-display text-lg leading-tight">{t.brand}</p>
            <p className="truncate text-xs text-slateLight">{t.category} · {t.pages} {t.pages === 1 ? "page" : "pages"} · Click around: every page and button works.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl border border-line bg-white p-0.5">
              <button type="button" onClick={() => setMobile(false)} aria-pressed={!mobile} className={toggle(!mobile)}><Monitor className="h-3.5 w-3.5" />Desktop</button>
              <button type="button" onClick={() => setMobile(true)} aria-pressed={mobile} className={toggle(mobile)}><Smartphone className="h-3.5 w-3.5" />Mobile</button>
            </div>
            {total > 1 && (
              <div className="flex gap-1">
                <button type="button" onClick={() => onStep(-1)} aria-label="Previous template" className="grid h-9 w-9 place-items-center rounded-xl border border-line hover:border-paper"><ChevronLeft className="h-4 w-4" /></button>
                <button type="button" onClick={() => onStep(1)} aria-label="Next template" className="grid h-9 w-9 place-items-center rounded-xl border border-line hover:border-paper"><ChevronRight className="h-4 w-4" /></button>
              </div>
            )}
            <button ref={closeRef} type="button" onClick={onClose} aria-label="Close preview" className="grid h-9 w-9 place-items-center rounded-xl border border-line hover:border-paper"><X className="h-4 w-4" /></button>
          </div>
        </div>

        <div className="relative min-h-0 flex-1 bg-sand/60">
          {!loaded && <p className="absolute inset-0 grid place-items-center text-sm text-slateLight" aria-live="polite">Loading preview…</p>}
          <div className={`mx-auto h-full ${mobile ? "w-[390px] max-w-full border-x border-line2 bg-white shadow-soft" : "w-full"}`}>
            <iframe
              key={`${t.id}-${mobile}`}
              src={url}
              title={`${t.brand} website preview`}
              loading="lazy"
              referrerPolicy="no-referrer"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              onLoad={() => setLoaded(true)}
              className="h-full w-full bg-white"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3">
          <p className="max-w-xl text-xs text-slateLight">Sample content. Once you sign up, the template is filled with your own business name, services and photos.</p>
          <div className="flex flex-wrap gap-2">
            <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-line2 px-4 py-2.5 text-sm hover:border-paper"><ExternalLink className="h-3.5 w-3.5" />Open in new tab</a>
            <Link href={stepUrl(0, { type: t.category })} className="inline-flex items-center gap-2 rounded-full bg-paper px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blueprint2">
              Use this template <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

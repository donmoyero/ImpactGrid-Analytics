"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { featuredTemplates, SITE_TEMPLATES } from "@/lib/site-templates";
import { PreviewWindow, TemplateCard } from "@/components/templates/TemplateBrowser";

const FEATURED = featuredTemplates();

/** Home page: three real templates people can open and click through. The whole collection lives on the Templates page. */
export default function FeaturedTemplates() {
  const [openId, setOpenId] = useState<string | null>(null);
  const openAt = openId ? FEATURED.findIndex((t) => t.id === openId) : -1;
  const open = openAt >= 0 ? FEATURED[openAt] : null;
  const close = useCallback(() => setOpenId(null), []);
  const step = useCallback((dir: -1 | 1) => {
    if (openAt < 0) return;
    setOpenId(FEATURED[(openAt + dir + FEATURED.length) % FEATURED.length].id);
  }, [openAt]);

  return (
    <section className="border-b border-line bg-sand/60" aria-labelledby="featured-heading">
      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-10 lg:py-16">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="label-tag text-slate">Most used templates</p>
            <h2 id="featured-heading" className="mt-3 font-display text-3xl lg:text-4xl">Built around your business</h2>
          </div>
          <Link href="/templates" className="inline-flex items-center gap-2 self-start rounded-full border border-line2 bg-ink2 px-5 py-2.5 text-sm font-medium transition-colors hover:border-paper lg:self-auto">
            Browse all {SITE_TEMPLATES.length} templates <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {FEATURED.map((t) => (
            <TemplateCard key={t.id} t={t} showCategory onOpen={() => setOpenId(t.id)} />
          ))}
        </div>
      </div>

      {open && <PreviewWindow t={open} total={FEATURED.length} onClose={close} onStep={step} />}
    </section>
  );
}

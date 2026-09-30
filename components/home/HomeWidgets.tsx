/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { videoEmbedUrl, type Block } from "@/lib/site/content";

const isExternal = (h: string) => /^https?:\/\//i.test(h);

function Btn({ label, href, dark }: { label: string; href: string; dark?: boolean }) {
  if (!label || !href) return null;
  return (
    <Link
      href={href}
      target={isExternal(href) ? "_blank" : undefined}
      rel={isExternal(href) ? "noopener noreferrer" : undefined}
      className={`mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium ${dark ? "bg-white text-paper hover:bg-blueprint2 hover:text-white" : "bg-signal text-ink hover:bg-blueprint2"}`}
    >
      {label}
      <ArrowUpRight className="h-4 w-4" />
    </Link>
  );
}

function Head({ eyebrow, heading, center }: { eyebrow?: string; heading?: string; center?: boolean }) {
  if (!eyebrow && !heading) return null;
  return (
    <div className={center ? "text-center" : ""}>
      {eyebrow && <p className="label-tag text-slate">{eyebrow}</p>}
      {heading && <h2 className={`mt-3 max-w-2xl font-display text-3xl lg:text-4xl ${center ? "mx-auto" : ""}`}>{heading}</h2>}
    </div>
  );
}

/** Renders one admin-added widget. A widget with nothing in it renders nothing. */
export function Widget({ block }: { block: Block }) {
  switch (block.type) {
    case "text": {
      if (!block.heading && !block.body) return null;
      const center = block.align === "center";
      return (
        <section className="border-b border-line">
          <div className={`mx-auto max-w-4xl px-6 py-20 lg:px-10 ${center ? "text-center" : ""}`}>
            <Head eyebrow={block.eyebrow} heading={block.heading} center={center} />
            {block.body && <p className={`mt-4 max-w-2xl whitespace-pre-line text-slate ${center ? "mx-auto" : ""}`}>{block.body}</p>}
            <Btn label={block.buttonLabel} href={block.buttonHref} />
          </div>
        </section>
      );
    }
    case "imageText": {
      if (!block.heading && !block.body && !block.imageUrl) return null;
      return (
        <section className="border-b border-line">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-20 lg:grid-cols-2 lg:px-10">
            <div className={block.imageSide === "left" ? "lg:order-2" : ""}>
              {block.heading && <h2 className="font-display text-3xl lg:text-4xl">{block.heading}</h2>}
              {block.body && <p className="mt-4 max-w-md whitespace-pre-line text-slate">{block.body}</p>}
              <Btn label={block.buttonLabel} href={block.buttonHref} />
            </div>
            {block.imageUrl && (
              <img src={block.imageUrl} alt="" loading="lazy" className={`w-full rounded-2xl border border-line object-cover ${block.imageSide === "left" ? "lg:order-1" : ""}`} />
            )}
          </div>
        </section>
      );
    }
    case "cards": {
      if (!block.items.length) return null;
      return (
        <section className="border-b border-line bg-ink2">
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
            <Head eyebrow={block.eyebrow} heading={block.heading} />
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {block.items.map((c, i) => (
                <div key={i} className="rounded-2xl border border-line p-6">
                  {c.title && <h3 className="font-display text-xl">{c.title}</h3>}
                  {c.text && <p className="mt-2 text-sm text-slate">{c.text}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }
    case "faq": {
      if (!block.items.length) return null;
      return (
        <section className="border-b border-line">
          <div className="mx-auto max-w-3xl px-6 py-20 lg:px-10">
            <Head heading={block.heading || "Questions"} />
            <div className="mt-8 divide-y divide-line rounded-2xl border border-line bg-ink2">
              {block.items.map((f, i) => (
                <details key={i} className="group p-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                    {f.q}
                    <span aria-hidden className="ml-4 text-slateLight transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 whitespace-pre-line text-sm text-slate">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      );
    }
    case "video": {
      const src = videoEmbedUrl(block.url);
      if (!src) return null;
      return (
        <section className="border-b border-line">
          <div className="mx-auto max-w-4xl px-6 py-20 lg:px-10">
            <Head heading={block.heading} />
            <div className="mt-8 aspect-video overflow-hidden rounded-2xl border border-line bg-black">
              <iframe src={src} title={block.heading || "Video"} loading="lazy" className="h-full w-full" allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
            </div>
          </div>
        </section>
      );
    }
    case "gallery": {
      if (!block.images.length) return null;
      return (
        <section className="border-b border-line">
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
            <Head heading={block.heading} />
            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {block.images.map((u, i) => (
                <img key={i} src={u} alt="" loading="lazy" className="aspect-square w-full rounded-xl border border-line object-cover" />
              ))}
            </div>
          </div>
        </section>
      );
    }
    case "banner": {
      if (!block.heading) return null;
      return (
        <section className="border-b border-white/10 bg-[#0c0d10] text-white">
          <div className="mx-auto max-w-4xl px-6 py-20 text-center lg:px-10">
            <h2 className="font-display text-3xl lg:text-4xl">{block.heading}</h2>
            {block.text && <p className="mx-auto mt-4 max-w-xl text-white/70">{block.text}</p>}
            <Btn label={block.buttonLabel} href={block.buttonHref} dark />
          </div>
        </section>
      );
    }
    case "divider":
      return <div aria-hidden className="h-16" />;
    default:
      return null;
  }
}

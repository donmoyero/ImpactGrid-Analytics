"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Full-bleed background that plays a list of videos one after another and loops back to the first.
 * Muted + playsInline so browsers allow autoplay (also on phones). Fills its parent: the parent must be `relative`.
 * Falls back quietly: a video that fails to load is skipped, and people who prefer reduced motion get a still frame.
 */
export default function HeroVideo({ sources }: { sources: string[] }) {
  const [i, setI] = useState(0);
  const [reduce, setReduce] = useState(false);
  const ref = useRef<HTMLVideoElement>(null);
  const n = sources.length;

  useEffect(() => {
    setReduce(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (!reduce) ref.current?.play().catch(() => {});
  }, [i, reduce]);

  if (!n) return null;
  const next = () => setI((cur) => (cur + 1) % n);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[#0c0d10]">
      <video
        ref={ref}
        src={sources[i % n]}
        className="h-full w-full object-cover"
        autoPlay={!reduce}
        muted
        playsInline
        preload="auto"
        loop={n === 1}
        onEnded={next}
        onError={() => n > 1 && next()}
      />
      {/* warm up the next clip so the switch is quick */}
      {n > 1 && <video src={sources[(i + 1) % n]} className="hidden" muted playsInline preload="auto" />}
      {/* keeps the headline readable on any footage */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-black/15" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/50 to-transparent" />
    </div>
  );
}

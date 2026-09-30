"use client";

import { useState } from "react";

/** Shows the logo from Admin → Settings; falls back to the small dot until one is uploaded. */
export default function BrandMark({ dot }: { dot: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span className={dot} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/api/brand-logo" alt="" className="h-7 w-auto" onError={() => setFailed(true)} />;
}

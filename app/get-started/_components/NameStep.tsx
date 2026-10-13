"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NAME_MAX, NAME_MIN, previewCopy, stepUrl, type OnboardingAnswers } from "@/lib/onboarding";
import StepFrame, { Photo } from "./StepFrame";

export default function NameStep({ answers }: { answers: OnboardingAnswers }) {
  const router = useRouter();
  const [name, setName] = useState(answers.name);
  const clean = name.replace(/\s+/g, " ").trim();
  const canNext = clean.length >= NAME_MIN;
  const next = () => canNext && router.push(stepUrl(3, { ...answers, name: clean }));

  return (
    <StepFrame step={2} answers={answers} wide aside={<Preview answers={{ ...answers, name: clean }} />} onNext={next} canNext={canNext}>
      <div className="mx-auto flex min-h-full max-w-xl flex-col justify-center py-8">
        <h1 className="font-display text-3xl leading-tight sm:text-4xl">Choose a name for your business</h1>
        <p className="mt-3 text-sm text-slateLight">This is the name customers will see. You can change it later.</p>
        <label className="mt-8 block text-sm font-medium" htmlFor="biz-name">Business name</label>
        <div className="relative mt-2">
          <input
            id="biz-name"
            className="input !rounded-none !py-4 pr-14"
            autoFocus
            maxLength={NAME_MAX}
            placeholder="e.g. Glow Beauty Studio"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && next()}
          />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slateLight">{NAME_MAX - name.length}</span>
        </div>
      </div>
    </StepFrame>
  );
}

/** A small, live picture of the website the owner is about to get, updated as they type. */
function Preview({ answers }: { answers: OnboardingAnswers }) {
  const p = previewCopy(answers);
  return (
    <Photo src="/images/get-started/preview.jpg" blur className="h-full">
      <div className="absolute inset-0 bg-black/35" />
      <div className="relative flex h-full items-center justify-center p-8">
        <div className="w-full max-w-lg bg-white p-4 shadow-lift">
          <div className="flex items-center justify-between gap-3 px-1 pb-3">
            <span className="truncate font-display text-base font-semibold">{p.title}</span>
            <span className="hidden items-center gap-3 text-[10px] text-slate md:flex">
              {p.links.map((l) => <span key={l}>{l}</span>)}
              <span className="rounded-full bg-paper px-3 py-1.5 font-medium text-white">{p.cta}</span>
            </span>
          </div>
          <Photo src="/images/get-started/preview.jpg" className="aspect-[16/10]">
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/10" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white">
              {p.sub && <p className="text-[10px] uppercase tracking-widest text-white/80">{p.sub}</p>}
              <p className="mt-1 font-display text-2xl leading-tight">{p.headline}</p>
            </div>
          </Photo>
        </div>
      </div>
    </Photo>
  );
}

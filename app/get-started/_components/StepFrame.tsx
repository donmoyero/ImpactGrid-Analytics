"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import BrandMark from "@/components/BrandMark";
import { STEPS, stepUrl, type OnboardingAnswers } from "@/lib/onboarding";

/** A photo that fills its box. If the file is missing the warm gradient shows instead, so nothing ever looks broken. */
export function Photo({ src, className, blur, children }: { src: string; className?: string; blur?: boolean; children?: React.ReactNode }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={cn("relative overflow-hidden bg-gradient-to-br from-[#2b2620] via-[#4a3f33] to-[#8a7358]", className)}>
      {!failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" onError={() => setFailed(true)} className={cn("absolute inset-0 h-full w-full object-cover", blur && "scale-110 blur-2xl")} />
      )}
      {children}
    </div>
  );
}

type Props = {
  step: number;
  answers: OnboardingAnswers;
  /** Right-hand panel: a photo, or (name step) a live preview. */
  aside: React.ReactNode;
  /** Wider right panel for the preview. */
  wide?: boolean;
  /** Shows the Next button when set. */
  onNext?: () => void;
  canNext?: boolean;
  nextLabel?: string;
  children: React.ReactNode;
};

/** Header, content, step tabs and Back / Next, shared by all four pages. */
export default function StepFrame({ step, answers, aside, wide, onNext, canNext = true, nextLabel = "Next", children }: Props) {
  const backHref = step === 0 ? "/" : stepUrl(step - 1, answers);
  return (
    <div className="relative flex h-full flex-col">
      <aside className={cn("absolute inset-y-0 right-0 hidden lg:block", wide ? "w-[46%]" : "w-[34%]")}>{aside}</aside>

      <div className={cn("flex min-h-0 flex-1 flex-col", wide ? "lg:pr-[46%]" : "lg:pr-[34%]")}>
        <header className="flex h-16 shrink-0 items-center justify-between px-6 sm:px-10">
          <Link href="/" className="flex items-center gap-2.5" aria-label="ImpactGrid home">
            <BrandMark className="h-7 w-7" />
            <span className="font-display text-base font-semibold tracking-tight">ImpactGrid</span>
          </Link>
          <Link href="/login" className="text-xs font-semibold uppercase tracking-wider text-slate hover:text-paper">Sign in</Link>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto px-6 sm:px-10">{children}</main>

        <footer className="shrink-0 border-t border-line bg-white px-6 py-4 sm:px-10">
          <div className="flex items-center justify-between gap-4">
            <Link href={backHref} className="inline-flex items-center gap-2 border border-line2 px-5 py-3.5 text-xs font-semibold uppercase tracking-wider hover:border-paper">
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </Link>

            <ol className="hidden flex-1 justify-center gap-6 sm:flex" aria-label="Progress">
              {STEPS.map((s, i) => {
                const state = i < step ? "done" : i === step ? "current" : "todo";
                const bar = <span className={cn("block h-0.5 w-20", state === "todo" ? "bg-line" : "bg-paper")} />;
                const label = (
                  <span className={cn("mt-2 flex items-center justify-center gap-1 text-xs", state === "todo" ? "text-slateLight" : "text-paper")}>
                    {state === "done" && <Check className="h-3 w-3" />}
                    {s.label}
                  </span>
                );
                return (
                  <li key={s.id} aria-current={state === "current" ? "step" : undefined}>
                    {state === "done" ? <Link href={stepUrl(i, answers)} className="block">{bar}{label}</Link> : <div>{bar}{label}</div>}
                  </li>
                );
              })}
            </ol>

            {onNext ? (
              <button type="button" onClick={onNext} disabled={!canNext} className="bg-paper px-8 py-3.5 text-xs font-semibold uppercase tracking-wider text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40">
                {nextLabel}
              </button>
            ) : <span />}
          </div>
          <p className="mt-3 text-center text-xs text-slateLight sm:hidden">Step {step + 1} of {STEPS.length}</p>
        </footer>
      </div>
    </div>
  );
}

/** Heading on the left, content on the right, centred in the page. */
export function Split({ step, title, subtitle, children }: { step: number; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-full max-w-6xl flex-col justify-center gap-8 py-8 lg:grid lg:grid-cols-[minmax(220px,2fr)_3fr] lg:items-center lg:gap-14">
      <div>
        <h1 className="font-display text-3xl leading-tight sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-3 max-w-xs text-sm text-slateLight">{subtitle}</p>}
        <div className="mt-6 flex gap-1" aria-hidden>
          {STEPS.map((s, i) => <span key={s.id} className={cn("h-px w-10", i <= step ? "bg-paper" : "bg-line2")} />)}
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
}

/** A list of single-choice rows, drawn as boxes you tick. */
export function OptionList<T extends string>({ options, value, onChange, label }: { options: { id: T; label: string; hint?: string }[]; value: string; onChange: (id: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="grid gap-2.5 sm:grid-cols-2">
      {options.map((o) => {
        const selected = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.id)}
            className={cn("flex items-start gap-4 bg-[#f6f4f0] px-5 py-4 text-left text-sm transition-colors hover:bg-[#eeebe4]", selected && "bg-[#ece8df] ring-1 ring-paper")}
          >
            <span className={cn("mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border", selected ? "border-paper bg-paper text-white" : "border-slateLight bg-white")}>
              {selected && <Check className="h-3 w-3" />}
            </span>
            <span>
              <span className="block">{o.label}</span>
              {o.hint && <span className="mt-0.5 block text-xs text-slateLight">{o.hint}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

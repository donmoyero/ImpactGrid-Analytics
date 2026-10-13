"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import LoginForm from "@/app/login/LoginForm";
import { BUSINESS_TYPES, GOALS, NAME_MAX, TYPE_MAX, buildStartUrl } from "@/lib/onboarding";

const STEPS = 4; // type, goal, name, account

export default function GetStartedWizard({ signedIn }: { signedIn: boolean }) {
  const [step, setStep] = useState(0);
  const [type, setType] = useState("");
  const [otherType, setOtherType] = useState("");
  const [goal, setGoal] = useState("");
  const [name, setName] = useState("");

  const chosenType = type === "other" ? otherType.trim() : type;
  const startUrl = buildStartUrl({ name, type: chosenType, goal });

  const canNext = step === 0 ? chosenType.length > 0 : step === 1 ? goal !== "" : step === 2 ? name.trim().length >= 2 : true;
  const next = () => canNext && setStep((s) => Math.min(s + 1, STEPS - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <div>
      <div className="mb-8 flex items-center gap-3" aria-label={`Step ${step + 1} of ${STEPS}`}>
        {Array.from({ length: STEPS }).map((_, i) => (
          <span key={i} className={cn("h-1.5 flex-1 rounded-full transition-colors", i <= step ? "bg-paper" : "bg-line")} />
        ))}
      </div>

      {step === 0 && (
        <section>
          <h1 className="font-display text-3xl md:text-4xl">What kind of business do you run?</h1>
          <p className="mt-2 text-slate">We will set things up to suit you. You can change anything later.</p>
          <div className="mt-8 grid grid-cols-2 gap-3">
            {BUSINESS_TYPES.map((t) => (
              <Choice key={t} selected={type === t} onClick={() => setType(t)}>{t}</Choice>
            ))}
            <Choice selected={type === "other"} onClick={() => setType("other")}>Something else</Choice>
          </div>
          {type === "other" && (
            <input className="input mt-4" autoFocus maxLength={TYPE_MAX} placeholder="Tell us what you do" value={otherType} onChange={(e) => setOtherType(e.target.value)} />
          )}
        </section>
      )}

      {step === 1 && (
        <section>
          <h1 className="font-display text-3xl md:text-4xl">What do you want to do first?</h1>
          <p className="mt-2 text-slate">Pick one. Everything is included, this just decides where you start.</p>
          <div className="mt-8 grid gap-3">
            {GOALS.map((g) => (
              <Choice key={g.id} selected={goal === g.id} onClick={() => setGoal(g.id)}>
                <span className="block font-medium">{g.label}</span>
                <span className="mt-0.5 block text-sm font-normal text-slate">{g.hint}</span>
              </Choice>
            ))}
          </div>
        </section>
      )}

      {step === 2 && (
        <section>
          <h1 className="font-display text-3xl md:text-4xl">What is your business called?</h1>
          <p className="mt-2 text-slate">This is the name customers will see.</p>
          <input
            className="input mt-8"
            autoFocus
            maxLength={NAME_MAX}
            placeholder="e.g. Glow Beauty Studio"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && next()}
          />
        </section>
      )}

      {step === 3 && (
        <section>
          {signedIn ? (
            <>
              <h1 className="font-display text-3xl md:text-4xl">You are all set, {name.trim()}.</h1>
              <p className="mt-2 text-slate">You are already signed in. Continue to confirm your web address and open your dashboard.</p>
              <a href={startUrl} className="btn-premium mt-8">Open my dashboard <ArrowRight className="h-4 w-4" /></a>
            </>
          ) : (
            <>
              <h1 className="font-display text-3xl md:text-4xl">Create your account</h1>
              <p className="mt-2 text-slate">One account for {name.trim() || "your business"}, your team and your website. No waiting for approval: you get your own business dashboard straight away.</p>
              <LoginForm next={startUrl} linkError={false} initialMode="signup" />
            </>
          )}
        </section>
      )}

      <div className="mt-10 flex items-center justify-between">
        {step > 0 ? (
          <button type="button" onClick={back} className="btn-ghost-premium"><ArrowLeft className="h-4 w-4" /> Back</button>
        ) : <span />}
        {step < STEPS - 1 && (
          <button type="button" onClick={next} disabled={!canNext} className="btn-premium">Continue <ArrowRight className="h-4 w-4" /></button>
        )}
      </div>
    </div>
  );
}

function Choice({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "rounded-2xl border bg-ink2 p-4 text-left text-sm transition-colors hover:border-paper",
        selected ? "border-paper ring-2 ring-paper/10" : "border-line2"
      )}
    >
      {children}
    </button>
  );
}

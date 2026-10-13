"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BUSINESS_TYPES, TYPE_MAX, cleanAnswers, stepUrl, type OnboardingAnswers } from "@/lib/onboarding";
import StepFrame, { OptionList, Photo, Split } from "./StepFrame";

const OTHER = "other";

export default function TypeStep({ answers }: { answers: OnboardingAnswers }) {
  const router = useRouter();
  const known = (BUSINESS_TYPES as readonly string[]).includes(answers.type);
  const [type, setType] = useState(answers.type ? (known ? answers.type : OTHER) : "");
  const [other, setOther] = useState(known ? "" : answers.type);

  const chosen = type === OTHER ? other.trim() : type;
  const canNext = chosen.length > 0;
  const next = () => canNext && router.push(stepUrl(1, { ...answers, type: cleanAnswers({ type: chosen }).type }));

  return (
    <StepFrame step={0} answers={answers} aside={<Photo src="/images/get-started/topic.jpg" className="h-full" />} onNext={next} canNext={canNext}>
      <Split step={0} title="What kind of business do you run?" subtitle="We will set things up to suit you. You can change anything later.">
        <OptionList
          label="Kind of business"
          value={type}
          onChange={setType}
          options={[...BUSINESS_TYPES.map((t) => ({ id: t as string, label: t })), { id: OTHER, label: "Something else" }]}
        />
        {type === OTHER && (
          <input
            className="input mt-3 !rounded-none"
            autoFocus
            maxLength={TYPE_MAX}
            placeholder="Tell us what you do"
            value={other}
            onChange={(e) => setOther(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && next()}
          />
        )}
      </Split>
    </StepFrame>
  );
}

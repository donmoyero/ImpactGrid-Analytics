"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cleanAnswers, stepUrl, type OnboardingAnswers } from "@/lib/onboarding";
import { TEMPLATE_CATEGORIES } from "@/lib/site-templates";
import StepFrame, { OptionList, Photo, Split } from "./StepFrame";

/** Step 1. One of the 18 business types, each matching a set of website templates. There is no free-text answer: every business gets templates made for it. */
export default function TypeStep({ answers }: { answers: OnboardingAnswers }) {
  const router = useRouter();
  const [type, setType] = useState(answers.type);

  const canNext = type.length > 0;
  const next = () => canNext && router.push(stepUrl(1, { ...answers, type: cleanAnswers({ type }).type }));

  return (
    <StepFrame step={0} answers={answers} aside={<Photo src="/images/get-started/topic.jpg" className="h-full" />} onNext={next} canNext={canNext}>
      <Split step={0} title="What kind of business do you run?" subtitle="We will show you website templates made for it. You can change anything later.">
        <OptionList label="Kind of business" value={type} onChange={setType} options={TEMPLATE_CATEGORIES.map((c) => ({ id: c.label, label: c.label, hint: c.hint }))} />
      </Split>
    </StepFrame>
  );
}

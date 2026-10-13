"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GOALS, stepUrl, type OnboardingAnswers } from "@/lib/onboarding";
import StepFrame, { OptionList, Photo, Split } from "./StepFrame";

export default function GoalStep({ answers }: { answers: OnboardingAnswers }) {
  const router = useRouter();
  const [goal, setGoal] = useState(answers.goal);
  const next = () => goal && router.push(stepUrl(2, { ...answers, goal }));

  return (
    <StepFrame step={1} answers={answers} aside={<Photo src="/images/get-started/goal.jpg" className="h-full" />} onNext={next} canNext={goal !== ""}>
      <Split step={1} title="What do you want to do first?" subtitle="Pick one. Everything is included, this just decides where you start.">
        <OptionList label="First goal" value={goal} onChange={setGoal} options={GOALS.map((g) => ({ id: g.id as string, label: g.label, hint: g.hint }))} />
      </Split>
    </StepFrame>
  );
}

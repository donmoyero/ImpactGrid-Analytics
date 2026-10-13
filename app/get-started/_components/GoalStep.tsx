"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GOALS, stepUrl, type OnboardingAnswers } from "@/lib/onboarding";
import StepFrame, { CheckList, Photo, Split } from "./StepFrame";

export default function GoalStep({ answers }: { answers: OnboardingAnswers }) {
  const router = useRouter();
  // Kept in the order they were ticked: the first one is where the platform starts them.
  const [goals, setGoals] = useState<string[]>(answers.goals);
  const toggle = (id: string) => setGoals((g) => (g.includes(id) ? g.filter((x) => x !== id) : [...g, id]));
  const next = () => goals.length > 0 && router.push(stepUrl(2, { ...answers, goals }));
  const firstLabel = GOALS.find((g) => g.id === goals[0])?.label;

  return (
    <StepFrame step={1} answers={answers} aside={<Photo src="/images/get-started/goal.jpg" className="h-full" />} onNext={next} canNext={goals.length > 0}>
      <Split step={1} title="What do you want to do with your business?" subtitle="Tick everything that applies. The first one you tick is where we start you.">
        <CheckList label="What you want to do" options={GOALS} value={goals} onToggle={toggle} />
        <p className="mt-4 text-xs text-slateLight" aria-live="polite">
          {goals.length === 0 ? "Pick at least one." : `${goals.length} selected. We will start you with “${firstLabel}”.`}
        </p>
      </Split>
    </StepFrame>
  );
}

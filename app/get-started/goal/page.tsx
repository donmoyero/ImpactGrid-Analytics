import { redirect } from "next/navigation";
import { answersFromParams, firstMissingStep, stepUrl } from "@/lib/onboarding";
import GoalStep from "../_components/GoalStep";

export const metadata = { title: "Your goal | ShopPlug", robots: { index: false } };

export default function GoalPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const answers = answersFromParams(searchParams);
  const missing = firstMissingStep(1, answers);
  if (missing !== null) redirect(stepUrl(missing, answers));
  return <GoalStep answers={answers} />;
}

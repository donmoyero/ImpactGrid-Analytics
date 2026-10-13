import { redirect } from "next/navigation";
import { answersFromParams, firstMissingStep, stepUrl } from "@/lib/onboarding";
import NameStep from "../_components/NameStep";

export const metadata = { title: "Your business name | ImpactGrid", robots: { index: false } };

export default function NamePage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const answers = answersFromParams(searchParams);
  const missing = firstMissingStep(2, answers);
  if (missing !== null) redirect(stepUrl(missing, answers));
  return <NameStep answers={answers} />;
}

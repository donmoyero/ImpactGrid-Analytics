import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { answersFromParams, firstMissingStep, stepUrl } from "@/lib/onboarding";
import AccountStep from "../_components/AccountStep";

export const metadata = { title: "Create your account | ImpactGrid", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AccountPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const answers = answersFromParams(searchParams);
  const missing = firstMissingStep(3, answers);
  if (missing !== null) redirect(stepUrl(missing, answers));
  const { data: { user } } = await createClient().auth.getUser();
  return <AccountStep answers={answers} signedIn={!!user} />;
}

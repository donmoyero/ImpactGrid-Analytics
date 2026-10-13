import { createClient } from "@/lib/supabase/server";
import GetStartedWizard from "./GetStartedWizard";

export const metadata = { title: "Get started | ImpactGrid", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function GetStartedPage() {
  const { data: { user } } = await createClient().auth.getUser();
  return (
    <main className="mx-auto max-w-2xl px-6 py-14 md:py-20">
      <GetStartedWizard signedIn={!!user} />
    </main>
  );
}

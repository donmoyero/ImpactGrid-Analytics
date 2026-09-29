import { getAdminDb } from "@/lib/supabase/admin";
import { sanitizeHomepage } from "@/lib/site/content";
import HomepageEditor from "./HomepageEditor";

export const dynamic = "force-dynamic";

export default async function HomepageAdmin() {
  const { data, error } = await getAdminDb().from("site_content").select("value").eq("key", "homepage").maybeSingle();
  if (error) {
    return (
      <div className="max-w-xl">
        <h1 className="font-display text-3xl">Homepage</h1>
        <p role="alert" className="mt-6 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          The homepage content table isn&apos;t set up yet. Run <code>supabase/migrations-site-content.sql</code> in the Supabase SQL Editor, then refresh this page.
        </p>
      </div>
    );
  }
  return <HomepageEditor initial={sanitizeHomepage(data?.value)} />;
}

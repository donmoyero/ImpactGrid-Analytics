import { getAdminDb } from "@/lib/supabase/admin";
import { decodeLogo } from "@/lib/invoice/settings";

export const dynamic = "force-dynamic";

/** Serves the logo saved in Admin → Settings. The logo is public branding; nothing else is read. */
export async function GET() {
  try {
    const { data } = await getAdminDb().from("business_settings").select("value").eq("key", "business_profile").maybeSingle();
    const logo = decodeLogo((data?.value as { logo_data?: string } | null)?.logo_data);
    if (!logo) return new Response(null, { status: 404 });
    return new Response(Buffer.from(logo.bytes), {
      headers: { "Content-Type": logo.type === "png" ? "image/png" : "image/jpeg", "Cache-Control": "public, max-age=300" },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}

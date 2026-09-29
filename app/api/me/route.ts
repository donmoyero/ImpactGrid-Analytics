import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminDb } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/** Tells the header whether the signed-in user is an admin. Display only; /admin re-checks on the server. */
export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  try {
    const { data: { user } } = await createClient().auth.getUser();
    if (!user) return NextResponse.json({ isAdmin: false }, { headers });
    const { data } = await getAdminDb().from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
    return NextResponse.json({ isAdmin: !!data?.is_admin }, { headers });
  } catch {
    return NextResponse.json({ isAdmin: false }, { headers });
  }
}

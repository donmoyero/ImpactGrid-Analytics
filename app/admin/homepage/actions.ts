"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminDb } from "@/lib/supabase/admin";
import { sanitizeHomepage } from "@/lib/site/content";

/** Saves the homepage. The payload is re-validated here; the browser is never trusted. */
export async function saveHomepage(payload: string): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  let raw: unknown;
  try {
    raw = JSON.parse(payload);
  } catch {
    return { ok: false, message: "Couldn't read the form. Please try again." };
  }
  const value = sanitizeHomepage(raw);
  const { error } = await getAdminDb().from("site_content").upsert({ key: "homepage", value, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) return { ok: false, message: error.message.includes("site_content") ? "The site_content table is missing. Run the homepage migration in Supabase first." : error.message };
  revalidateTag("homepage");
  revalidatePath("/");
  revalidatePath("/services");
  revalidatePath("/how-it-works");
  return { ok: true, message: "Saved. Your homepage is updated." };
}

const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/** Admin-only. Returns a one-time signed upload target so the browser can send the image straight to Supabase Storage. */
export async function createUploadUrl(
  contentType: string
): Promise<{ ok: true; path: string; token: string; publicUrl: string } | { ok: false; message: string }> {
  await requireAdmin();
  const ext = TYPES[contentType];
  if (!ext) return { ok: false, message: "Please use a JPG, PNG or WebP image." };
  const path = `home/${crypto.randomUUID()}.${ext}`;
  const { data, error } = await getAdminDb().storage.from("site-media").createSignedUploadUrl(path);
  if (error || !data) return { ok: false, message: error?.message.includes("not found") ? "The image bucket is missing. Run the homepage migration in Supabase first." : error?.message ?? "Upload isn't available right now." };
  return { ok: true, path, token: data.token, publicUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/site-media/${path}` };
}

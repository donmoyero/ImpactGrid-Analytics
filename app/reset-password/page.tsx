import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ResetForm from "./ResetForm";

export const metadata = { title: "Choose a new password | ShopPlug", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Reached from the email link: /auth/callback has already turned the link's code into a session. No session = an expired or reused link. */
export default async function ResetPasswordPage() {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) redirect("/forgot-password?expired=1");
  return <ResetForm />;
}

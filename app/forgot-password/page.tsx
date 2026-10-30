import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ForgotForm from "./ForgotForm";

export const metadata = { title: "Reset password | ShopPlug", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage({ searchParams }: { searchParams: { expired?: string } }) {
  const { data: { user } } = await createClient().auth.getUser();
  if (user) redirect("/auth/continue");
  return <ForgotForm expired={searchParams.expired === "1"} />;
}

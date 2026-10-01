import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// The main site's admin is only the homepage editor now. Business operations live on the platform.
// (Access is already enforced by app/admin/layout.tsx -> requireAdmin().)
export default function AdminPage() {
  redirect("/admin/homepage");
}

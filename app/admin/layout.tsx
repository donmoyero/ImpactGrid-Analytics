import Link from "next/link";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  FolderKanban,
  CreditCard,
  Globe,
  Receipt,
  MessageSquare,
  UsersRound,
  BarChart3,
  Settings,
} from "lucide-react";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/projects", label: "Projects", icon: FolderKanban },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/domains", label: "Domains", icon: Globe },
  { href: "/admin/invoices", label: "Invoices", icon: Receipt },
  { href: "/admin/messages", label: "Messages", icon: MessageSquare },
  { href: "/admin/team", label: "Team", icon: UsersRound },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-7xl gap-10 px-6 py-12 lg:px-10">
      <aside className="hidden w-56 shrink-0 lg:block">
        <p className="label-tag mb-4 text-signal">Admin only</p>
        <nav className="sticky top-24 space-y-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate hover:bg-ink2 hover:text-paper"
            >
              <l.icon className="h-4 w-4" />
              {l.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

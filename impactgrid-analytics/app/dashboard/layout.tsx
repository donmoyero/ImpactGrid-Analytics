import Link from "next/link";
import {
  LayoutDashboard,
  FolderKanban,
  Globe,
  Receipt,
  FileText,
  MessageSquare,
  CalendarClock,
  LifeBuoy,
  Settings,
} from "lucide-react";

const links = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
  { href: "/dashboard/domains", label: "Domains", icon: Globe },
  { href: "/dashboard/invoices", label: "Invoices", icon: Receipt },
  { href: "/dashboard/files", label: "Files", icon: FileText },
  { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/meetings", label: "Meetings", icon: CalendarClock },
  { href: "/support", label: "Support", icon: LifeBuoy },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-7xl gap-10 px-6 py-12 lg:px-10">
      <aside className="hidden w-56 shrink-0 lg:block">
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

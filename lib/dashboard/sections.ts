import type { PackageTier } from "@/types";

/**
 * Which dashboard sections each package includes. The sidebar and every section page read from here,
 * so changing what a package gets is a one-line edit. `built: false` items show as "Soon" until the page exists.
 */
export interface DashboardItem { label: string; href: string; built: boolean }
export interface DashboardSection { id: string; label: string; packages: PackageTier[]; items: DashboardItem[] }

export const DASHBOARD_SECTIONS: DashboardSection[] = [
  {
    id: "website", label: "Website", packages: ["business", "premium"],
    items: [
      { label: "Edit content", href: "/dashboard/website/content", built: false },
      { label: "Images", href: "/dashboard/website/images", built: false },
      { label: "Pages", href: "/dashboard/website/pages", built: false },
      { label: "SEO", href: "/dashboard/website/seo", built: false },
      { label: "Settings", href: "/dashboard/website/settings", built: false },
    ],
  },
  {
    id: "orders", label: "Orders", packages: ["premium"],
    items: [
      { label: "Orders", href: "/dashboard/orders", built: false },
      { label: "Customers", href: "/dashboard/customers", built: false },
      { label: "Payments", href: "/dashboard/payments", built: false },
    ],
  },
  {
    id: "products", label: "Products", packages: ["premium"],
    items: [
      { label: "Add product", href: "/dashboard/products/new", built: false },
      { label: "Edit product", href: "/dashboard/products", built: false },
      { label: "Delete product", href: "/dashboard/products/delete", built: false },
      { label: "Inventory", href: "/dashboard/inventory", built: false },
    ],
  },
  {
    id: "marketing", label: "Marketing", packages: ["premium"],
    items: [
      { label: "Campaigns", href: "/dashboard/marketing/campaigns", built: false },
      { label: "Discounts", href: "/dashboard/marketing/discounts", built: false },
      { label: "Promotions", href: "/dashboard/marketing/promotions", built: false },
    ],
  },
  {
    id: "team", label: "Team", packages: ["premium"],
    items: [
      { label: "Staff", href: "/dashboard/team/staff", built: false },
      { label: "Permissions", href: "/dashboard/team/permissions", built: false },
      { label: "Rota", href: "/dashboard/team/rota", built: false },
    ],
  },
];

export const sectionsForPackage = (tier: PackageTier) => DASHBOARD_SECTIONS.filter((s) => s.packages.includes(tier));

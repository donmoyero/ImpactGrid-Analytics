import { AddOn, WebsitePackage } from "@/types";

/**
 * Care plan = hosting, SSL, backups, monitoring, updates and small edits.
 * Every package includes it. The first year is free; after that the card the
 * customer registered with Stripe is charged once a year.
 * Yearly price per package is set via `carePlanYearly` below.
 */
export const CARE_PLAN_TRIAL_DAYS = 365;
export const carePlanIncludes = [
  "Managed hosting",
  "SSL certificate",
  "Daily backups",
  "Security updates and monitoring",
  "Technical maintenance",
  "Small content changes",
];

export const packages: WebsitePackage[] = [
  {
    id: "starter",
    name: "Start",
    price: 400,
    priceLabel: "£400",
    tagline: "Professional website. For businesses that need a strong online presence.",
    features: ["Up to 5 pages", "Responsive design", "Contact forms", "Basic SEO", "Domain setup", "One revision round"],
    carePlanYearly: 150,
  },
  {
    id: "business",
    name: "Manage",
    price: 800,
    priceLabel: "£800",
    tagline: "Website plus control. Manage your website yourself after launch.",
    features: [
      "Everything in Start",
      "Website management dashboard",
      "Content and image uploads",
      "Blog and content management",
      "Booking functionality",
      "Website analytics",
      "More pages",
    ],
    carePlanYearly: 200,
  },
  {
    id: "premium",
    name: "Business",
    price: 1200,
    priceLabel: "£1,200+",
    tagline: "Your digital business platform, from shop to staff.",
    features: [
      "E-commerce and product management",
      "Orders and customers",
      "AI tools and campaigns",
      "Promotions",
      "Staff accounts and permissions",
      "Business dashboard",
      "Automation and integrations",
    ],
    highlighted: true,
    carePlanYearly: 250,
  },
];

export const addons: AddOn[] = [
  { id: "logo", name: "Logo design", price: 250, description: "A custom logo with source files." },
  { id: "branding", name: "Brand identity", price: 450, description: "Colours, type, and a short brand guide." },
  { id: "seo", name: "SEO package", price: 350, description: "Keyword research and on-page optimisation." },
  { id: "gbp", name: "Google Business setup", price: 120, description: "Verified listing with photos and hours." },
];

export function getPackage(id: string) {
  return packages.find((p) => p.id === id);
}

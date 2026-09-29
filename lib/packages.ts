import { AddOn, WebsitePackage } from "@/types";

/**
 * Care plan = hosting, SSL, backups, monitoring, updates and small edits.
 * Every package includes it. The first year is free; after that the card the
 * customer registered with Stripe is charged once a year.
 * Yearly price per package is set via `carePlanYearly` below.
 */
export const CARE_PLAN_TRIAL_DAYS = 365;
export const carePlanIncludes = [
  "Managed hosting with SSL",
  "Daily backups and uptime monitoring",
  "Software and security updates",
  "Small content edits",
];

export const packages: WebsitePackage[] = [
  {
    id: "starter",
    name: "Starter",
    price: 400,
    priceLabel: "£400",
    tagline: "A clean, credible site for a business just getting online.",
    features: ["5 pages", "Responsive design", "Contact form", "Core SEO setup", "1 revision round"],
    carePlanYearly: 150,
  },
  {
    id: "business",
    name: "Business",
    price: 800,
    priceLabel: "£800",
    tagline: "For businesses that take bookings and want to track what's working.",
    features: ["10 pages", "Content management", "Booking system", "Analytics dashboard", "Speed optimisation"],
    highlighted: true,
    carePlanYearly: 200,
  },
  {
    id: "premium",
    name: "Premium",
    price: 1200,
    priceLabel: "£1,200+",
    tagline: "A custom platform with automation and integrations built in.",
    features: [
      "Unlimited pages",
      "Custom client dashboard",
      "AI features",
      "Workflow automation",
      "Third-party API integrations",
      "Priority support",
    ],
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

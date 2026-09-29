import { AddOn, WebsitePackage } from "@/types";

export const packages: WebsitePackage[] = [
  {
    id: "starter",
    name: "Starter",
    price: 800,
    priceLabel: "£800",
    tagline: "A clean, credible site for a business just getting online.",
    features: ["5 pages", "Responsive design", "Contact form", "Core SEO setup", "1 revision round"],
  },
  {
    id: "business",
    name: "Business",
    price: 1500,
    priceLabel: "£1,500",
    tagline: "For businesses that take bookings and want to track what's working.",
    features: ["10 pages", "Content management", "Booking system", "Analytics dashboard", "Speed optimisation"],
    highlighted: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: 3000,
    priceLabel: "£3,000+",
    tagline: "A custom platform with automation and integrations built in.",
    features: [
      "Unlimited pages",
      "Custom client dashboard",
      "AI features",
      "Workflow automation",
      "Third-party API integrations",
      "Priority support",
    ],
  },
];

export const addons: AddOn[] = [
  { id: "logo", name: "Logo design", price: 250, description: "A custom logo with source files." },
  { id: "branding", name: "Brand identity", price: 450, description: "Colours, type, and a short brand guide." },
  { id: "seo", name: "SEO package", price: 350, description: "Keyword research and on-page optimisation." },
  { id: "hosting", name: "Hosting (annual)", price: 180, description: "Managed hosting, SSL, and backups." },
  { id: "maintenance", name: "Maintenance (monthly)", price: 60, description: "Updates, monitoring, and small edits." },
  { id: "gbp", name: "Google Business setup", price: 120, description: "Verified listing with photos and hours." },
];

export function getPackage(id: string) {
  return packages.find((p) => p.id === id);
}

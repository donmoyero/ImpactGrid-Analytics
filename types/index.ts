export type PackageTier = "starter" | "business" | "premium";

export interface WebsitePackage {
  id: PackageTier;
  name: string;
  price: number;
  priceLabel: string;
  tagline: string;
  features: string[];
  highlighted?: boolean;
}

export interface AddOn {
  id: string;
  name: string;
  price: number;
  description: string;
}

export type ProjectStage = "planning" | "design" | "development" | "testing" | "completed";

export interface Project {
  id: string;
  client_id: string;
  business_name: string;
  package: PackageTier;
  domain: string | null;
  stage: ProjectStage;
  progress: Record<ProjectStage, number>;
  deadline: string | null;
  payment_status: "pending" | "paid" | "refunded";
  created_at: string;
}

export interface Client {
  id: string;
  user_id: string;
  business_name: string;
  contact_email: string;
  contact_phone: string | null;
  created_at: string;
}

export interface DomainSearchResult {
  domain: string;
  available: boolean;
  price: number;
  currency: string;
}

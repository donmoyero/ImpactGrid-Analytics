export type PackageTier = "starter" | "business" | "premium";

export interface WebsitePackage {
  id: PackageTier;
  name: string;
  price: number;
  priceLabel: string;
  tagline: string;
  features: string[];
  highlighted?: boolean;
  /** Yearly care plan price in GBP, charged after the free first year. */
  carePlanYearly: number;
}

export interface AddOn {
  id: string;
  name: string;
  price: number;
  description: string;
}

export type CarePlanStatus = "trialing" | "active" | "past_due" | "canceled";

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
  care_plan_status: CarePlanStatus | null;
  care_plan_trial_ends_at: string | null;
  care_plan_price: number | null;
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

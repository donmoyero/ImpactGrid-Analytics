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

export type CarePlanStatus = "trialing" | "active" | "past_due" | "cancelled" | "expired" | "suspended";

export type InvoiceStatus = "draft" | "issued" | "partially_paid" | "overdue" | "paid" | "void";
export type WebsiteStatus = "building" | "live" | "maintenance" | "suspended";
export type DomainStatus =
  | "searching"
  | "available"
  | "reserved"
  | "registration_pending"
  | "registered"
  | "renewal_due"
  | "expired"
  | "failed";
export type ReminderType = "reminder_1" | "reminder_2" | "final_reminder" | "care_plan_reminder" | "care_plan_final";

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
  /** Read-only mirrors of care_plans (kept in sync by a database trigger). */
  care_plan_start_date: string | null;
  care_plan_renewal_date: string | null;
  created_at: string;
}

export interface Client {
  id: string;
  user_id: string;
  business_name: string;
  contact_email: string;
  contact_phone: string | null;
  billing_address: string | null;
  created_at: string;
}

export interface DomainSearchResult {
  domain: string;
  available: boolean;
  price: number;
  currency: string;
}

export interface CarePlan {
  id: string;
  project_id: string;
  plan: PackageTier;
  price: number | null;
  status: CarePlanStatus;
  started_at: string;
  trial_ends_at: string | null;
  renewal_at: string | null;
  grace_period_ends_at: string | null;
  cancelled_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceLine {
  description: string;
  amount: number;
}

export interface Invoice {
  id: string;
  client_id: string;
  project_id: string | null;
  invoice_number: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  line_items: InvoiceLine[];
  status: InvoiceStatus;
  /** 0 = none sent, 1 = reminder 1, 2 = reminder 2, 3 = final reminder */
  reminder_stage: 0 | 1 | 2 | 3;
  issued_at: string | null;
  due_at: string | null;
  paid_at: string | null;
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentReminder {
  id: string;
  invoice_id: string | null;
  care_plan_id: string | null;
  reminder_type: ReminderType;
  status: "pending" | "sent" | "failed";
  sent_at: string | null;
  created_at: string;
}

export interface Website {
  id: string;
  project_id: string;
  domain_id: string | null;
  status: WebsiteStatus;
  maintenance_mode: boolean;
  maintenance_reason: string | null;
  maintenance_message: string | null;
  live_url: string | null;
  suspended_at: string | null;
  suspended_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface WebsiteEvent {
  id: string;
  website_id: string;
  event: string;
  performed_by: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export type OrgRole = "owner" | "admin" | "product_manager" | "sales" | "viewer";

export type ApprovalStatus = "draft" | "in_review" | "approved" | "rejected" | "archived";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  country_code: string;
  currency_code: string;
  locale: string;
  plan_id: string;
  billing_status: string;
}

export interface Product {
  id: string;
  organization_id: string;
  sku: string;
  name: string;
  description: string | null;
  status: ApprovalStatus;
  category: string | null;
  brand_name?: string | null;
  line_name?: string | null;
  base_price_cents?: number | null;
}

export interface Rule {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  rule_type: "requires" | "excludes" | "compat" | "constraint" | "pricing";
  severity: "error" | "warning" | "info";
  status: ApprovalStatus;
  description: string | null;
  expression: Record<string, unknown>;
  explanation_template: string | null;
  source_page?: number | null;
  source_excerpt?: string | null;
}

export interface OptionGroupWithValues {
  id: string;
  code: string;
  name: string;
  selection_type: "single" | "multi";
  required: boolean;
  values: Array<{
    id: string;
    code: string;
    name: string;
    description: string | null;
    price_cents: number;
  }>;
}

export interface ConfigurationSelection {
  variant?: string;
  options: string[];
  attrs?: Record<string, string | number>;
}

export interface ValidityMessage {
  rule: string;
  severity: "error" | "warning" | "info";
  text: string;
  source?: string | null;
}

export interface PriceBreakdown {
  base: number;
  options: Array<{ code: string; cents: number }>;
  total: number;
  currency: string;
}

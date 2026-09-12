export type ProductRow = {
  id: string;
  organization_id: string;
  sku: string;
  name: string;
  description: string | null;
  status: string;
  category: string | null;
  brand_name?: string | null;
  line_name?: string | null;
  base_price_cents?: number | null;
  source_anchor_id?: string | null;
};

export type RuleRow = {
  id: string;
  code: string;
  name: string;
  rule_type: string;
  severity: "error" | "warning" | "info";
  status: string;
  description: string | null;
  expression: Record<string, unknown>;
  explanation_template: string | null;
  source_page?: number | null;
  source_excerpt?: string | null;
  document_title?: string | null;
};

export type DocumentRow = {
  id: string;
  title: string;
  doc_type: string;
  language: string;
  status: string;
  current_version?: string | null;
  page_count?: number | null;
  published_at?: string | null;
};

export type ReviewRow = {
  id: string;
  entity_type: string;
  status: string;
  confidence: number | null;
  proposed_payload: Record<string, unknown>;
  document_title?: string | null;
  version_label?: string | null;
  page?: number | null;
  excerpt?: string | null;
  reviewer_notes?: string | null;
  created_at?: string;
};

export type ChangeRow = {
  id: string;
  title: string;
  change_type: string;
  summary: string | null;
  diff: Record<string, unknown>;
  status: string;
  created_at: string;
};

export type ConfigurationRow = {
  id: string;
  name: string;
  customer_name: string | null;
  status: string;
  total_cents: number;
  share_token: string | null;
  sku: string;
  product_name: string;
  updated_at?: string;
};

export type SearchHit = {
  id: string;
  sku: string;
  name: string;
  kind: string;
};

export type PlanRow = {
  id: string;
  name: string;
  description: string;
  price_monthly_cents: number;
  features: string[];
};

export type MemberRow = {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  status: string;
};

export type AuditRow = {
  id: string;
  action: string;
  entity_type: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type NotificationRow = {
  id: string;
  title: string;
  body: string | null;
  kind: string;
  href?: string | null;
};

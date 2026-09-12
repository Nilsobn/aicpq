import { DEMO_ORG_ID, getPool } from "@/lib/db";
import type {
  ProductRow,
  RuleRow,
  DocumentRow,
  ReviewRow,
  ChangeRow,
  ConfigurationRow,
  SearchHit,
  PlanRow,
  MemberRow,
  AuditRow,
  NotificationRow,
} from "@/lib/data/rows";

export async function getDashboardStats(orgId = DEMO_ORG_ID) {
  const pool = getPool();
  const [products, pending, changes, configs, rules] = await Promise.all([
    pool.query(
      `select
         count(*)::int as total,
         count(*) filter (where status = 'approved')::int as approved,
         count(*) filter (where status = 'draft')::int as draft
       from products where organization_id = $1`,
      [orgId],
    ),
    pool.query(
      `select count(*)::int as c from ai_extractions where organization_id = $1 and status in ('pending','needs_info')`,
      [orgId],
    ),
    pool.query(
      `select count(*)::int as c from change_sets where organization_id = $1 and status = 'open'`,
      [orgId],
    ),
    pool.query(
      `select count(*)::int as c from configurations where organization_id = $1`,
      [orgId],
    ),
    pool.query(
      `select count(*)::int as c from rules where organization_id = $1 and status = 'approved'`,
      [orgId],
    ),
  ]);

  return {
    products: products.rows[0],
    pendingReviews: pending.rows[0].c as number,
    openChanges: changes.rows[0].c as number,
    configurations: configs.rows[0].c as number,
    approvedRules: rules.rows[0].c as number,
  };
}

export async function listProducts(orgId = DEMO_ORG_ID): Promise<ProductRow[]> {
  const pool = getPool();
  const { rows } = await pool.query<ProductRow>(
    `select p.*, b.name as brand_name, pl.name as line_name,
            (select amount_cents from prices pr where pr.product_id = p.id and pr.status = 'approved' limit 1) as base_price_cents
     from products p
     left join brands b on b.id = p.brand_id
     left join product_lines pl on pl.id = p.product_line_id
     where p.organization_id = $1
     order by p.sku`,
    [orgId],
  );
  return rows;
}

export async function getProductDetail(skuOrId: string, orgId = DEMO_ORG_ID) {
  const pool = getPool();
  const { rows } = await pool.query<ProductRow>(
    `select p.*, b.name as brand_name, pl.name as line_name
     from products p
     left join brands b on b.id = p.brand_id
     left join product_lines pl on pl.id = p.product_line_id
     where p.organization_id = $1 and (p.id::text = $2 or p.sku = $2)
     limit 1`,
    [orgId, skuOrId],
  );
  const product = rows[0];
  if (!product) return null;

  const [attrs, variants, options, prices, sources] = await Promise.all([
    pool.query<{
      id: string;
      attr_name: string;
      unit: string | null;
      value_number: number | null;
      value_text: string | null;
      value_boolean: boolean | null;
      source_page: number | null;
      source_excerpt: string | null;
    }>(
      `select pa.*, ad.code, ad.name as attr_name, ad.unit, sa.excerpt as source_excerpt, sa.page as source_page
       from product_attributes pa
       join attribute_definitions ad on ad.id = pa.attribute_id
       left join source_anchors sa on sa.id = pa.source_anchor_id
       where pa.product_id = $1`,
      [product.id],
    ),
    pool.query<{ id: string; sku: string; name: string; status: string }>(
      `select * from product_variants where product_id = $1 order by sku`,
      [product.id],
    ),
    pool.query<{
      id: string;
      code: string;
      name: string;
      required: boolean;
      values: Array<{
        id: string;
        code: string;
        name: string;
        description: string | null;
        price_cents: number;
      }>;
    }>(
      `select og.*, coalesce(json_agg(json_build_object(
          'id', ov.id, 'code', ov.code, 'name', ov.name, 'description', ov.description,
          'price_cents', coalesce((select amount_cents from prices pr where pr.option_value_id = ov.id limit 1), 0)
        ) order by ov.code) filter (where ov.id is not null), '[]') as values
       from option_groups og
       left join option_values ov on ov.option_group_id = og.id
       where og.product_id = $1
       group by og.id
       order by og.code`,
      [product.id],
    ),
    pool.query<{
      id: string;
      product_id: string | null;
      option_value_id: string | null;
      amount_cents: number;
    }>(
      `select * from prices where product_id = $1 or option_value_id in (
         select ov.id from option_values ov
         join option_groups og on og.id = ov.option_group_id
         where og.product_id = $1
       )`,
      [product.id],
    ),
    pool.query<{
      id: string;
      document_title: string;
      version_label: string;
      page: number | null;
      table_ref: string | null;
      cell_ref: string | null;
      excerpt: string | null;
    }>(
      `select sa.*, d.title as document_title, dv.version_label
       from source_anchors sa
       join document_versions dv on dv.id = sa.document_version_id
       join documents d on d.id = dv.document_id
       where sa.id = $1`,
      [product.source_anchor_id],
    ),
  ]);

  return {
    product,
    attributes: attrs.rows,
    variants: variants.rows,
    optionGroups: options.rows,
    prices: prices.rows,
    sources: sources.rows,
  };
}

export async function listRules(orgId = DEMO_ORG_ID): Promise<RuleRow[]> {
  const pool = getPool();
  const { rows } = await pool.query<RuleRow>(
    `select r.*, sa.page as source_page, sa.excerpt as source_excerpt, d.title as document_title
     from rules r
     left join source_anchors sa on sa.id = r.source_anchor_id
     left join document_versions dv on dv.id = sa.document_version_id
     left join documents d on d.id = dv.document_id
     where r.organization_id = $1
     order by r.code`,
    [orgId],
  );
  return rows;
}

export async function listDocuments(orgId = DEMO_ORG_ID): Promise<DocumentRow[]> {
  const pool = getPool();
  const { rows } = await pool.query<DocumentRow>(
    `select d.*, dv.version_label as current_version, dv.page_count, dv.published_at
     from documents d
     left join document_versions dv on dv.id = d.current_version_id
     where d.organization_id = $1
     order by d.title`,
    [orgId],
  );
  return rows;
}

export async function listReviews(orgId = DEMO_ORG_ID): Promise<ReviewRow[]> {
  const pool = getPool();
  const { rows } = await pool.query<ReviewRow>(
    `select e.*, dv.version_label, d.title as document_title, sa.page, sa.excerpt
     from ai_extractions e
     left join document_versions dv on dv.id = e.document_version_id
     left join documents d on d.id = dv.document_id
     left join source_anchors sa on sa.id = e.source_anchor_id
     where e.organization_id = $1
     order by case e.status when 'pending' then 0 when 'needs_info' then 1 else 2 end, e.created_at desc`,
    [orgId],
  );
  return rows;
}

export async function listChanges(orgId = DEMO_ORG_ID): Promise<ChangeRow[]> {
  const pool = getPool();
  const { rows } = await pool.query<ChangeRow>(
    `select * from change_sets where organization_id = $1 order by created_at desc`,
    [orgId],
  );
  return rows;
}

export async function listConfigurations(orgId = DEMO_ORG_ID): Promise<ConfigurationRow[]> {
  const pool = getPool();
  const { rows } = await pool.query<ConfigurationRow>(
    `select c.*, p.sku, p.name as product_name
     from configurations c
     join products p on p.id = c.product_id
     where c.organization_id = $1
     order by c.updated_at desc`,
    [orgId],
  );
  return rows;
}

export async function searchAll(q: string, orgId = DEMO_ORG_ID): Promise<SearchHit[]> {
  const pool = getPool();
  const like = `%${q}%`;
  const [products, rules, documents] = await Promise.all([
    pool.query(
      `select id, sku, name, 'product' as kind from products
       where organization_id = $1 and (sku ilike $2 or name ilike $2 or coalesce(searchable,'') ilike $2)
       limit 20`,
      [orgId, like],
    ),
    pool.query(
      `select id, code as sku, name, 'rule' as kind from rules
       where organization_id = $1 and (code ilike $2 or name ilike $2 or coalesce(description,'') ilike $2)
       limit 20`,
      [orgId, like],
    ),
    pool.query(
      `select id, doc_type as sku, title as name, 'document' as kind from documents
       where organization_id = $1 and title ilike $2
       limit 20`,
      [orgId, like],
    ),
  ]);
  return [...products.rows, ...rules.rows, ...documents.rows] as SearchHit[];
}

export async function getApprovedKnowledge(orgId = DEMO_ORG_ID) {
  const pool = getPool();
  const [products, rules, attrs] = await Promise.all([
    pool.query(
      `select sku, name, description, category, status from products
       where organization_id = $1 and status = 'approved'`,
      [orgId],
    ),
    pool.query(
      `select code, name, rule_type, severity, description, expression, explanation_template
       from rules where organization_id = $1 and status = 'approved'`,
      [orgId],
    ),
    pool.query(
      `select p.sku, ad.code, ad.name, pa.value_text, pa.value_number, pa.value_boolean
       from product_attributes pa
       join products p on p.id = pa.product_id
       join attribute_definitions ad on ad.id = pa.attribute_id
       where pa.organization_id = $1 and pa.status = 'approved' and p.status = 'approved'`,
      [orgId],
    ),
  ]);
  return {
    products: products.rows,
    rules: rules.rows,
    attributes: attrs.rows,
  };
}

export async function getOrgAdmin(orgId = DEMO_ORG_ID) {
  const pool = getPool();
  const [org, members, plans, audits, notifs, settings] = await Promise.all([
    pool.query<{
      id: string;
      name: string;
      slug: string;
      country_code: string;
      currency_code: string;
      locale: string;
      data_region: string;
      plan_id: string;
      billing_status: string;
    }>(`select * from organizations where id = $1`, [orgId]),
    pool.query<MemberRow>(
      `select m.*, p.full_name, p.email from organization_members m
       join profiles p on p.id = m.user_id
       where m.organization_id = $1`,
      [orgId],
    ),
    pool.query<PlanRow>(`select * from plans order by sort_order`),
    pool.query<AuditRow>(
      `select * from audit_logs where organization_id = $1 order by created_at desc limit 50`,
      [orgId],
    ),
    pool.query<NotificationRow>(
      `select * from notifications where organization_id = $1 order by created_at desc limit 20`,
      [orgId],
    ),
    pool.query<{
      email_reviews: boolean;
      email_changes: boolean;
      email_billing: boolean;
      inapp_reviews: boolean;
    }>(`select * from notification_settings where organization_id = $1`, [orgId]),
  ]);
  return {
    organization: org.rows[0],
    members: members.rows,
    plans: plans.rows,
    audits: audits.rows,
    notifications: notifs.rows,
    settings: settings.rows[0],
  };
}

export function formatEUR(cents: number | null | undefined) {
  const value = (cents ?? 0) / 100;
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

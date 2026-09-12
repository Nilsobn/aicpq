-- AICPQ core schema: multi-tenant product intelligence (EU / GDPR-minded defaults)
-- All tenant tables have RLS enabled.

create extension if not exists "pgcrypto";
create extension if not exists "unaccent";

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ---------------------------------------------------------------------------
-- Tenancy / identity
-- ---------------------------------------------------------------------------
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  country_code text not null default 'DE',
  currency_code text not null default 'EUR',
  locale text not null default 'de-DE',
  data_region text not null default 'eu-central-1',
  plan_id text not null default 'professional',
  billing_status text not null default 'trialing',
  trial_ends_at timestamptz,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  preferred_locale text not null default 'de-DE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','product_manager','sales','viewer')),
  status text not null default 'active' check (status in ('active','invited','disabled')),
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table if not exists public.plans (
  id text primary key,
  name text not null,
  description text not null,
  price_monthly_cents integer not null,
  currency_code text not null default 'EUR',
  features jsonb not null default '[]'::jsonb,
  seat_limit integer,
  document_limit integer,
  ai_review_limit integer,
  is_public boolean not null default true,
  sort_order integer not null default 0
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  plan_id text not null references public.plans(id),
  status text not null default 'trialing',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Catalog masters
-- ---------------------------------------------------------------------------
create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  code text not null,
  created_at timestamptz not null default now(),
  unique (organization_id, code)
);

create table if not exists public.product_lines (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  brand_id uuid references public.brands(id) on delete set null,
  name text not null,
  code text not null,
  description text,
  created_at timestamptz not null default now(),
  unique (organization_id, code)
);

create table if not exists public.countries (
  code text primary key,
  name_de text not null
);

create table if not exists public.currencies (
  code text primary key,
  name_de text not null,
  symbol text not null
);

create table if not exists public.price_lists (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  code text not null,
  currency_code text not null references public.currencies(code),
  country_code text references public.countries(code),
  valid_from date,
  valid_to date,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  unique (organization_id, code)
);

-- ---------------------------------------------------------------------------
-- Documents & provenance
-- ---------------------------------------------------------------------------
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  doc_type text not null check (doc_type in ('katalog','preisliste','datenblatt','handbuch','vertrag','sonstiges')),
  language text not null default 'de',
  status text not null default 'active' check (status in ('active','archived','draft')),
  storage_path text,
  current_version_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  version_label text not null,
  checksum text,
  page_count integer,
  published_at date,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (document_id, version_label)
);

alter table public.documents
  drop constraint if exists documents_current_version_id_fkey;
alter table public.documents
  add constraint documents_current_version_id_fkey
  foreign key (current_version_id) references public.document_versions(id) on delete set null;

create table if not exists public.source_anchors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  document_version_id uuid not null references public.document_versions(id) on delete cascade,
  page integer,
  table_ref text,
  cell_ref text,
  anchor_text text,
  excerpt text,
  bbox jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Products / attributes / options / prices
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  brand_id uuid references public.brands(id) on delete set null,
  product_line_id uuid references public.product_lines(id) on delete set null,
  sku text not null,
  name text not null,
  description text,
  status text not null default 'draft' check (status in ('draft','in_review','approved','archived')),
  category text,
  base_unit text default 'Stk',
  searchable text,
  approved_at timestamptz,
  approved_by uuid references auth.users(id),
  source_anchor_id uuid references public.source_anchors(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, sku)
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  sku text not null,
  name text not null,
  status text not null default 'approved' check (status in ('draft','in_review','approved','archived')),
  attributes jsonb not null default '{}'::jsonb,
  source_anchor_id uuid references public.source_anchors(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (organization_id, sku)
);

create table if not exists public.attribute_definitions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  code text not null,
  name text not null,
  data_type text not null check (data_type in ('text','number','boolean','enum','range')),
  unit text,
  enum_values jsonb,
  created_at timestamptz not null default now(),
  unique (organization_id, code)
);

create table if not exists public.product_attributes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  attribute_id uuid not null references public.attribute_definitions(id) on delete cascade,
  value_text text,
  value_number numeric,
  value_boolean boolean,
  value_json jsonb,
  status text not null default 'approved' check (status in ('draft','in_review','approved','rejected')),
  source_anchor_id uuid references public.source_anchors(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (product_id, attribute_id)
);

create table if not exists public.option_groups (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  code text not null,
  name text not null,
  selection_type text not null default 'single' check (selection_type in ('single','multi')),
  required boolean not null default false,
  created_at timestamptz not null default now(),
  unique (organization_id, code, product_id)
);

create table if not exists public.option_values (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  option_group_id uuid not null references public.option_groups(id) on delete cascade,
  code text not null,
  name text not null,
  description text,
  status text not null default 'approved',
  source_anchor_id uuid references public.source_anchors(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (option_group_id, code)
);

create table if not exists public.prices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  price_list_id uuid not null references public.price_lists(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  option_value_id uuid references public.option_values(id) on delete cascade,
  amount_cents integer not null,
  currency_code text not null references public.currencies(code),
  status text not null default 'approved',
  valid_from date,
  valid_to date,
  source_anchor_id uuid references public.source_anchors(id) on delete set null,
  created_at timestamptz not null default now(),
  check (
    (product_id is not null)::int +
    (variant_id is not null)::int +
    (option_value_id is not null)::int = 1
  )
);

-- ---------------------------------------------------------------------------
-- Rules
-- ---------------------------------------------------------------------------
create table if not exists public.rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  code text not null,
  name text not null,
  rule_type text not null check (rule_type in ('requires','excludes','compat','constraint','pricing')),
  severity text not null default 'error' check (severity in ('error','warning','info')),
  status text not null default 'draft' check (status in ('draft','in_review','approved','rejected','archived')),
  description text,
  expression jsonb not null default '{}'::jsonb,
  explanation_template text,
  source_anchor_id uuid references public.source_anchors(id) on delete set null,
  approved_at timestamptz,
  approved_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, code)
);

create table if not exists public.customer_policies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_name text not null,
  contract_ref text,
  policy jsonb not null default '{}'::jsonb,
  status text not null default 'active',
  source_anchor_id uuid references public.source_anchors(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- AI review / changes / configs
-- ---------------------------------------------------------------------------
create table if not exists public.ai_extractions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  document_version_id uuid references public.document_versions(id) on delete set null,
  entity_type text not null,
  proposed_payload jsonb not null,
  confidence numeric,
  status text not null default 'pending' check (status in ('pending','approved','rejected','needs_info')),
  reviewer_notes text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  source_anchor_id uuid references public.source_anchors(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.change_sets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  change_type text not null check (change_type in ('price','product','option','rule','document','bulk')),
  summary text,
  from_version_id uuid references public.document_versions(id) on delete set null,
  to_version_id uuid references public.document_versions(id) on delete set null,
  diff jsonb not null default '{}'::jsonb,
  status text not null default 'open',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.configurations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  name text not null,
  customer_name text,
  status text not null default 'draft' check (status in ('draft','valid','invalid','shared','ordered')),
  selection jsonb not null default '{}'::jsonb,
  price_breakdown jsonb not null default '{}'::jsonb,
  validity jsonb not null default '{}'::jsonb,
  total_cents integer not null default 0,
  currency_code text not null default 'EUR',
  share_token text unique,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references auth.users(id),
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  body text,
  kind text not null default 'info',
  read_at timestamptz,
  href text,
  created_at timestamptz not null default now()
);

create table if not exists public.notification_settings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  email_reviews boolean not null default true,
  email_changes boolean not null default true,
  email_billing boolean not null default true,
  inapp_reviews boolean not null default true,
  unique (organization_id, user_id)
);

create or replace function public.current_org_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id
  from public.organization_members
  where user_id = auth.uid()
    and status = 'active';
$$;

create or replace function public.has_org_role(org uuid, roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = org
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role = any(roles)
  );
$$;

-- ---------------------------------------------------------------------------
-- Updated_at triggers
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['organizations','profiles','products','rules','configurations','subscriptions','documents']
  loop
    execute format('drop trigger if exists trg_%s_updated on public.%I', t, t);
    execute format('create trigger trg_%s_updated before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.organization_members enable row level security;
alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.brands enable row level security;
alter table public.product_lines enable row level security;
alter table public.countries enable row level security;
alter table public.currencies enable row level security;
alter table public.price_lists enable row level security;
alter table public.documents enable row level security;
alter table public.document_versions enable row level security;
alter table public.source_anchors enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.attribute_definitions enable row level security;
alter table public.product_attributes enable row level security;
alter table public.option_groups enable row level security;
alter table public.option_values enable row level security;
alter table public.prices enable row level security;
alter table public.rules enable row level security;
alter table public.customer_policies enable row level security;
alter table public.ai_extractions enable row level security;
alter table public.change_sets enable row level security;
alter table public.configurations enable row level security;
alter table public.audit_logs enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_settings enable row level security;

-- Plans/countries/currencies readable by authenticated
create policy plans_read on public.plans for select to authenticated using (true);
create policy countries_read on public.countries for select to authenticated using (true);
create policy currencies_read on public.currencies for select to authenticated using (true);

create policy profiles_self on public.profiles for select to authenticated using (id = auth.uid());
create policy profiles_self_upd on public.profiles for update to authenticated using (id = auth.uid());
create policy profiles_self_ins on public.profiles for insert to authenticated with check (id = auth.uid());

create policy org_member_select on public.organizations for select to authenticated
  using (id in (select public.current_org_ids()));
create policy org_admin_update on public.organizations for update to authenticated
  using (public.has_org_role(id, array['owner','admin']));

create policy members_select on public.organization_members for select to authenticated
  using (organization_id in (select public.current_org_ids()) or user_id = auth.uid());
create policy members_admin on public.organization_members for all to authenticated
  using (public.has_org_role(organization_id, array['owner','admin']))
  with check (public.has_org_role(organization_id, array['owner','admin']));

-- Generic tenant policies
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'subscriptions','brands','product_lines','price_lists','documents','document_versions',
    'source_anchors','products','product_variants','attribute_definitions','product_attributes',
    'option_groups','option_values','prices','rules','customer_policies','ai_extractions',
    'change_sets','configurations','audit_logs'
  ]
  loop
    execute format('drop policy if exists %I_tenant_select on public.%I', tbl, tbl);
    execute format(
      'create policy %I_tenant_select on public.%I for select to authenticated using (organization_id in (select public.current_org_ids()))',
      tbl, tbl
    );
    execute format('drop policy if exists %I_tenant_write on public.%I', tbl, tbl);
    execute format(
      'create policy %I_tenant_write on public.%I for all to authenticated using (organization_id in (select public.current_org_ids())) with check (organization_id in (select public.current_org_ids()))',
      tbl, tbl
    );
  end loop;
end $$;

create policy notifications_own on public.notifications for select to authenticated
  using (user_id = auth.uid() and organization_id in (select public.current_org_ids()));
create policy notifications_upd on public.notifications for update to authenticated
  using (user_id = auth.uid());

create policy notif_settings_own on public.notification_settings for all to authenticated
  using (user_id = auth.uid() and organization_id in (select public.current_org_ids()))
  with check (user_id = auth.uid() and organization_id in (select public.current_org_ids()));

-- Auth profile bootstrap
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

grant usage on schema public to authenticated, anon;
grant select on all tables in schema public to authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
grant select on public.plans, public.countries, public.currencies to anon;

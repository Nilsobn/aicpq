-- Seed masters + industrial sample tenant (Hydraulik / Pumpen / Ventile)

insert into public.countries (code, name_de) values
  ('DE','Deutschland'),('AT','Österreich'),('CH','Schweiz'),('FR','Frankreich'),('NL','Niederlande')
on conflict do nothing;

insert into public.currencies (code, name_de, symbol) values
  ('EUR','Euro','€'),('CHF','Schweizer Franken','CHF'),('USD','US-Dollar','$')
on conflict do nothing;

insert into public.plans (id, name, description, price_monthly_cents, features, seat_limit, document_limit, ai_review_limit, sort_order) values
  ('starter','Starter','Für kleine Produktteams',19900,'["1 Tenant","5 Nutzer","Assistent (begrenzt)","CSV Export"]',5,50,100,1),
  ('professional','Professional','Standard für Mittelstand',59900,'["Unbegrenzte Produkte","Regel-Engine","KI-Prüfung","Diffs & Versionierung","Konfigurator"]',25,500,2000,2),
  ('enterprise','Enterprise','Konzern & Multi-Werk',149900,'["SSO vorbereitet","Custom Policies","Audit Export","Priority Support","IONOS Self-Host"]',null,null,null,3)
on conflict (id) do update set name = excluded.name, description = excluded.description, price_monthly_cents = excluded.price_monthly_cents;

-- Demo auth user (password: AicpqDemo!2026)
do $$
declare
  uid uuid := '11111111-1111-4111-8111-111111111111';
  org_id uuid := '22222222-2222-4222-8222-222222222222';
  brand_hydro uuid := '33333333-3333-4333-8333-333333333301';
  brand_drive uuid := '33333333-3333-4333-8333-333333333302';
  line_pump uuid := '44444444-4444-4444-8444-444444444401';
  line_valve uuid := '44444444-4444-4444-8444-444444444402';
  line_motor uuid := '44444444-4444-4444-8444-444444444403';
  pl_de uuid := '55555555-5555-4555-8555-555555555501';
  doc_kat uuid := '66666666-6666-4666-8666-666666666601';
  doc_preis uuid := '66666666-6666-4666-8666-666666666602';
  ver_kat uuid := '77777777-7777-4777-8777-777777777701';
  ver_kat2 uuid := '77777777-7777-4777-8777-777777777702';
  ver_preis uuid := '77777777-7777-4777-8777-777777777703';
  anch1 uuid := '88888888-8888-4888-8888-888888888801';
  anch2 uuid := '88888888-8888-4888-8888-888888888802';
  anch3 uuid := '88888888-8888-4888-8888-888888888803';
  anch4 uuid := '88888888-8888-4888-8888-888888888804';
  p_pump uuid := '99999999-9999-4999-8999-999999999901';
  p_valve uuid := '99999999-9999-4999-8999-999999999902';
  p_motor uuid := '99999999-9999-4999-8999-999999999903';
  attr_flow uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01';
  attr_press uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa02';
  attr_power uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa03';
  attr_media uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa04';
  og_seal uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb01';
  og_conn uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb02';
  og_enc uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb03';
  ov_seal_nbr uuid := 'cccccccc-cccc-4ccc-8ccc-cccccccccc01';
  ov_seal_vit uuid := 'cccccccc-cccc-4ccc-8ccc-cccccccccc02';
  ov_conn_g uuid := 'cccccccc-cccc-4ccc-8ccc-cccccccccc03';
  ov_conn_fl uuid := 'cccccccc-cccc-4ccc-8ccc-cccccccccc04';
  ov_enc_ip55 uuid := 'cccccccc-cccc-4ccc-8ccc-cccccccccc05';
  ov_enc_ip65 uuid := 'cccccccc-cccc-4ccc-8ccc-cccccccccc06';
begin
  -- auth user
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000',
    uid,
    'authenticated',
    'authenticated',
    'demo@aicpq.de',
    crypt('AicpqDemo!2026', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Alexandra Berger"}'::jsonb,
    now(), now(), '', '', '', ''
  ) on conflict (id) do nothing;

  insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  values (
    uid, uid,
    jsonb_build_object('sub', uid::text, 'email', 'demo@aicpq.de'),
    'email', uid::text, now(), now(), now()
  ) on conflict do nothing;

  insert into public.profiles (id, email, full_name)
  values (uid, 'demo@aicpq.de', 'Alexandra Berger')
  on conflict (id) do update set full_name = excluded.full_name;

  insert into public.organizations (id, name, slug, country_code, currency_code, locale, plan_id, billing_status, trial_ends_at, settings)
  values (
    org_id,
    'NordWerk Fluidtechnik GmbH',
    'nordwerk',
    'DE', 'EUR', 'de-DE', 'professional', 'active',
    now() + interval '30 days',
    '{"industry":"Maschinenbau","focus":["Hydraulikpumpen","Wegeventile","Antriebe"]}'::jsonb
  ) on conflict (id) do nothing;

  insert into public.organization_members (organization_id, user_id, role, status)
  values (org_id, uid, 'owner', 'active')
  on conflict (organization_id, user_id) do nothing;

  insert into public.subscriptions (organization_id, plan_id, status, current_period_start, current_period_end)
  values (org_id, 'professional', 'active', date_trunc('month', now()), date_trunc('month', now()) + interval '1 month')
  on conflict do nothing;

  insert into public.brands (id, organization_id, name, code) values
    (brand_hydro, org_id, 'HydroMax', 'HYM'),
    (brand_drive, org_id, 'DriveLine', 'DRV')
  on conflict do nothing;

  insert into public.product_lines (id, organization_id, brand_id, name, code, description) values
    (line_pump, org_id, brand_hydro, 'Kreiselpumpen XP', 'XP-PUMP', 'Industrielle Kreiselpumpen für Prozessmedien'),
    (line_valve, org_id, brand_hydro, 'Wegeventile WV', 'WV-VALVE', 'Hydraulische Wegeventile 4/3 und 4/2'),
    (line_motor, org_id, brand_drive, 'IE4 Motoren', 'IE4-MOT', 'Energieeffiziente Drehstrommotoren')
  on conflict do nothing;

  insert into public.price_lists (id, organization_id, name, code, currency_code, country_code, valid_from, is_default)
  values (pl_de, org_id, 'Deutschland 2026', 'DE-2026', 'EUR', 'DE', '2026-01-01', true)
  on conflict do nothing;

  insert into public.documents (id, organization_id, title, doc_type, language, status) values
    (doc_kat, org_id, 'HydroMax Katalog 2026', 'katalog', 'de', 'active'),
    (doc_preis, org_id, 'NordWerk Preisliste Q1/2026', 'preisliste', 'de', 'active')
  on conflict do nothing;

  insert into public.document_versions (id, document_id, organization_id, version_label, page_count, published_at, notes, created_by) values
    (ver_kat, doc_kat, org_id, '2026.1', 148, '2026-01-15', 'Erstausgabe 2026', uid),
    (ver_kat2, doc_kat, org_id, '2026.2', 152, '2026-03-01', 'Ergänzung IP65-Optionen', uid),
    (ver_preis, doc_preis, org_id, '2026-Q1', 42, '2026-01-01', 'Listenpreise EUR', uid)
  on conflict do nothing;

  update public.documents set current_version_id = ver_kat2 where id = doc_kat;
  update public.documents set current_version_id = ver_preis where id = doc_preis;

  insert into public.source_anchors (id, organization_id, document_version_id, page, table_ref, cell_ref, anchor_text, excerpt) values
    (anch1, org_id, ver_kat2, 24, 'T-3.1', 'B4', 'XP-120 Förderstrom', 'XP-120: Q = 120 l/min bei 10 bar, Medium Wasser/Öl'),
    (anch2, org_id, ver_preis, 8, 'P-2', 'C12', 'Listenpreis XP-120', 'Artikel XP-120 Basis 4.850,00 EUR'),
    (anch3, org_id, ver_kat2, 61, 'R-4.2', null, 'Dichtung Viton vs. NBR', 'Viton-Dichtung erforderlich bei Temperaturbereich > 80 °C oder aggressiven Medien'),
    (anch4, org_id, ver_kat2, 88, 'C-1.4', null, 'IP65 nur mit Flansch', 'Schutzart IP65 nur in Kombination mit Flanschanschluss zulässig')
  on conflict do nothing;

  insert into public.attribute_definitions (id, organization_id, code, name, data_type, unit, enum_values) values
    (attr_flow, org_id, 'flow_lmin', 'Förderstrom', 'number', 'l/min', null),
    (attr_press, org_id, 'pressure_bar', 'Betriebsdruck', 'number', 'bar', null),
    (attr_power, org_id, 'power_kw', 'Leistung', 'number', 'kW', null),
    (attr_media, org_id, 'media', 'Medien', 'enum', null, '["Wasser","Hydrauliköl","Chemikalien"]'::jsonb)
  on conflict do nothing;

  insert into public.products (id, organization_id, brand_id, product_line_id, sku, name, description, status, category, searchable, approved_at, approved_by, source_anchor_id) values
    (p_pump, org_id, brand_hydro, line_pump, 'XP-120', 'Kreiselpumpe XP-120', 'Kompakte Prozesspumpe für Kühl- und Schmierkreisläufe.', 'approved', 'Pumpe', 'XP-120 Kreiselpumpe HydroMax Förderstrom 120', now(), uid, anch1),
    (p_valve, org_id, brand_hydro, line_valve, 'WV-43-10', 'Wegeventil WV-43-10', '4/3-Wegeventil NG10 mit Federzentrierung.', 'approved', 'Ventil', 'WV-43-10 Wegeventil Hydraulik NG10', now(), uid, anch1),
    (p_motor, org_id, brand_drive, line_motor, 'IE4-7.5', 'Drehstrommotor IE4 7,5 kW', 'IE4-Effizienzklasse, Wellenhöhe 132.', 'approved', 'Motor', 'IE4-7.5 Motor DriveLine 7.5kW', now(), uid, null)
  on conflict do nothing;

  insert into public.product_variants (organization_id, product_id, sku, name, status, attributes, source_anchor_id) values
    (org_id, p_pump, 'XP-120-STD', 'XP-120 Standard', 'approved', '{"flow_lmin":120,"pressure_bar":10}'::jsonb, anch1),
    (org_id, p_pump, 'XP-120-HP', 'XP-120 Hochdruck', 'approved', '{"flow_lmin":90,"pressure_bar":16}'::jsonb, anch1),
    (org_id, p_valve, 'WV-43-10-24V', 'WV-43-10 24V DC', 'approved', '{"voltage":"24V DC"}'::jsonb, null),
    (org_id, p_motor, 'IE4-7.5-B3', 'IE4-7.5 Fußbauform B3', 'approved', '{"power_kw":7.5,"mount":"B3"}'::jsonb, null)
  on conflict do nothing;

  insert into public.product_attributes (organization_id, product_id, attribute_id, value_number, value_text, status, source_anchor_id) values
    (org_id, p_pump, attr_flow, 120, null, 'approved', anch1),
    (org_id, p_pump, attr_press, 10, null, 'approved', anch1),
    (org_id, p_pump, attr_media, null, 'Wasser', 'approved', anch1),
    (org_id, p_valve, attr_press, 350, null, 'approved', null),
    (org_id, p_motor, attr_power, 7.5, null, 'approved', null)
  on conflict do nothing;

  insert into public.option_groups (id, organization_id, product_id, code, name, selection_type, required) values
    (og_seal, org_id, p_pump, 'SEAL', 'Dichtungswerkstoff', 'single', true),
    (og_conn, org_id, p_pump, 'CONN', 'Anschluss', 'single', true),
    (og_enc, org_id, p_motor, 'ENC', 'Schutzart', 'single', true)
  on conflict do nothing;

  insert into public.option_values (id, organization_id, option_group_id, code, name, description, status, source_anchor_id) values
    (ov_seal_nbr, org_id, og_seal, 'NBR', 'NBR', 'Standard für Wasser/Öl bis 80 °C', 'approved', anch3),
    (ov_seal_vit, org_id, og_seal, 'VITON', 'Viton (FKM)', 'Für hohe Temperaturen und aggressive Medien', 'approved', anch3),
    (ov_conn_g, org_id, og_conn, 'G', 'Gewinde G', 'Rohrgewinde nach ISO 228', 'approved', null),
    (ov_conn_fl, org_id, og_conn, 'FL', 'Flansch', 'DIN-Flanschanschluss', 'approved', anch4),
    (ov_enc_ip55, org_id, og_enc, 'IP55', 'IP55', 'Standard-Schutzart', 'approved', null),
    (ov_enc_ip65, org_id, og_enc, 'IP65', 'IP65', 'Erhöhte Schutzart, nur mit Flansch', 'approved', anch4)
  on conflict do nothing;

  insert into public.prices (organization_id, price_list_id, product_id, amount_cents, currency_code, status, source_anchor_id) values
    (org_id, pl_de, p_pump, 485000, 'EUR', 'approved', anch2),
    (org_id, pl_de, p_valve, 62000, 'EUR', 'approved', null),
    (org_id, pl_de, p_motor, 112000, 'EUR', 'approved', null);

  insert into public.prices (organization_id, price_list_id, option_value_id, amount_cents, currency_code, status, source_anchor_id) values
    (org_id, pl_de, ov_seal_nbr, 0, 'EUR', 'approved', null),
    (org_id, pl_de, ov_seal_vit, 18500, 'EUR', 'approved', anch2),
    (org_id, pl_de, ov_conn_g, 0, 'EUR', 'approved', null),
    (org_id, pl_de, ov_conn_fl, 24000, 'EUR', 'approved', null),
    (org_id, pl_de, ov_enc_ip55, 0, 'EUR', 'approved', null),
    (org_id, pl_de, ov_enc_ip65, 9500, 'EUR', 'approved', null);

  insert into public.rules (organization_id, code, name, rule_type, severity, status, description, expression, explanation_template, source_anchor_id, approved_at, approved_by) values
    (org_id, 'R-SEAL-VITON-TEMP', 'Viton bei hoher Temperatur', 'requires', 'error', 'approved',
     'Viton-Dichtung ist erforderlich, wenn Mediumstemperatur über 80 °C spezifiziert wird.',
     '{"if":{"attr":"media_temp_c","op":">","value":80},"then":{"requires_option":"VITON"}}'::jsonb,
     'Laut {source} ist Viton erforderlich bei Temperaturen > 80 °C.',
     anch3, now(), uid),
    (org_id, 'R-IP65-FLANGE', 'IP65 nur mit Flansch', 'requires', 'error', 'approved',
     'Schutzart IP65 ist nur in Kombination mit Flanschanschluss zulässig.',
     '{"if":{"option":"IP65"},"then":{"requires_option":"FL"}}'::jsonb,
     'Laut {source} ist IP65 nur mit Flanschanschluss zulässig.',
     anch4, now(), uid),
    (org_id, 'R-NBR-CHEM', 'NBR nicht für Chemikalien', 'excludes', 'error', 'approved',
     'NBR-Dichtung ist mit Medium Chemikalien nicht kompatibel.',
     '{"if":{"attr":"media","op":"=","value":"Chemikalien"},"then":{"excludes_option":"NBR"}}'::jsonb,
     'NBR ist für Chemikalien ausgeschlossen (siehe {source}).',
     anch3, now(), uid),
    (org_id, 'R-PUMP-VALVE-COMPAT', 'XP-120 mit WV-43-10', 'compat', 'info', 'approved',
     'XP-120 ist mit Wegeventil WV-43-10 druckseitig kompatibel.',
     '{"products":["XP-120","WV-43-10"],"relation":"compat"}'::jsonb,
     'Kompatibilität laut Katalog freigegeben.',
     anch1, now(), uid);

  insert into public.ai_extractions (organization_id, document_version_id, entity_type, proposed_payload, confidence, status, source_anchor_id) values
    (org_id, ver_kat2, 'product_attribute',
     '{"sku":"XP-120","attribute":"max_temp_c","value":95,"note":"aus Katalogseite 24 extrahiert"}'::jsonb,
     0.86, 'pending', anch1),
    (org_id, ver_preis, 'price',
     '{"sku":"XP-120-HP","amount_cents":512000,"currency":"EUR","delta_pct":5.6}'::jsonb,
     0.91, 'pending', anch2),
    (org_id, ver_kat2, 'rule',
     '{"code":"R-SEAL-VITON-CHEM","type":"requires","summary":"Viton bei Chemikalien-Medien"}'::jsonb,
     0.78, 'needs_info', anch3);

  insert into public.change_sets (organization_id, title, change_type, summary, from_version_id, to_version_id, diff, status, created_by) values
    (org_id, 'Katalog 2026.1 → 2026.2', 'document',
     'IP65-Optionen ergänzt, 4 neue Varianten, 1 Regeländerung',
     ver_kat, ver_kat2,
     '{"added_options":["IP65"],"changed_rules":["R-IP65-FLANGE"],"price_deltas":[]}'::jsonb,
     'open', uid),
    (org_id, 'Preisanpassung XP-120-HP', 'price',
     'Vorschlag +5,6 % aus Preisliste-Extraktion',
     ver_preis, ver_preis,
     '{"sku":"XP-120-HP","from_cents":485000,"to_cents":512000}'::jsonb,
     'open', uid);

  insert into public.configurations (organization_id, product_id, name, customer_name, status, selection, price_breakdown, validity, total_cents, currency_code, share_token, created_by) values
    (org_id, p_pump, 'Angebot Müller Kühlkreislauf', 'Müller Anlagenbau AG', 'valid',
     '{"variant":"XP-120-STD","options":["NBR","G"]}'::jsonb,
     '{"base":485000,"options":[{"code":"NBR","cents":0},{"code":"G","cents":0}],"total":485000}'::jsonb,
     '{"ok":true,"messages":[]}'::jsonb,
     485000, 'EUR', 'nw-demo-mueller-01', uid),
    (org_id, p_pump, 'Entwurf Chemikalien-Kreislauf', 'ChemTech Süd', 'invalid',
     '{"variant":"XP-120-HP","options":["NBR","FL"],"attrs":{"media":"Chemikalien"}}'::jsonb,
     '{"base":485000,"options":[{"code":"NBR","cents":0},{"code":"FL","cents":24000}],"total":509000}'::jsonb,
     '{"ok":false,"messages":[{"rule":"R-NBR-CHEM","severity":"error","text":"NBR ist für Chemikalien ausgeschlossen"}]}'::jsonb,
     509000, 'EUR', null, uid);

  insert into public.customer_policies (organization_id, customer_name, contract_ref, policy, status) values
    (org_id, 'Müller Anlagenbau AG', 'RV-2025-114', '{"max_discount_pct":8,"preferred_seal":"NBR","require_eu_origin":true}'::jsonb, 'active');

  insert into public.audit_logs (organization_id, actor_id, action, entity_type, entity_id, metadata) values
    (org_id, uid, 'approve_product', 'product', p_pump, '{"sku":"XP-120"}'::jsonb),
    (org_id, uid, 'approve_rule', 'rule', null, '{"code":"R-IP65-FLANGE"}'::jsonb),
    (org_id, uid, 'create_configuration', 'configuration', null, '{"name":"Angebot Müller Kühlkreislauf"}'::jsonb);

  insert into public.notifications (organization_id, user_id, title, body, kind, href) values
    (org_id, uid, '3 Extraktionen warten auf Prüfung', 'Neue Vorschläge aus Katalog 2026.2 und Preisliste Q1.', 'review', '/ki-pruefung'),
    (org_id, uid, 'Preisänderung vorgeschlagen', 'XP-120-HP: +5,6 % gegenüber Vorversion.', 'change', '/aenderungen');

  insert into public.notification_settings (organization_id, user_id)
  values (org_id, uid)
  on conflict do nothing;
end $$;

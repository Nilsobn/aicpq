import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPool } from "@/lib/db";

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const body = await req.json();
  const orgName = String(body.orgName || "").trim();
  const industry = String(body.industry || "Industrie").trim();
  if (!orgName) {
    return NextResponse.json({ error: "Firmenname fehlt" }, { status: 400 });
  }

  const pool = getPool();
  const existing = await pool.query(
    `select organization_id from organization_members where user_id = $1 and status = 'active' limit 1`,
    [user.id],
  );
  if (existing.rows[0]) {
    return NextResponse.json({ orgId: existing.rows[0].organization_id });
  }

  const slugBase = slugify(orgName) || `org-${user.id.slice(0, 8)}`;
  const slug = `${slugBase}-${Math.random().toString(36).slice(2, 6)}`;

  const client = await pool.connect();
  try {
    await client.query("begin");
    const org = await client.query(
      `insert into organizations (name, slug, plan_id, billing_status, trial_ends_at, settings)
       values ($1, $2, 'professional', 'trialing', now() + interval '14 days', $3::jsonb)
       returning id`,
      [orgName, slug, JSON.stringify({ industry })],
    );
    const orgId = org.rows[0].id;
    await client.query(
      `insert into organization_members (organization_id, user_id, role, status)
       values ($1, $2, 'owner', 'active')`,
      [orgId, user.id],
    );
    await client.query(
      `insert into subscriptions (organization_id, plan_id, status, current_period_start, current_period_end)
       values ($1, 'professional', 'trialing', now(), now() + interval '14 days')`,
      [orgId],
    );
    await client.query(
      `insert into notification_settings (organization_id, user_id) values ($1, $2)
       on conflict do nothing`,
      [orgId, user.id],
    );
    await client.query(
      `insert into audit_logs (organization_id, actor_id, action, entity_type, metadata)
       values ($1, $2, 'create_organization', 'organization', $3::jsonb)`,
      [orgId, user.id, JSON.stringify({ name: orgName })],
    );
    await client.query("commit");
    return NextResponse.json({ orgId });
  } catch (e) {
    await client.query("rollback");
    const message = e instanceof Error ? e.message : "Unbekannter Fehler";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    client.release();
  }
}

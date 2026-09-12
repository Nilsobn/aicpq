import { NextResponse } from "next/server";
import { DEMO_ORG_ID, getPool } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Datei fehlt" }, { status: 400 });
  }

  const text = await file.text();
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) {
    return NextResponse.json({ error: "CSV leer" }, { status: 400 });
  }

  const pool = getPool();
  let imported = 0;
  for (const line of lines.slice(1)) {
    const [sku, name, category] = line.split(",").map((s) => s.replace(/^"|"$/g, "").trim());
    if (!sku || !name) continue;
    await pool.query(
      `insert into products (organization_id, sku, name, category, status, searchable)
       values ($1,$2,$3,$4,'draft',$5)
       on conflict (organization_id, sku) do update
       set name = excluded.name, category = excluded.category, updated_at = now()`,
      [DEMO_ORG_ID, sku, name, category || null, `${sku} ${name}`],
    );
    imported += 1;
  }

  await pool.query(
    `insert into audit_logs (organization_id, actor_id, action, entity_type, metadata)
     values ($1,$2,'import_csv','product',$3::jsonb)`,
    [DEMO_ORG_ID, user.id, JSON.stringify({ imported, filename: file.name })],
  );

  return NextResponse.json({ imported });
}

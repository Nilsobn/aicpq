import { NextResponse } from "next/server";
import { listReviews } from "@/lib/data/catalog";
import { DEMO_ORG_ID, DEMO_USER_ID, getPool } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const items = await listReviews();
  return NextResponse.json({ items });
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const id = String(body.id || "");
  const status = String(body.status || "");
  const notes = String(body.notes || "");
  if (!id || !["approved", "rejected", "needs_info"].includes(status)) {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pool = getPool();
  await pool.query(
    `update ai_extractions
     set status = $1, reviewer_notes = $2, reviewed_by = $3, reviewed_at = now()
     where id = $4 and organization_id = $5`,
    [status, notes, user?.id || DEMO_USER_ID, id, DEMO_ORG_ID],
  );
  await pool.query(
    `insert into audit_logs (organization_id, actor_id, action, entity_type, entity_id, metadata)
     values ($1,$2,$3,'ai_extraction',$4,$5::jsonb)`,
    [
      DEMO_ORG_ID,
      user?.id || DEMO_USER_ID,
      `review_${status}`,
      id,
      JSON.stringify({ notes }),
    ],
  );

  return NextResponse.json({ ok: true });
}

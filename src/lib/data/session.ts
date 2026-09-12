import { createClient } from "@/lib/supabase/server";
import { DEMO_ORG_ID, getPool } from "@/lib/db";

export async function getSessionContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, orgId: null as string | null, supabase };

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id, role, organizations(*)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  return {
    user,
    orgId: membership?.organization_id ?? null,
    role: membership?.role ?? null,
    organization: membership?.organizations ?? null,
    supabase,
  };
}

/** Server-side reads via pooler when RLS session is unavailable (scripts/seed tooling). */
export async function queryDemoOrg<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const pool = getPool();
  const res = await pool.query(sql, params);
  return res.rows as T[];
}

export { DEMO_ORG_ID };

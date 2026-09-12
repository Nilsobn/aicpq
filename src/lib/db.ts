import { Pool } from "pg";

const globalForPg = globalThis as unknown as { aicpqPool?: Pool };

export function getPool() {
  if (!globalForPg.aicpqPool) {
    globalForPg.aicpqPool = new Pool({
      connectionString:
        process.env.DATABASE_URL ||
        "postgresql://postgres.yqjlmimksyurbccnqpsz:Nils%3F190301_@aws-0-eu-central-1.pooler.supabase.com:6543/postgres",
      ssl: { rejectUnauthorized: false },
      max: 5,
    });
  }
  return globalForPg.aicpqPool;
}

export const DEMO_ORG_ID = "22222222-2222-4222-8222-222222222222";
export const DEMO_USER_ID = "11111111-1111-4111-8111-111111111111";

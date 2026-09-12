/** Public Supabase values (also settable via Vercel env). Anon key is client-safe. */
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://yqjlmimksyurbccnqpsz.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_jzeUNjeDArUDLcNkF6zKGA_nYOmWdkA";

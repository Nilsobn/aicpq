import { AppSidebar } from "@/components/layout/app-sidebar";
import { createClient } from "@/lib/supabase/server";
import { DEMO_ORG_ID, getPool } from "@/lib/db";
import { TooltipProvider } from "@/components/ui/tooltip";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let orgName = "NordWerk Fluidtechnik GmbH";
  let userName = user?.email || "Demo";

  if (user) {
    const pool = getPool();
    const { rows } = await pool.query(
      `select o.name, p.full_name
       from organization_members m
       join organizations o on o.id = m.organization_id
       left join profiles p on p.id = m.user_id
       where m.user_id = $1 and m.status = 'active'
       limit 1`,
      [user.id],
    );
    if (rows[0]) {
      orgName = rows[0].name;
      userName = rows[0].full_name || user.email || userName;
    }
  } else {
    const pool = getPool();
    const { rows } = await pool.query(
      `select name from organizations where id = $1`,
      [DEMO_ORG_ID],
    );
    if (rows[0]) orgName = rows[0].name;
  }

  return (
    <TooltipProvider>
      <div className="flex min-h-screen bg-[#f4f6f8]">
        <AppSidebar orgName={orgName} userName={userName} />
        <div className="flex min-w-0 flex-1 flex-col">
          <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}

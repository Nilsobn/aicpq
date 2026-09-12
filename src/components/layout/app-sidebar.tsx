"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { appNav } from "@/components/layout/nav";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5 px-2">
      {appNav.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
              active
                ? "bg-white/10 text-white"
                : "text-slate-300 hover:bg-white/5 hover:text-white",
            )}
          >
            <Icon className="size-4 shrink-0 opacity-80" />
            <span>{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AppSidebar({
  orgName,
  userName,
}: {
  orgName?: string;
  userName?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const brand = (
    <div className="px-4 py-5">
      <Link href="/dashboard" className="block">
        <div className="text-lg font-semibold tracking-tight text-white">
          AICPQ
        </div>
        <div className="mt-0.5 text-xs text-slate-400">Product Intelligence</div>
      </Link>
      {orgName ? (
        <div className="mt-4 truncate rounded-md border border-white/10 bg-white/5 px-2.5 py-2 text-xs text-slate-300">
          {orgName}
        </div>
      ) : null}
    </div>
  );

  const footer = (
    <div className="mt-auto border-t border-white/10 p-3">
      <div className="mb-2 truncate px-1 text-xs text-slate-400">
        {userName || "Angemeldet"}
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start text-slate-300 hover:bg-white/5 hover:text-white"
        onClick={signOut}
      >
        <LogOut className="size-4" />
        Abmelden
      </Button>
    </div>
  );

  return (
    <>
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-800 bg-[#0f1720] lg:flex">
        {brand}
        <NavLinks />
        {footer}
      </aside>

      <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-3 py-2 lg:hidden">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menü"
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </Button>
        <span className="font-semibold tracking-tight">AICPQ</span>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-black/40"
            aria-label="Menü schließen"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-64 flex-col bg-[#0f1720] text-white shadow-xl">
            {brand}
            <NavLinks onNavigate={() => setOpen(false)} />
            {footer}
          </div>
        </div>
      ) : null}
    </>
  );
}

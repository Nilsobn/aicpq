import Link from "next/link";
import { PageHeader, StatusBadge } from "@/components/layout/page-header";
import { formatEUR, listConfigurations } from "@/lib/data/catalog";
import { Button } from "@/components/ui/button";

export default async function ConfigurationsPage() {
  const configs = await listConfigurations();

  return (
    <div>
      <PageHeader
        title="Konfigurationen / Angebote"
        description="Gespeicherte und freigegebene Konfigurationen mit Preis und Gültigkeit."
        actions={
          <Button render={<Link href="/konfigurator" />}>Neue Konfiguration</Button>
        }
      />
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Kunde</th>
              <th className="px-4 py-3 font-medium">Produkt</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Summe</th>
              <th className="px-4 py-3 font-medium">Share</th>
            </tr>
          </thead>
          <tbody>
            {configs.map((c) => (
              <tr key={c.id} className="border-b border-slate-100">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3">{c.customer_name || "–"}</td>
                <td className="px-4 py-3">
                  {c.sku} · {c.product_name}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={c.status} />
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatEUR(c.total_cents)}
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {c.share_token || "–"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/layout/page-header";
import {
  formatEUR,
  getDashboardStats,
  listChanges,
  listConfigurations,
  listReviews,
} from "@/lib/data/catalog";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const [stats, reviews, changes, configs] = await Promise.all([
    getDashboardStats(),
    listReviews(),
    listChanges(),
    listConfigurations(),
  ]);

  const quality =
    stats.products.total === 0
      ? 0
      : Math.round((stats.products.approved / stats.products.total) * 100);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Datenqualität, offene Prüfungen und aktuelle Konfigurationen auf einen Blick."
        actions={
          <>
            <Button variant="outline" render={<Link href="/ki-pruefung" />}>
              KI-Prüfung
            </Button>
            <Button render={<Link href="/assistent" />}>Assistent</Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Freigegebene Produkte",
            value: `${stats.products.approved}/${stats.products.total}`,
            hint: `Datenqualität ${quality}%`,
          },
          {
            label: "Offene KI-Prüfungen",
            value: String(stats.pendingReviews),
            hint: "Extraktionen warten auf Freigabe",
          },
          {
            label: "Offene Änderungen",
            value: String(stats.openChanges),
            hint: "Diffs & Preisvorschläge",
          },
          {
            label: "Freigegebene Regeln",
            value: String(stats.approvedRules),
            hint: `${stats.configurations} Konfigurationen`,
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {card.label}
            </div>
            <div className="mt-2 font-heading text-3xl font-semibold text-slate-900">
              {card.value}
            </div>
            <div className="mt-1 text-sm text-slate-600">{card.hint}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-medium">Offene KI-Prüfungen</h2>
            <Link href="/ki-pruefung" className="text-sm text-teal-800">
              Alle
            </Link>
          </div>
          <div className="divide-y">
            {reviews.slice(0, 4).map((r) => (
              <div key={r.id} className="flex items-start justify-between gap-3 py-3">
                <div>
                  <div className="text-sm font-medium">{r.entity_type}</div>
                  <div className="text-xs text-slate-500">
                    {r.document_title || "Ohne Dokument"} · Konfidenz{" "}
                    {r.confidence ? Math.round(Number(r.confidence) * 100) : "–"}%
                  </div>
                </div>
                <StatusBadge status={r.status} />
              </div>
            ))}
            {reviews.length === 0 ? (
              <p className="py-6 text-sm text-slate-500">Keine offenen Prüfungen.</p>
            ) : null}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-medium">Letzte Konfigurationen</h2>
            <Link href="/konfigurationen" className="text-sm text-teal-800">
              Alle
            </Link>
          </div>
          <div className="divide-y">
            {configs.slice(0, 4).map((c) => (
              <div key={c.id} className="flex items-start justify-between gap-3 py-3">
                <div>
                  <div className="text-sm font-medium">{c.name}</div>
                  <div className="text-xs text-slate-500">
                    {c.sku} · {formatEUR(c.total_cents)}
                  </div>
                </div>
                <StatusBadge status={c.status} />
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-medium">Änderungen</h2>
          <Link href="/aenderungen" className="text-sm text-teal-800">
            Diffs öffnen
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2 pr-3 font-medium">Titel</th>
                <th className="py-2 pr-3 font-medium">Typ</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 font-medium">Zusammenfassung</th>
              </tr>
            </thead>
            <tbody>
              {changes.map((ch) => (
                <tr key={ch.id} className="border-b border-slate-100">
                  <td className="py-2.5 pr-3 font-medium">{ch.title}</td>
                  <td className="py-2.5 pr-3">{ch.change_type}</td>
                  <td className="py-2.5 pr-3">
                    <StatusBadge status={ch.status} />
                  </td>
                  <td className="py-2.5 text-slate-600">{ch.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

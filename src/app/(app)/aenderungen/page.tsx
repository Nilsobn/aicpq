import { PageHeader, StatusBadge } from "@/components/layout/page-header";
import { listChanges } from "@/lib/data/catalog";

export default async function ChangesPage() {
  const changes = await listChanges();

  return (
    <div>
      <PageHeader
        title="Änderungen"
        description="Versionierte Diffs zwischen Dokumenten, Preislisten, Produkten und Regeln."
      />
      <div className="space-y-4">
        {changes.map((ch) => (
          <article
            key={ch.id}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-medium">{ch.title}</h2>
                <p className="mt-1 text-sm text-slate-600">{ch.summary}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded border px-2 py-0.5 text-xs uppercase text-slate-600">
                  {ch.change_type}
                </span>
                <StatusBadge status={ch.status} />
              </div>
            </div>
            <pre className="mt-4 overflow-x-auto rounded-md bg-slate-50 p-3 text-xs">
              {JSON.stringify(ch.diff, null, 2)}
            </pre>
            <p className="mt-2 text-xs text-slate-500">
              {new Date(ch.created_at).toLocaleString("de-DE")}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}

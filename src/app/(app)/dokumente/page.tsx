import { PageHeader, StatusBadge } from "@/components/layout/page-header";
import { listDocuments } from "@/lib/data/catalog";

export default async function DocumentsPage() {
  const docs = await listDocuments();

  return (
    <div>
      <PageHeader
        title="Dokumente"
        description="Kataloge, Preislisten und Datenblätter mit Versionierung als Provenienz-Basis."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {docs.map((d) => (
          <article
            key={d.id}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-medium">{d.title}</h2>
                <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                  {d.doc_type} · {d.language.toUpperCase()}
                </p>
              </div>
              <StatusBadge status={d.status} />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-slate-500">Aktuelle Version</dt>
                <dd className="font-medium">{d.current_version || "–"}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Seiten</dt>
                <dd className="font-medium">{d.page_count ?? "–"}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Publiziert</dt>
                <dd className="font-medium">
                  {d.published_at
                    ? new Date(d.published_at).toLocaleDateString("de-DE")
                    : "–"}
                </dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </div>
  );
}

import { PageHeader, StatusBadge } from "@/components/layout/page-header";
import { listRules } from "@/lib/data/catalog";

export default async function RulesPage() {
  const rules = await listRules();

  return (
    <div>
      <PageHeader
        title="Regeln"
        description="Requires, Excludes und Kompatibilität — nur freigegebene Regeln steuern Assistent und Konfigurator."
      />
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Typ</th>
              <th className="px-4 py-3 font-medium">Schwere</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Quelle</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((r) => (
              <tr key={r.id} className="border-b border-slate-100 align-top">
                <td className="px-4 py-3 font-mono text-xs font-medium">{r.code}</td>
                <td className="px-4 py-3">
                  <div className="font-medium">{r.name}</div>
                  <div className="mt-1 max-w-md text-xs text-slate-600">
                    {r.description}
                  </div>
                </td>
                <td className="px-4 py-3">{r.rule_type}</td>
                <td className="px-4 py-3">{r.severity}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={r.status} />
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  {r.document_title || "–"}
                  {r.source_page ? ` · S. ${r.source_page}` : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

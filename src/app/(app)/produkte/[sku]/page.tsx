import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, StatusBadge } from "@/components/layout/page-header";
import { formatEUR, getProductDetail } from "@/lib/data/catalog";
import { Button } from "@/components/ui/button";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ sku: string }>;
}) {
  const { sku } = await params;
  const detail = await getProductDetail(sku);
  if (!detail) notFound();
  const { product, attributes, variants, optionGroups, sources } = detail;

  return (
    <div>
      <PageHeader
        title={product.name}
        description={`${product.sku} · ${product.brand_name || "ohne Marke"} · ${product.line_name || "ohne Linie"}`}
        actions={
          <>
            <Button variant="outline" render={<Link href="/produkte" />}>
              Zurück
            </Button>
            <Button render={<Link href={`/konfigurator?sku=${product.sku}`} />}>
              Konfigurieren
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <StatusBadge status={product.status} />
        {product.category ? (
          <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-600">
            {product.category}
          </span>
        ) : null}
      </div>

      <p className="mb-6 max-w-3xl text-sm text-slate-700">{product.description}</p>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-medium">Attribute</h2>
          <table className="w-full text-sm">
            <tbody>
              {attributes.map((a) => (
                <tr key={a.id} className="border-b border-slate-100">
                  <td className="py-2 pr-3 font-medium">{a.attr_name}</td>
                  <td className="py-2">
                    {a.value_number ?? a.value_text ?? String(a.value_boolean ?? "–")}
                    {a.unit ? ` ${a.unit}` : ""}
                  </td>
                  <td className="py-2 text-right text-xs text-slate-500">
                    {a.source_page ? `S. ${a.source_page}` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-medium">Varianten</h2>
          <ul className="space-y-2 text-sm">
            {variants.map((v) => (
              <li
                key={v.id}
                className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2"
              >
                <div>
                  <div className="font-medium">{v.sku}</div>
                  <div className="text-xs text-slate-500">{v.name}</div>
                </div>
                <StatusBadge status={v.status} />
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-medium">Optionen</h2>
          <div className="space-y-4">
            {optionGroups.map((g) => (
              <div key={g.id}>
                <div className="text-sm font-medium">
                  {g.name}
                  {g.required ? " *" : ""}
                </div>
                <ul className="mt-1 space-y-1 text-sm text-slate-700">
                  {(g.values as Array<{ code: string; name: string; price_cents: number }>).map(
                    (v) => (
                      <li key={v.code} className="flex justify-between">
                        <span>
                          {v.code} — {v.name}
                        </span>
                        <span className="tabular-nums">{formatEUR(v.price_cents)}</span>
                      </li>
                    ),
                  )}
                </ul>
              </div>
            ))}
            {optionGroups.length === 0 ? (
              <p className="text-sm text-slate-500">Keine Optionen.</p>
            ) : null}
          </div>
        </section>

        <section className="rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-medium">Quellen</h2>
          {sources.length === 0 ? (
            <p className="text-sm text-slate-500">Keine direkte Quelle verknüpft.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {sources.map((s) => (
                <li key={s.id} className="rounded-md border border-slate-100 p-3">
                  <div className="font-medium">
                    {s.document_title} · {s.version_label}
                  </div>
                  <div className="text-xs text-slate-500">
                    Seite {s.page}
                    {s.table_ref ? ` · Tabelle ${s.table_ref}` : ""}
                    {s.cell_ref ? ` · Zelle ${s.cell_ref}` : ""}
                  </div>
                  <p className="mt-2 text-slate-700">{s.excerpt}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

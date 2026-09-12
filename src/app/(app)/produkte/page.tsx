import Link from "next/link";
import { PageHeader, StatusBadge } from "@/components/layout/page-header";
import { formatEUR, listProducts } from "@/lib/data/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const products = await listProducts();
  const filtered = q
    ? products.filter(
        (p) =>
          p.sku.toLowerCase().includes(q.toLowerCase()) ||
          p.name.toLowerCase().includes(q.toLowerCase()),
      )
    : products;

  return (
    <div>
      <PageHeader
        title="Produkte"
        description="Freigegebener Produktkatalog mit Varianten, Attributen und Provenienz."
        actions={
          <Button variant="outline" render={<Link href="/api/export?type=products" />}>
            CSV exportieren
          </Button>
        }
      />

      <form className="mb-4">
        <Input
          name="q"
          defaultValue={q}
          placeholder="SKU oder Name suchen…"
          className="max-w-md bg-white"
        />
      </form>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Marke</th>
              <th className="px-4 py-3 font-medium">Linie</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Listenpreis</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                <td className="px-4 py-3">
                  <Link
                    href={`/produkte/${p.sku}`}
                    className="font-medium text-teal-900 hover:underline"
                  >
                    {p.sku}
                  </Link>
                </td>
                <td className="px-4 py-3">{p.name}</td>
                <td className="px-4 py-3 text-slate-600">{p.brand_name || "–"}</td>
                <td className="px-4 py-3 text-slate-600">{p.line_name || "–"}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={p.status} />
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatEUR(p.base_price_cents)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">
            Keine Produkte gefunden.
          </p>
        ) : null}
      </div>
    </div>
  );
}

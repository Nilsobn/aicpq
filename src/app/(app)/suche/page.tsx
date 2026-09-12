import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { searchAll } from "@/lib/data/catalog";
import { Input } from "@/components/ui/input";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const results = q.trim() ? await searchAll(q.trim()) : [];

  const hrefFor = (kind: string, id: string, sku: string) => {
    if (kind === "product") return `/produkte/${sku}`;
    if (kind === "rule") return `/regeln`;
    if (kind === "document") return `/dokumente`;
    return "#";
  };

  return (
    <div>
      <PageHeader
        title="Suche"
        description="Über Produkte, Attribute, Regeln und Dokumente hinweg."
      />
      <form className="mb-6">
        <Input
          name="q"
          defaultValue={q}
          placeholder="z. B. XP-120, Viton, IP65…"
          className="max-w-xl bg-white"
        />
      </form>
      <div className="space-y-2">
        {results.map((r) => (
          <Link
            key={`${r.kind}-${r.id}`}
            href={hrefFor(r.kind, r.id, r.sku)}
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm hover:border-teal-700/30"
          >
            <div>
              <div className="font-medium">
                {r.sku} — {r.name}
              </div>
            </div>
            <span className="text-xs uppercase tracking-wide text-slate-500">
              {r.kind}
            </span>
          </Link>
        ))}
        {q && results.length === 0 ? (
          <p className="rounded-xl border bg-white p-8 text-center text-sm text-slate-500">
            Keine Treffer für „{q}“.
          </p>
        ) : null}
        {!q ? (
          <p className="text-sm text-slate-500">
            Geben Sie einen Suchbegriff ein, um den freigegebenen Katalog zu durchsuchen.
          </p>
        ) : null}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader, StatusBadge } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatEUR } from "@/lib/data/catalog-client";

type CatalogPayload = {
  products: Array<{ id: string; sku: string; name: string }>;
  detail: {
    product: { id: string; sku: string; name: string };
    variants: Array<{ sku: string; name: string }>;
    optionGroups: Array<{
      id: string;
      code: string;
      name: string;
      required: boolean;
      values: Array<{
        code: string;
        name: string;
        description: string | null;
        price_cents: number;
      }>;
    }>;
    basePriceCents: number;
    optionPrices: Record<string, number>;
    rules: Array<{
      code: string;
      rule_type: string;
      severity: "error" | "warning" | "info";
      expression: Record<string, unknown>;
      explanation_template: string | null;
      source_excerpt?: string | null;
    }>;
  } | null;
};

export default function ConfiguratorPage() {
  const params = useSearchParams();
  const initialSku = params.get("sku") || "XP-120";
  const [sku, setSku] = useState(initialSku);
  const [data, setData] = useState<CatalogPayload | null>(null);
  const [variant, setVariant] = useState("");
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [media, setMedia] = useState("Wasser");
  const [temp, setTemp] = useState(40);
  const [name, setName] = useState("Neue Konfiguration");
  const [customer, setCustomer] = useState("");
  const [result, setResult] = useState<{
    valid: boolean;
    messages: Array<{ rule: string; severity: string; text: string }>;
    breakdown: { base: number; options: Array<{ code: string; cents: number }>; total: number };
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/configurator?sku=${encodeURIComponent(sku)}`)
      .then((r) => r.json())
      .then((payload: CatalogPayload) => {
        setData(payload);
        const firstVariant = payload.detail?.variants[0]?.sku || "";
        setVariant(firstVariant);
        const defaults: Record<string, string> = {};
        payload.detail?.optionGroups.forEach((g) => {
          if (g.values[0]) defaults[g.code] = g.values[0].code;
        });
        setSelected(defaults);
      });
  }, [sku]);

  const optionCodes = useMemo(() => Object.values(selected), [selected]);

  async function validate(save = false) {
    setSaving(save);
    setSaveMsg(null);
    const res = await fetch("/api/configurator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sku,
        selection: {
          variant,
          options: optionCodes,
          attrs: { media, media_temp_c: temp },
        },
        save,
        name,
        customerName: customer,
      }),
    });
    const json = await res.json();
    setResult(json);
    if (save) {
      setSaveMsg(json.savedId ? "Konfiguration gespeichert." : json.error || "Speichern fehlgeschlagen");
    }
    setSaving(false);
  }

  return (
    <div>
      <PageHeader
        title="Konfigurator"
        description="Geführte Auswahl mit Regelprüfung und Preisaufschlüsselung auf freigegebenen Daten."
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-5 rounded-xl border bg-white p-5 shadow-sm">
          <div className="space-y-2">
            <Label>Produkt</Label>
            <select
              className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
            >
              {(data?.products || [{ sku: "XP-120", name: "Kreiselpumpe XP-120", id: "1" }]).map(
                (p) => (
                  <option key={p.id} value={p.sku}>
                    {p.sku} — {p.name}
                  </option>
                ),
              )}
            </select>
          </div>

          {data?.detail?.variants?.length ? (
            <div className="space-y-2">
              <Label>Variante</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {data.detail.variants.map((v) => (
                  <button
                    key={v.sku}
                    type="button"
                    onClick={() => setVariant(v.sku)}
                    className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                      variant === v.sku
                        ? "border-teal-700 bg-teal-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="font-medium">{v.sku}</div>
                    <div className="text-xs text-slate-500">{v.name}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {data?.detail?.optionGroups?.map((g) => (
            <div key={g.id} className="space-y-2">
              <Label>
                {g.name}
                {g.required ? " *" : ""}
              </Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {g.values.map((v) => (
                  <button
                    key={v.code}
                    type="button"
                    onClick={() =>
                      setSelected((prev) => ({ ...prev, [g.code]: v.code }))
                    }
                    className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                      selected[g.code] === v.code
                        ? "border-teal-700 bg-teal-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{v.name}</span>
                      <span className="tabular-nums text-xs">
                        {formatEUR(v.price_cents)}
                      </span>
                    </div>
                    {v.description ? (
                      <div className="mt-1 text-xs text-slate-500">{v.description}</div>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Medium</Label>
              <select
                className="h-9 w-full rounded-lg border px-2.5 text-sm"
                value={media}
                onChange={(e) => setMedia(e.target.value)}
              >
                <option>Wasser</option>
                <option>Hydrauliköl</option>
                <option>Chemikalien</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Medientemperatur (°C)</Label>
              <Input
                type="number"
                value={temp}
                onChange={(e) => setTemp(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Bezeichnung</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Kunde</Label>
              <Input
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                placeholder="optional"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => validate(false)}>Regelprüfung</Button>
            <Button variant="outline" disabled={saving} onClick={() => validate(true)}>
              Speichern
            </Button>
          </div>
          {saveMsg ? <p className="text-sm text-teal-800">{saveMsg}</p> : null}
        </section>

        <aside className="space-y-4">
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-medium">Ergebnis</h2>
              {result ? (
                <StatusBadge status={result.valid ? "valid" : "invalid"} />
              ) : null}
            </div>
            {result ? (
              <>
                <div className="font-heading text-3xl font-semibold">
                  {formatEUR(result.breakdown.total)}
                </div>
                <ul className="mt-3 space-y-1 text-sm text-slate-600">
                  <li className="flex justify-between">
                    <span>Basis</span>
                    <span className="tabular-nums">{formatEUR(result.breakdown.base)}</span>
                  </li>
                  {result.breakdown.options.map((o) => (
                    <li key={o.code} className="flex justify-between">
                      <span>{o.code}</span>
                      <span className="tabular-nums">{formatEUR(o.cents)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 space-y-2">
                  {result.messages.length === 0 ? (
                    <p className="text-sm text-emerald-800">
                      Keine Regelverstöße — Konfiguration freigabefähig.
                    </p>
                  ) : (
                    result.messages.map((m) => (
                      <div
                        key={m.rule + m.text}
                        className={`rounded-md border px-3 py-2 text-sm ${
                          m.severity === "error"
                            ? "border-red-200 bg-red-50 text-red-900"
                            : "border-amber-200 bg-amber-50 text-amber-900"
                        }`}
                      >
                        <div className="font-medium">{m.rule}</div>
                        <div className="mt-0.5">{m.text}</div>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500">
                Auswahl prüfen, um Preis und Gültigkeit zu berechnen.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

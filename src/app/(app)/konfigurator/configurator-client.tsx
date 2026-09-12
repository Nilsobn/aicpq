"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader, StatusBadge } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatEUR } from "@/lib/data/catalog-client";

type OptionValue = {
  code: string;
  name: string;
  description: string | null;
  price_cents: number;
};

type OptionGroup = {
  id: string;
  code: string;
  name: string;
  required: boolean;
  values: OptionValue[];
};

type CatalogPayload = {
  products: Array<{ id: string; sku: string; name: string }>;
  detail: {
    product: { id: string; sku: string; name: string };
    variants: Array<{ sku: string; name: string }>;
    optionGroups: OptionGroup[];
    basePriceCents: number;
    optionPrices: Record<string, number>;
  } | null;
};

type EvalResult = {
  valid: boolean;
  messages: Array<{ rule: string; severity: string; text: string }>;
  breakdown: {
    base: number;
    options: Array<{ code: string; cents: number }>;
    total: number;
    currency?: string;
  };
  savedId?: string | null;
  error?: string;
};

export default function ConfiguratorClient() {
  const params = useSearchParams();
  const initialSku = params.get("sku") || "XP-120";

  const [sku, setSku] = useState(initialSku);
  const [data, setData] = useState<CatalogPayload | null>(null);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const [variant, setVariant] = useState("");
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [media, setMedia] = useState("Wasser");
  const [temp, setTemp] = useState(40);
  const [name, setName] = useState("Neue Konfiguration");
  const [customer, setCustomer] = useState("");

  const [result, setResult] = useState<EvalResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingCatalog(true);
    setCatalogError(null);
    setResult(null);

    fetch(`/api/configurator?sku=${encodeURIComponent(sku)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Katalogfehler (${res.status})`);
        return res.json() as Promise<CatalogPayload>;
      })
      .then((payload) => {
        if (cancelled) return;
        setData(payload);
        const firstVariant = payload.detail?.variants?.[0]?.sku || "";
        setVariant(firstVariant);
        const defaults: Record<string, string> = {};
        for (const g of payload.detail?.optionGroups || []) {
          if (g.values?.[0]?.code) defaults[g.code] = g.values[0].code;
        }
        setSelected(defaults);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setCatalogError(err instanceof Error ? err.message : "Katalog konnte nicht geladen werden");
      })
      .finally(() => {
        if (!cancelled) setLoadingCatalog(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sku]);

  const optionCodes = useMemo(() => Object.values(selected).filter(Boolean), [selected]);

  const runCheck = useCallback(
    async (save: boolean) => {
      setBusy(true);
      setActionError(null);
      setSaveMsg(null);
      try {
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
        const json = (await res.json()) as EvalResult;
        if (!res.ok) {
          throw new Error(json.error || `Prüfung fehlgeschlagen (${res.status})`);
        }
        if (!json.breakdown) {
          throw new Error("Ungültige API-Antwort: keine Preisaufschlüsselung");
        }
        setResult(json);
        if (save) {
          setSaveMsg(
            json.savedId
              ? "Konfiguration gespeichert."
              : json.error || "Speichern fehlgeschlagen",
          );
        }
      } catch (err: unknown) {
        setActionError(err instanceof Error ? err.message : "Unbekannter Fehler");
      } finally {
        setBusy(false);
      }
    },
    [sku, variant, optionCodes, media, temp, name, customer],
  );

  return (
    <div>
      <PageHeader
        title="Konfigurator"
        description="Geführte Auswahl mit Regelprüfung und Preisaufschlüsselung auf freigegebenen Daten."
      />

      {catalogError ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {catalogError}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-5 rounded-xl border bg-white p-5 shadow-sm">
          <div className="space-y-2">
            <Label htmlFor="product">Produkt</Label>
            <select
              id="product"
              className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              value={sku}
              disabled={loadingCatalog}
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
                {(g.values || []).map((v) => (
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
              <Label htmlFor="media">Medium</Label>
              <select
                id="media"
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
              <Label htmlFor="temp">Medientemperatur (°C)</Label>
              <Input
                id="temp"
                type="number"
                value={temp}
                onChange={(e) => setTemp(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cfg-name">Bezeichnung</Label>
              <Input
                id="cfg-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer">Kunde</Label>
              <Input
                id="customer"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                placeholder="optional"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              data-testid="configurator-check"
              disabled={busy}
              onClick={() => void runCheck(false)}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-slate-900 px-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:pointer-events-none disabled:opacity-50"
            >
              {busy ? "Prüft…" : "Regelprüfung"}
            </button>
            <button
              type="button"
              data-testid="configurator-save"
              disabled={busy}
              onClick={() => void runCheck(true)}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-50"
            >
              Speichern
            </button>
          </div>

          {actionError ? (
            <p className="text-sm text-red-700" role="alert">
              {actionError}
            </p>
          ) : null}
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
                    <span className="tabular-nums">
                      {formatEUR(result.breakdown.base)}
                    </span>
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
                        key={`${m.rule}-${m.text}`}
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

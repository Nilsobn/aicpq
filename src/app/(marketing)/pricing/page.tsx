import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getPool } from "@/lib/db";
import { formatEUR } from "@/lib/data/catalog";

export const dynamic = "force-dynamic";

type Plan = {
  id: string;
  name: string;
  description: string;
  price_monthly_cents: number;
  features: string[];
};

const FALLBACK_PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "Für kleine Produktteams",
    price_monthly_cents: 19900,
    features: ["1 Tenant", "5 Nutzer", "Assistent (begrenzt)", "CSV Export"],
  },
  {
    id: "professional",
    name: "Professional",
    description: "Standard für Mittelstand",
    price_monthly_cents: 59900,
    features: [
      "Unbegrenzte Produkte",
      "Regel-Engine",
      "KI-Prüfung",
      "Diffs & Versionierung",
      "Konfigurator",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Konzern & Multi-Werk",
    price_monthly_cents: 149900,
    features: [
      "SSO vorbereitet",
      "Custom Policies",
      "Audit Export",
      "Priority Support",
      "IONOS Self-Host",
    ],
  },
];

async function loadPlans(): Promise<Plan[]> {
  try {
    const pool = getPool();
    const { rows } = await pool.query<Plan>(
      `select * from plans where is_public = true order by sort_order`,
    );
    return rows.length > 0 ? rows : FALLBACK_PLANS;
  } catch {
    return FALLBACK_PLANS;
  }
}

export default async function PricingPage() {
  const plans = await loadPlans();

  return (
    <div className="min-h-screen bg-[#f4f6f8]">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          AICPQ
        </Link>
        <Button render={<Link href="/signup" />}>Kostenlos starten</Button>
      </header>
      <main className="mx-auto max-w-5xl px-6 pb-16">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Pläne für Produkt- und Vertriebsteams
        </h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Transparente Preise in EUR. Abrechnung monatlich, Datenverarbeitung in
          der EU.
        </p>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="text-sm font-medium text-teal-800">{plan.name}</div>
              <div className="mt-2 font-heading text-3xl font-semibold">
                {formatEUR(plan.price_monthly_cents)}
                <span className="text-sm font-normal text-slate-500"> / Monat</span>
              </div>
              <p className="mt-2 text-sm text-slate-600">{plan.description}</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                {(plan.features as string[]).map((f) => (
                  <li key={f}>· {f}</li>
                ))}
              </ul>
              <Button className="mt-6 w-full" render={<Link href="/signup" />}>
                {plan.id === "enterprise" ? "Kontakt" : "Auswählen"}
              </Button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

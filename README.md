# AICPQ — Product Intelligence SaaS

Strukturiertes Produktwissen, Regel-Engine und KI-Assistent für den industriellen Mittelstand (Maschinenbau, Automatisierung, Komponenten).

## Stack

- Next.js (App Router) + React + TypeScript + Tailwind + shadcn/ui
- Supabase (Auth, Postgres, Storage-ready, RLS Multi-Tenant, EU)
- Vercel AI SDK (Assistent nur auf freigegebenen Daten)
- `output: 'standalone'` für späteren IONOS-Node-Deploy

## Lokal starten

```bash
cp .env.example .env.local   # Secrets eintragen
npm install
node scripts/apply-migrations.js   # Schema + Seed (Pooler-URL)
npm run dev -- -p 43127 -H 127.0.0.1
```

App: [http://127.0.0.1:43127](http://127.0.0.1:43127)

### Demo-Login

- E-Mail: `demo@aicpq.de`
- Passwort: `AicpqDemo!2026`
- Tenant: NordWerk Fluidtechnik GmbH (Pumpen/Ventile/Motoren-Sample)

## Module

Dashboard, Assistent, Konfigurator, Produkte, Regeln, Dokumente, KI-Prüfung, Änderungen, Konfigurationen, Suche, Admin (Nutzer/Rollen/Org/Billing/Audit/Notifications), Landing/Login/Signup/Onboarding/Pricing.

## Sicherheit / Secrets

- Niemals API-Keys oder DB-Passwörter committen
- `.env.local` ist gitignored; `.env.example` enthält nur Platzhalter
- Wenn Secrets in Chats landeten: Keys rotieren

## IONOS

Build mit `npm run build` erzeugt `.next/standalone`. Dort Node starten (`node server.js`) hinter Reverse Proxy. Keine Vercel-only Runtime-Annahmen.

## OpenAI-Modell

`OPENAI_MODEL` default `gpt-5.6`. Die Chat-Route fällt bei Nichtverfügbarkeit auf `gpt-5.2` → `gpt-4.1` → `gpt-4o` zurück und setzt Header `x-aicpq-model`.

## English

AICPQ is a multi-tenant product-intelligence SaaS: structured catalog + rules with provenance, review queue before published truth, configurator, grounded AI assistant, German UI, EU-oriented Supabase setup, standalone Next.js for IONOS.

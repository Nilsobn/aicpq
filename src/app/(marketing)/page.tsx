import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Shield, Layers3, Scale } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0b1220] text-slate-100">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-0 h-[42rem] w-[42rem] rounded-full bg-[radial-gradient(circle,rgba(56,120,140,0.35),transparent_65%)] blur-2xl" />
        <div className="absolute right-0 top-24 h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(circle,rgba(180,140,70,0.18),transparent_60%)] blur-2xl" />
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #94a3b8 1px, transparent 1px), linear-gradient(to bottom, #94a3b8 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <div className="text-xl font-semibold tracking-tight">AICPQ</div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="text-slate-200 hover:bg-white/10 hover:text-white"
            render={<Link href="/login" />}
          >
            Anmelden
          </Button>
          <Button
            className="bg-teal-700 text-white hover:bg-teal-600"
            render={<Link href="/signup" />}
          >
            Kostenlos starten
          </Button>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid min-h-[78vh] w-full max-w-6xl items-center gap-10 px-6 pb-16 pt-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
            <div className="mb-4 text-sm font-medium uppercase tracking-[0.18em] text-teal-300/90">
              AICPQ
            </div>
            <h1 className="font-heading max-w-xl text-4xl leading-[1.1] font-semibold tracking-tight text-white sm:text-5xl">
              Produktwissen, das Verkauf und Technik verbindet.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-300">
              Strukturierter Katalog, freigegebene Regeln und ein Assistent, der
              nur auf freigegebene Fakten antwortet — für Maschinenbau und
              Komponentenhersteller.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                size="lg"
                className="bg-teal-700 text-white hover:bg-teal-600"
                render={<Link href="/signup" />}
              >
                Demo anlegen
                <ArrowRight className="size-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-slate-600 bg-transparent text-slate-100 hover:bg-white/10"
                render={<Link href="/pricing" />}
              >
                Pläne ansehen
              </Button>
            </div>
            <p className="mt-4 text-xs text-slate-400">
              Demo-Zugang: demo@aicpq.de · AicpqDemo!2026 · Datenregion EU
            </p>
          </div>

          <div className="relative animate-in fade-in slide-in-from-right-4 duration-1000">
            <div className="overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-800/40 p-5 shadow-2xl backdrop-blur">
              <div className="mb-4 flex items-center justify-between text-xs text-slate-400">
                <span>Freigegebene Wahrheit</span>
                <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-emerald-300">
                  EU · RLS
                </span>
              </div>
              <div className="space-y-3 text-sm">
                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <div className="text-slate-400">XP-120 · Kreiselpumpe</div>
                  <div className="mt-1 font-medium text-white">
                    4.850,00 € · Quelle: Preisliste Q1/2026, S. 8
                  </div>
                </div>
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                  <div className="text-amber-200">Regel R-IP65-FLANGE</div>
                  <div className="mt-1 text-slate-200">
                    IP65 nur mit Flanschanschluss — Katalog 2026.2, S. 88
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <div className="text-slate-400">Konfiguration gültig</div>
                  <div className="mt-1 text-white">
                    NBR + Gewinde · ohne Regelverstoß
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-white/10 bg-[#0e1624]/80">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 py-16 md:grid-cols-3">
            {[
              {
                icon: Layers3,
                title: "Struktur vor Chat",
                text: "Produkte, Attribute, Preise und Regeln mit Provenienz — nicht PDF-Chat.",
              },
              {
                icon: Scale,
                title: "Regel-Engine",
                text: "Requires, Excludes und Kompatibilität mit nachvollziehbaren Quellen.",
              },
              {
                icon: Shield,
                title: "DSGVO-bewusst",
                text: "Multi-Tenant mit RLS, EU-Datenregion als Default, Audit-Trail.",
              },
            ].map((f) => (
              <div key={f.title} className="space-y-3">
                <f.icon className="size-5 text-teal-300" />
                <h2 className="font-heading text-xl text-white">{f.title}</h2>
                <p className="text-sm leading-relaxed text-slate-400">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="font-heading text-2xl text-white">Was enthalten ist</h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              "Dashboard mit Datenqualität & offenen Prüfungen",
              "Assistent nur auf freigegebenen Datensätzen",
              "Geführter Konfigurator mit Preisaufschlüsselung",
              "KI-Extraktion mit Freigabe-Warteschlange",
              "Dokument-/Preislisten-Diffs",
              "Admin: Nutzer, Rollen, Billing, Audit",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-slate-300">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-teal-400" />
                {item}
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/10 px-6 py-8 text-center text-xs text-slate-500">
        AICPQ · Product Intelligence SaaS · Deutsch · EU
      </footer>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function OnboardingPage() {
  const router = useRouter();
  const [orgName, setOrgName] = useState("");
  const [industry, setIndustry] = useState("Maschinenbau");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgName, industry }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Onboarding fehlgeschlagen");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4">
      <h1 className="font-heading text-3xl font-semibold">Organisation einrichten</h1>
      <p className="mt-2 text-slate-600">
        Legen Sie Ihren Tenant an. Produkte und Regeln bleiben strikt getrennt.
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-xl border bg-white p-6 shadow-sm">
        <div className="space-y-2">
          <Label htmlFor="org">Firmenname</Label>
          <Input
            id="org"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder="NordWerk Fluidtechnik GmbH"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="industry">Branche</Label>
          <Input
            id="industry"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
          />
        </div>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Wird eingerichtet…" : "Zum Dashboard"}
        </Button>
      </form>
    </div>
  );
}

import { PageHeader, StatusBadge } from "@/components/layout/page-header";
import { formatEUR, getOrgAdmin } from "@/lib/data/catalog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default async function AdminPage() {
  const data = await getOrgAdmin();
  const org = data.organization;

  return (
    <div>
      <PageHeader
        title="Admin"
        description="Nutzer, Rollen, Organisation, Abrechnung, Audit und Benachrichtigungen."
      />

      <Tabs defaultValue="users">
        <TabsList className="mb-4 flex h-auto flex-wrap gap-1 bg-white p-1">
          <TabsTrigger value="users">Nutzer & Rollen</TabsTrigger>
          <TabsTrigger value="org">Organisation</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
          <TabsTrigger value="notifications">Benachrichtigungen</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="rounded-xl border bg-white p-4 shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2 font-medium">Name</th>
                <th className="py-2 font-medium">E-Mail</th>
                <th className="py-2 font-medium">Rolle</th>
                <th className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.members.map((m) => (
                <tr key={m.id} className="border-b border-slate-100">
                  <td className="py-2.5">{m.full_name}</td>
                  <td className="py-2.5">{m.email}</td>
                  <td className="py-2.5">{m.role}</td>
                  <td className="py-2.5">
                    <StatusBadge status={m.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TabsContent>

        <TabsContent value="org" className="rounded-xl border bg-white p-4 shadow-sm">
          <dl className="grid gap-4 sm:grid-cols-2 text-sm">
            <div>
              <dt className="text-xs text-slate-500">Name</dt>
              <dd className="font-medium">{org.name}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Slug</dt>
              <dd className="font-medium">{org.slug}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Land / Währung</dt>
              <dd className="font-medium">
                {org.country_code} / {org.currency_code}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Datenregion</dt>
              <dd className="font-medium">{org.data_region}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Locale</dt>
              <dd className="font-medium">{org.locale}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Plan</dt>
              <dd className="font-medium">{org.plan_id}</dd>
            </div>
          </dl>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-medium">Aktueller Plan</h2>
                <p className="text-sm text-slate-600">
                  Status: <StatusBadge status={org.billing_status} />
                </p>
              </div>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {data.plans.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-xl border p-4 shadow-sm ${
                  plan.id === org.plan_id
                    ? "border-teal-700/40 bg-teal-50/40"
                    : "bg-white"
                }`}
              >
                <div className="font-medium">{plan.name}</div>
                <div className="mt-1 font-heading text-2xl">
                  {formatEUR(plan.price_monthly_cents)}
                </div>
                <p className="mt-2 text-sm text-slate-600">{plan.description}</p>
                <ul className="mt-3 space-y-1 text-xs text-slate-600">
                  {(plan.features as string[]).map((f) => (
                    <li key={f}>· {f}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="audit" className="rounded-xl border bg-white p-4 shadow-sm">
          <ul className="divide-y text-sm">
            {data.audits.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-3 py-3">
                <div>
                  <div className="font-medium">{a.action}</div>
                  <div className="text-xs text-slate-500">
                    {a.entity_type || "–"} ·{" "}
                    {JSON.stringify(a.metadata)}
                  </div>
                </div>
                <div className="shrink-0 text-xs text-slate-500">
                  {new Date(a.created_at).toLocaleString("de-DE")}
                </div>
              </li>
            ))}
          </ul>
        </TabsContent>

        <TabsContent
          value="notifications"
          className="rounded-xl border bg-white p-4 shadow-sm"
        >
          <div className="mb-6 space-y-4">
            {[
              ["E-Mail bei KI-Prüfungen", data.settings?.email_reviews],
              ["E-Mail bei Änderungen", data.settings?.email_changes],
              ["E-Mail Billing", data.settings?.email_billing],
              ["In-App Prüfungen", data.settings?.inapp_reviews],
            ].map(([label, on]) => (
              <div key={String(label)} className="flex items-center justify-between">
                <Label>{label as string}</Label>
                <Switch checked={Boolean(on)} disabled />
              </div>
            ))}
          </div>
          <h3 className="mb-2 font-medium">Letzte Hinweise</h3>
          <ul className="divide-y text-sm">
            {data.notifications.map((n) => (
              <li key={n.id} className="py-3">
                <div className="font-medium">{n.title}</div>
                <div className="text-slate-600">{n.body}</div>
              </li>
            ))}
          </ul>
        </TabsContent>
      </Tabs>
    </div>
  );
}

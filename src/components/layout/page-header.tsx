import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusMap: Record<string, { label: string; className: string }> = {
  approved: { label: "Freigegeben", className: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  draft: { label: "Entwurf", className: "bg-slate-50 text-slate-700 border-slate-200" },
  in_review: { label: "In Prüfung", className: "bg-amber-50 text-amber-800 border-amber-200" },
  pending: { label: "Offen", className: "bg-amber-50 text-amber-800 border-amber-200" },
  needs_info: { label: "Rückfrage", className: "bg-orange-50 text-orange-800 border-orange-200" },
  rejected: { label: "Abgelehnt", className: "bg-red-50 text-red-800 border-red-200" },
  valid: { label: "Gültig", className: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  invalid: { label: "Ungültig", className: "bg-red-50 text-red-800 border-red-200" },
  open: { label: "Offen", className: "bg-sky-50 text-sky-800 border-sky-200" },
  active: { label: "Aktiv", className: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  trialing: { label: "Testphase", className: "bg-sky-50 text-sky-800 border-sky-200" },
};

export function StatusBadge({ status }: { status: string }) {
  const meta = statusMap[status] || {
    label: status,
    className: "bg-slate-50 text-slate-700 border-slate-200",
  };
  return (
    <Badge variant="outline" className={cn("font-normal", meta.className)}>
      {meta.label}
    </Badge>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-slate-900">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-slate-600">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

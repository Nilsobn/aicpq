"use client";

import { useEffect, useState, useTransition } from "react";
import { PageHeader, StatusBadge } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Review = {
  id: string;
  entity_type: string;
  status: string;
  confidence: number | null;
  proposed_payload: Record<string, unknown>;
  document_title?: string;
  version_label?: string;
  page?: number;
  excerpt?: string;
  reviewer_notes?: string | null;
};

export default function ReviewPage() {
  const [items, setItems] = useState<Review[]>([]);
  const [pending, startTransition] = useTransition();
  const [notes, setNotes] = useState<Record<string, string>>({});

  function load() {
    startTransition(async () => {
      const res = await fetch("/api/reviews");
      const data = await res.json();
      setItems(data.items || []);
    });
  }

  useEffect(() => {
    load();
  }, []);

  async function act(id: string, status: "approved" | "rejected" | "needs_info") {
    await fetch("/api/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, notes: notes[id] || "" }),
    });
    load();
  }

  return (
    <div>
      <PageHeader
        title="KI-Prüfung"
        description="Extraktionen werden erst nach Freigabe zur Produktwahrheit. Der Assistent nutzt nur approved-Daten."
      />
      <div className="space-y-4">
        {items.map((item) => (
          <article
            key={item.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-medium capitalize">{item.entity_type}</h2>
                <p className="text-xs text-slate-500">
                  {item.document_title} · {item.version_label}
                  {item.page ? ` · S. ${item.page}` : ""} · Konfidenz{" "}
                  {item.confidence
                    ? `${Math.round(Number(item.confidence) * 100)}%`
                    : "–"}
                </p>
              </div>
              <StatusBadge status={item.status} />
            </div>
            <pre className="mt-3 overflow-x-auto rounded-md bg-slate-50 p-3 text-xs text-slate-800">
              {JSON.stringify(item.proposed_payload, null, 2)}
            </pre>
            {item.excerpt ? (
              <p className="mt-2 text-sm text-slate-600">Quelle: {item.excerpt}</p>
            ) : null}
            <Textarea
              className="mt-3"
              placeholder="Prüfnotiz…"
              value={notes[item.id] || ""}
              onChange={(e) =>
                setNotes((prev) => ({ ...prev, [item.id]: e.target.value }))
              }
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                disabled={pending || item.status === "approved"}
                onClick={() => act(item.id, "approved")}
              >
                Freigeben
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => act(item.id, "needs_info")}
              >
                Rückfrage
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={pending}
                onClick={() => act(item.id, "rejected")}
              >
                Ablehnen
              </Button>
            </div>
          </article>
        ))}
        {!pending && items.length === 0 ? (
          <p className="rounded-xl border bg-white p-8 text-center text-sm text-slate-500">
            Keine Extraktionen in der Warteschlange.
          </p>
        ) : null}
      </div>
    </div>
  );
}

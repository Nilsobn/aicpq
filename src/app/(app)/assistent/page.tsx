"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const suggestions = [
  "Ist XP-120 mit WV-43-10 kompatibel?",
  "Welche Dichtung brauche ich bei 95 °C?",
  "Darf ich IP65 mit Gewindeanschluss wählen?",
  "Listenpreis XP-120 inkl. Viton?",
];

export default function AssistantPage() {
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);
  const { messages, sendMessage, status, error } = useChat({ transport });
  const [input, setInput] = useState("");
  const busy = status === "submitted" || status === "streaming";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    await sendMessage({ text });
  }

  return (
    <div className="flex h-[calc(100vh-5.5rem)] flex-col">
      <PageHeader
        title="Assistent"
        description="Antwortet nur auf freigegebene Produkte, Attribute, Preise und Regeln — ohne Spekulation."
      />

      <div className="mb-3 flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 hover:border-teal-700/40"
            onClick={() => setInput(s)}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
              Stellen Sie eine konkrete Frage zu SKU, Kompatibilität oder Regeln.
              Der Assistent erfindet keine Freigaben gegen die Regelbasis.
            </div>
          ) : null}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-3xl rounded-lg px-3 py-2 text-sm ${
                m.role === "user"
                  ? "ml-auto bg-slate-900 text-white"
                  : "bg-slate-50 text-slate-800"
              }`}
            >
              {m.parts?.map((part, i) =>
                part.type === "text" ? <p key={i}>{part.text}</p> : null,
              )}
            </div>
          ))}
          {error ? (
            <p className="text-sm text-red-700">Fehler: {error.message}</p>
          ) : null}
        </div>
        <form onSubmit={onSubmit} className="border-t p-3">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Frage zum freigegebenen Katalog…"
            rows={3}
          />
          <div className="mt-2 flex justify-end">
            <Button type="submit" disabled={busy || !input.trim()}>
              {busy ? "Antwortet…" : "Senden"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

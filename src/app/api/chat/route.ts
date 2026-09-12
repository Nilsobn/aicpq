import { openai } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
  UIMessage,
} from "ai";
import { z } from "zod";
import { getApprovedKnowledge, listRules, getProductDetail } from "@/lib/data/catalog";
import { evaluateConfiguration } from "@/lib/rules/engine";

export const maxDuration = 60;

const MODEL_CANDIDATES = [
  process.env.OPENAI_MODEL || "gpt-5.6",
  "gpt-5.2",
  "gpt-4.1",
  "gpt-4o",
];

export async function POST(req: Request) {
  const body = await req.json();
  const messages = body.messages as UIMessage[];
  const knowledge = await getApprovedKnowledge();

  const system = `Du bist der AICPQ Product-Intelligence Assistent für den deutschen Mittelstand.
Antworte auf Deutsch, präzise und professionell.
Du darfst NUR freigegebene (approved) strukturierte Produktdaten, Attribute und Regeln verwenden.
Erfinde keine Kompatibilität, Preise oder technischen Werte.
Wenn etwas nicht in den freigegebenen Daten steht, sage das klar und verweise auf KI-Prüfung / Quellen.
Bei Regelkonflikten zitiere Regelcode und Quelle.
Freigegebene Produkte: ${JSON.stringify(knowledge.products)}
Freigegebene Attribute: ${JSON.stringify(knowledge.attributes)}
Freigegebene Regeln: ${JSON.stringify(knowledge.rules)}`;

  const tools = {
    lookupProduct: tool({
      description: "Freigegebenes Produkt inkl. Attribute/Optionen laden",
      inputSchema: z.object({ sku: z.string() }),
      execute: async ({ sku }) => {
        const detail = await getProductDetail(sku);
        if (!detail || detail.product.status !== "approved") {
          return { found: false, note: "Kein freigegebenes Produkt." };
        }
        return {
          found: true,
          product: {
            sku: detail.product.sku,
            name: detail.product.name,
            description: detail.product.description,
            attributes: detail.attributes,
            options: detail.optionGroups,
            prices: detail.prices,
            sources: detail.sources,
          },
        };
      },
    }),
    checkCompatibility: tool({
      description: "Regeln gegen eine Auswahl prüfen",
      inputSchema: z.object({
        sku: z.string(),
        options: z.array(z.string()).default([]),
        media: z.string().optional(),
        media_temp_c: z.number().optional(),
      }),
      execute: async ({ sku, options, media, media_temp_c }) => {
        const detail = await getProductDetail(sku);
        if (!detail) return { ok: false, error: "Produkt unbekannt" };
        const rules = (await listRules())
          .filter((r) => r.status === "approved")
          .map((r) => ({
            code: r.code,
            rule_type: r.rule_type,
            severity: r.severity,
            expression: r.expression,
            explanation_template: r.explanation_template,
            source_excerpt: r.source_excerpt,
          }));
        const optionPrices: Record<string, number> = {};
        for (const g of detail.optionGroups) {
          for (const v of g.values as Array<{ code: string; price_cents: number }>) {
            optionPrices[v.code] = v.price_cents;
          }
        }
        const base =
          detail.prices.find((p) => p.product_id === detail.product.id)
            ?.amount_cents ?? 0;
        return evaluateConfiguration({
          selection: {
            options,
            attrs: {
              ...(media ? { media } : {}),
              ...(media_temp_c != null ? { media_temp_c } : {}),
            },
          },
          rules,
          basePriceCents: base,
          optionPrices,
        });
      },
    }),
    listApprovedRules: tool({
      description: "Alle freigegebenen Regeln auflisten",
      inputSchema: z.object({}),
      execute: async () => {
        return (await listRules()).filter((r) => r.status === "approved");
      },
    }),
  };

  let lastError: unknown;
  for (const modelId of MODEL_CANDIDATES) {
    try {
      const result = streamText({
        model: openai(modelId),
        system,
        messages: await convertToModelMessages(messages),
        tools,
        stopWhen: stepCountIs(4),
      });
      return result.toUIMessageStreamResponse({
        headers: { "x-aicpq-model": modelId },
      });
    } catch (e) {
      lastError = e;
      const msg = e instanceof Error ? e.message : String(e);
      if (/model|not found|invalid/i.test(msg)) continue;
      break;
    }
  }

  return new Response(
    JSON.stringify({
      error:
        lastError instanceof Error
          ? lastError.message
          : "Kein verfügbares OpenAI-Modell",
    }),
    { status: 502, headers: { "Content-Type": "application/json" } },
  );
}

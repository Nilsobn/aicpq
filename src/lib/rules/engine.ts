import type {
  ConfigurationSelection,
  PriceBreakdown,
  ValidityMessage,
} from "@/lib/types";

type RuleRow = {
  code: string;
  rule_type: string;
  severity: "error" | "warning" | "info";
  expression: Record<string, unknown>;
  explanation_template: string | null;
  source_excerpt?: string | null;
};

function explain(rule: RuleRow) {
  const tpl =
    rule.explanation_template ||
    `${rule.code}: Regel verletzt (${rule.rule_type}).`;
  return tpl.replace("{source}", rule.source_excerpt || "freigegebene Quelle");
}

export function evaluateConfiguration(input: {
  selection: ConfigurationSelection;
  rules: RuleRow[];
  basePriceCents: number;
  optionPrices: Record<string, number>;
  currency?: string;
}): {
  valid: boolean;
  messages: ValidityMessage[];
  breakdown: PriceBreakdown;
} {
  const messages: ValidityMessage[] = [];
  const options = new Set(input.selection.options || []);
  const attrs = input.selection.attrs || {};

  for (const rule of input.rules) {
    if (rule.rule_type === "requires") {
      const expr = rule.expression as {
        if?: { option?: string; attr?: string; op?: string; value?: unknown };
        then?: { requires_option?: string };
      };
      let condition = false;
      if (expr.if?.option && options.has(expr.if.option)) condition = true;
      if (expr.if?.attr) {
        const current = attrs[expr.if.attr];
        if (expr.if.op === ">" && Number(current) > Number(expr.if.value))
          condition = true;
        if (expr.if.op === "=" && String(current) === String(expr.if.value))
          condition = true;
      }
      const required = expr.then?.requires_option;
      if (condition && required && !options.has(required)) {
        messages.push({
          rule: rule.code,
          severity: rule.severity,
          text: explain(rule),
          source: rule.source_excerpt,
        });
      }
    }

    if (rule.rule_type === "excludes") {
      const expr = rule.expression as {
        if?: { attr?: string; op?: string; value?: unknown };
        then?: { excludes_option?: string };
      };
      let condition = false;
      if (expr.if?.attr) {
        const current = attrs[expr.if.attr];
        if (expr.if.op === "=" && String(current) === String(expr.if.value))
          condition = true;
      }
      const excluded = expr.then?.excludes_option;
      if (condition && excluded && options.has(excluded)) {
        messages.push({
          rule: rule.code,
          severity: rule.severity,
          text: explain(rule),
          source: rule.source_excerpt,
        });
      }
    }
  }

  const optionLines = [...options].map((code) => ({
    code,
    cents: input.optionPrices[code] ?? 0,
  }));
  const total =
    input.basePriceCents + optionLines.reduce((s, o) => s + o.cents, 0);

  return {
    valid: !messages.some((m) => m.severity === "error"),
    messages,
    breakdown: {
      base: input.basePriceCents,
      options: optionLines,
      total,
      currency: input.currency || "EUR",
    },
  };
}

import { NextResponse } from "next/server";
import {
  getProductDetail,
  listProducts,
  listRules,
} from "@/lib/data/catalog";
import { evaluateConfiguration } from "@/lib/rules/engine";
import { DEMO_ORG_ID, getPool } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sku = searchParams.get("sku") || "XP-120";
  const products = await listProducts();
  const detailRaw = await getProductDetail(sku);
  const rules = (await listRules()).filter((r) => r.status === "approved");

  if (!detailRaw) {
    return NextResponse.json({ products, detail: null });
  }

  const optionPrices: Record<string, number> = {};
  for (const g of detailRaw.optionGroups) {
    for (const v of g.values as Array<{ code: string; price_cents: number }>) {
      optionPrices[v.code] = v.price_cents;
    }
  }

  const basePrice =
    detailRaw.prices.find((p) => p.product_id === detailRaw.product.id)
      ?.amount_cents ?? 0;

  return NextResponse.json({
    products: products.map((p) => ({ id: p.id, sku: p.sku, name: p.name })),
    detail: {
      product: detailRaw.product,
      variants: detailRaw.variants,
      optionGroups: detailRaw.optionGroups,
      basePriceCents: basePrice,
      optionPrices,
      rules,
    },
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  const sku = String(body.sku || "XP-120");
  const detail = await getProductDetail(sku);
  if (!detail) {
    return NextResponse.json({ error: "Produkt nicht gefunden" }, { status: 404 });
  }

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
  const basePrice =
    detail.prices.find((p) => p.product_id === detail.product.id)?.amount_cents ??
    0;

  const selection = body.selection ?? {
    variant: body.variant,
    options: body.options ?? [],
    attrs: body.attrs ?? {},
  };

  const evaluated = evaluateConfiguration({
    selection,
    rules,
    basePriceCents: basePrice,
    optionPrices,
  });

  let savedId: string | null = null;
  if (body.save) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const pool = getPool();
    const insert = await pool.query(
      `insert into configurations (
         organization_id, product_id, name, customer_name, status, selection,
         price_breakdown, validity, total_cents, currency_code, created_by
       ) values ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8::jsonb,$9,'EUR',$10)
       returning id`,
      [
        DEMO_ORG_ID,
        detail.product.id,
        body.name || `Konfiguration ${sku}`,
        body.customerName || null,
        evaluated.valid ? "valid" : "invalid",
        JSON.stringify(selection),
        JSON.stringify(evaluated.breakdown),
        JSON.stringify({ ok: evaluated.valid, messages: evaluated.messages }),
        evaluated.breakdown.total,
        user?.id || null,
      ],
    );
    savedId = insert.rows[0].id;
  }

  return NextResponse.json({ ...evaluated, savedId });
}

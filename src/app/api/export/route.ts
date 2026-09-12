import { NextResponse } from "next/server";
import { listProducts, listRules } from "@/lib/data/catalog";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "products";

  if (type === "rules") {
    const rules = await listRules();
    const header = "code,name,rule_type,severity,status,description\n";
    const rows = rules
      .map((r) =>
        [r.code, r.name, r.rule_type, r.severity, r.status, JSON.stringify(r.description || "")]
          .join(","),
      )
      .join("\n");
    return new NextResponse(header + rows, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="aicpq-regeln.csv"',
      },
    });
  }

  const products = await listProducts();
  const header = "sku,name,status,brand,line,price_cents\n";
  const rows = products
    .map((p) =>
      [
        p.sku,
        JSON.stringify(p.name),
        p.status,
        JSON.stringify(p.brand_name || ""),
        JSON.stringify(p.line_name || ""),
        p.base_price_cents ?? "",
      ].join(","),
    )
    .join("\n");

  return new NextResponse(header + rows, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="aicpq-produkte.csv"',
    },
  });
}

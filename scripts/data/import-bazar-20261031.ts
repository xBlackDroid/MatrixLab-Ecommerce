import { readFileSync } from "node:fs";
import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { emptyBazar, type Bazar, type Item } from "../../src/lib/bazar/domain";

const schema = z.object({ date: z.iso.date(), items: z.array(z.object({ id: z.uuid(), name: z.string(), sku: z.string(), category: z.string(), quantity: z.number().int().min(0).nullable(), priceCents: z.number().int().min(0), bundle: z.object({ quantity: z.number().int().positive(), totalCents: z.number().int().min(0) }).optional() })) });
async function main() {
  loadEnvConfig(process.cwd());
  const source = schema.parse(JSON.parse(readFileSync("scripts/data/bazar-20261031.json", "utf8")));
  const url = (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/[\u0009-\u000d\u0020\u00a0\u200b-\u200f\u2028\u2029\u2060\ufeff]/g, "").replace(/\/+$/, "").replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/, "");
  if (new URL(url).hostname !== "spgrjhlwmyjfwiwsqgvn.supabase.co") throw new Error("Unexpected database target");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing server credential");
  const db = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error: initError } = await db.from("bazar_days").upsert({ date: source.date, document: emptyBazar(), version: 0 }, { onConflict: "date", ignoreDuplicates: true });
  if (initError) throw new Error(initError.message);
  for (let attempt = 0; attempt < 6; attempt++) {
    const { data, error } = await db.from("bazar_days").select("document,version").eq("date", source.date).single();
    if (error) throw new Error(error.message);
    const current = data.document as Bazar;
    const additions: Item[] = source.items.filter(row => !current.items.some(i => i.id === row.id || i.sku === row.sku)).map(({ quantity, ...row }) => ({ ...row, brought: quantity ?? 0, stock: quantity ?? 0, stockTracked: quantity !== null }));
    if (!additions.length) { console.log("Inventory already imported; no stock or sales changed."); return; }
    const next = { ...current, items: [...current.items, ...additions] };
    const { data: saved, error: writeError } = await db.from("bazar_days").update({ document: next, version: data.version + 1, updated_at: new Date().toISOString() }).eq("date", source.date).eq("version", data.version).select("version").maybeSingle();
    if (writeError) throw new Error(writeError.message);
    if (saved) { console.log(JSON.stringify({ date: source.date, added: additions.length, knownPieces: additions.filter(i => i.stockTracked).reduce((sum, i) => sum + i.stock, 0), pendingCounts: additions.filter(i => !i.stockTracked).length, preservedSales: current.sales.length, version: saved.version })); return; }
  }
  throw new Error("Concurrent update: retry import. Existing inventory is preserved.");
}
main().catch(e => { console.error(e instanceof Error ? e.message : "Import failed"); process.exitCode = 1; });

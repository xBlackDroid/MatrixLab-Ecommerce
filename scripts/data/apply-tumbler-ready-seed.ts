/**
 * Aplica `supabase/seed_tumbler_ready.sql` sobre Supabase usando la service
 * role key, para entornos donde no hay acceso directo por `psql`.
 *
 * El SQL sigue siendo la fuente de verdad: de ahí se leen los UUID fijos y los
 * valores de cada fila, y antes de escribir se comprueban contra el catálogo
 * generado (`src/lib/store/tumbler-ready.ts`). Si el SQL y el catálogo no
 * coinciden, el script falla en vez de sembrar datos comerciales distintos a
 * los publicados en la vitrina.
 *
 * Es idempotente: cada producto se busca por `handle` y cada variante por
 * `sku`; si existen se actualizan sin tocar su id, y si no, se insertan con el
 * id fijo del SQL. Correrlo dos veces deja exactamente el mismo estado.
 *
 * Uso: npx tsx scripts/data/apply-tumbler-ready-seed.ts [--dry-run]
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { READY_TUMBLERS } from "../../src/lib/store/tumbler-ready";

const ROOT = join(__dirname, "..", "..");
const SEED_PATH = join(ROOT, "supabase", "seed_tumbler_ready.sql");
const DRY_RUN = process.argv.includes("--dry-run");

interface SeedRow {
  productId: string;
  variantId: string;
  code: string;
  name: string;
  handle: string;
  sku: string;
  description: string;
  price: number;
  stock: number;
}

/** Lee las credenciales del `.env.local` sin depender del runtime de Next. */
function readEnv(): { url: string; serviceRoleKey: string } {
  const raw = readFileSync(join(ROOT, ".env.local"), "utf8");
  const env: Record<string, string> = {};
  for (const line of raw.split(/\r?\n/)) {
    const eq = line.indexOf("=");
    if (eq < 0 || line.trimStart().startsWith("#")) continue;
    env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  }
  const url = env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !serviceRoleKey) {
    throw new Error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  }
  // SUPABASE_URL puede venir con el sufijo REST (`/rest/v1/`); supabase-js
  // espera la URL base del proyecto.
  return { url: new URL(url).origin, serviceRoleKey };
}

/** Extrae una fila del bloque `values` del seed, por código. */
function parseSeedRow(sql: string, code: string): SeedRow {
  const uuid = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
  const pattern = new RegExp(
    `\\(\\s*'(${uuid})'::uuid,\\s*'(${uuid})'::uuid,\\s*'${code}',` +
      `\\s*'([^']*)',\\s*'([^']*)',\\s*'([^']*)',\\s*'([^']*)',` +
      `\\s*([0-9.]+)::numeric,\\s*([0-9]+)::int`,
  );
  const match = sql.match(pattern);
  if (!match) throw new Error(`El seed no contiene una fila válida para ${code}`);
  return {
    productId: match[1],
    variantId: match[2],
    code,
    name: match[3],
    handle: match[4],
    sku: match[5],
    description: match[6],
    price: Number(match[7]),
    stock: Number(match[8]),
  };
}

async function main() {
  const sql = readFileSync(SEED_PATH, "utf8");
  const rows = READY_TUMBLERS.map((item) => {
    const row = parseSeedRow(sql, item.code);
    // El seed y la vitrina deben publicar exactamente lo mismo.
    const mismatches: string[] = [];
    if (row.name !== item.name) mismatches.push(`nombre (${row.name} ≠ ${item.name})`);
    if (row.description !== item.description) mismatches.push("descripción");
    if (item.price !== null && row.price !== item.price) {
      mismatches.push(`precio (${row.price} ≠ ${item.price})`);
    }
    if (item.inventory !== null && row.stock !== item.inventory) {
      mismatches.push(`stock (${row.stock} ≠ ${item.inventory})`);
    }
    if (mismatches.length) {
      throw new Error(
        `${item.code}: el seed no coincide con el catálogo en ${mismatches.join(", ")}`,
      );
    }
    return row;
  });

  const { url, serviceRoleKey } = readEnv();
  const db = createClient(url, serviceRoleKey, { auth: { persistSession: false } });

  const { data: category, error: categoryError } = await db
    .from("categories")
    .select("id")
    .eq("handle", "snowglobe")
    .maybeSingle();
  if (categoryError) throw new Error(`No se pudo leer categories: ${categoryError.message}`);
  if (!category) {
    throw new Error("Falta la categoría snowglobe. Ejecuta supabase/seed_etapa2.sql primero.");
  }

  for (const row of rows) {
    const status = row.stock > 0 ? "disponible" : "agotado";
    const productFields = {
      category_id: category.id,
      title: row.name,
      handle: row.handle,
      description: row.description,
      base_price: row.price,
      status,
      is_customizable: false,
      min_quantity: 1,
      max_quantity: Math.max(row.stock, 1),
      tags: ["vasos-listos", "vasos", "matrixlab-tumbler"],
    };

    const { data: existingProduct } = await db
      .from("products")
      .select("id")
      .eq("handle", row.handle)
      .maybeSingle();

    if (DRY_RUN) {
      console.log(`${row.code}: ${existingProduct ? "actualizaría" : "insertaría"} ${row.handle}`);
      continue;
    }

    // El id nunca se reescribe: si la fila ya existe se respeta su id real.
    const productId = existingProduct?.id ?? row.productId;
    const { error: productError } = existingProduct
      ? await db.from("products").update(productFields).eq("id", existingProduct.id)
      : await db.from("products").insert({ id: row.productId, ...productFields });
    if (productError) throw new Error(`${row.code} producto: ${productError.message}`);

    const variantFields = {
      product_id: productId,
      title: "Pieza",
      sku: row.sku,
      price: row.price,
      stock: row.stock,
      option_label: "Pieza",
      status,
    };
    const { data: existingVariant } = await db
      .from("product_variants")
      .select("id")
      .eq("sku", row.sku)
      .maybeSingle();
    const { error: variantError } = existingVariant
      ? await db.from("product_variants").update(variantFields).eq("id", existingVariant.id)
      : await db.from("product_variants").insert({ id: row.variantId, ...variantFields });
    if (variantError) throw new Error(`${row.code} variante: ${variantError.message}`);

    console.log(`${row.code} → ${row.handle} / ${row.sku} (${row.price} MXN, ${row.stock} pzs)`);
  }

  const { data: products } = await db
    .from("products")
    .select("handle")
    .like("handle", "vaso-listo-vl%");
  const { data: variants } = await db
    .from("product_variants")
    .select("sku, stock")
    .like("sku", "TML-VL%");
  console.log(
    `Verificación: ${products?.length ?? 0} productos, ${variants?.length ?? 0} variantes, ` +
      `${(variants ?? []).reduce((total, v) => total + Number(v.stock ?? 0), 0)} piezas.`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

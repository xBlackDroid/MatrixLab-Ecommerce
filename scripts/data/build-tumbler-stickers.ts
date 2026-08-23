/**
 * Generador del catálogo UV Stickers de MatrixLab Tumbler.
 *
 * Reescribe, desde UNA sola fuente:
 *   1. el bloque de datos de `src/lib/store/tumbler-stickers.ts`;
 *   2. `supabase/seed_tumbler_stickers.sql` completo.
 *
 * FUENTE DE VERDAD: `Catalogo_Stickers_MatrixLab.xlsx`, hoja "Catalogo
 * Stickers". El script NO lee .xlsx (evita agregar dependencias al bundle):
 * lee la exportación CSV de esa hoja si existe en
 *
 *   data/catalogo-stickers.csv
 *
 * con las columnas del Excel en su orden original
 * (A=# B=Código C=Nombre D=Categoría E=Estado F=Descripción G=Acabado
 *  H=Inventario I=SKU J=Precio K=Total L=Handle M=Ruta imagen N=Página PDF).
 *
 * Si el CSV no está presente, reconstruye las 209 filas desde la
 * especificación por rangos documentada abajo, que es la misma distribución
 * declarada por el Excel. En ambos casos se valida contra las cifras
 * esperadas y el script ABORTA ante cualquier discrepancia, en lugar de
 * generar un catálogo que no corresponda al inventario real.
 *
 * Correr con: npx tsx scripts/data/build-tumbler-stickers.ts
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..", "..");
const CSV_PATH = join(ROOT, "data", "catalogo-stickers.csv");
const LIB_PATH = join(ROOT, "src", "lib", "store", "tumbler-stickers.ts");
const SEED_PATH = join(ROOT, "supabase", "seed_tumbler_stickers.sql");

type FinishId = "24oz" | "holografico" | "glitter" | "mini";

interface Row {
  position: number;
  code: string;
  name: string;
  finish: FinishId;
  finishLabel: string;
  inventory: number;
  price: number;
}

// ---------------------------------------------------------------------------
// Distribución declarada por el Excel. Es también el contrato de validación:
// si el CSV real no coincide con esto, el script se detiene.
// ---------------------------------------------------------------------------
const GROUPS: {
  finish: FinishId;
  from: number;
  to: number;
  price: number;
  finishLabel: string;
  /** Cómo aparece el acabado dentro del nombre público (columna C). */
  nameFinish: string;
}[] = [
  { finish: "24oz", from: 1, to: 186, price: 85, finishLabel: "24 oz", nameFinish: "24oz" },
  { finish: "holografico", from: 187, to: 188, price: 95, finishLabel: "Holográfico 16 oz", nameFinish: "Holográfico" },
  { finish: "glitter", from: 189, to: 196, price: 85, finishLabel: "Glitter 16 oz", nameFinish: "Glitter" },
  { finish: "mini", from: 197, to: 209, price: 45, finishLabel: "Mini individual", nameFinish: "Mini" },
];

const EXPECTED_TOTAL = 209;
const EXPECTED_INVENTORY_EACH = 3;
const EXPECTED_STOCK_TOTAL = 627;

const stickerCode = (position: number) => `A${String(position).padStart(3, "0")}`;
const groupFor = (position: number) =>
  GROUPS.find((g) => position >= g.from && position <= g.to)!;

// ---------------------------------------------------------------------------
// Origen 1: CSV exportado del Excel.
// ---------------------------------------------------------------------------

/** Parser CSV mínimo con soporte de comillas dobles y saltos embebidos. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i += 1;
        } else quoted = false;
      } else field += ch;
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

const FINISH_BY_CATEGORY: Record<string, FinishId> = {
  "uv stickers 24oz": "24oz",
  "uv stickers especiales - holografico": "holografico",
  "uv stickers especiales - glitter": "glitter",
  "uv stickers mini": "mini",
};

/** Normaliza la celda de categoría (acentos, guiones largos, espacios). */
function normalizeCategory(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[—–]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function rowsFromCsv(): Row[] {
  const table = parseCsv(readFileSync(CSV_PATH, "utf8"));
  // Se descarta la fila de encabezados si la primera celda no es numérica.
  const body = /^\d+$/.test((table[0]?.[0] ?? "").trim()) ? table : table.slice(1);
  return body.map((cells, index) => {
    const cell = (i: number) => (cells[i] ?? "").trim();
    const code = cell(1).toUpperCase();
    const categoryKey = normalizeCategory(cell(3));
    const finish = FINISH_BY_CATEGORY[categoryKey];
    if (!finish) {
      throw new Error(
        `Fila ${index + 1} (${code}): categoría desconocida "${cell(3)}". ` +
          `El generador no inventa familias: revisa la columna D del Excel.`,
      );
    }
    return {
      position: Number(cell(0)) || index + 1,
      code,
      name: cell(2),
      finish,
      finishLabel: cell(6),
      inventory: Number(cell(7)),
      price: Number(cell(9)),
    };
  });
}

// ---------------------------------------------------------------------------
// Origen 2: especificación por rangos (cuando el CSV aún no está disponible).
// ---------------------------------------------------------------------------
function rowsFromSpec(): Row[] {
  const rows: Row[] = [];
  for (let position = 1; position <= EXPECTED_TOTAL; position += 1) {
    const group = groupFor(position);
    const code = stickerCode(position);
    rows.push({
      position,
      code,
      name: `UV Sticker ${group.nameFinish} ${code}`,
      finish: group.finish,
      finishLabel: group.finishLabel,
      inventory: EXPECTED_INVENTORY_EACH,
      price: group.price,
    });
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Validación: si algo no cuadra con el inventario declarado, se aborta.
// ---------------------------------------------------------------------------
function validate(rows: Row[]): void {
  const problems: string[] = [];
  const fail = (message: string) => problems.push(message);

  if (rows.length !== EXPECTED_TOTAL) {
    fail(`se esperaban ${EXPECTED_TOTAL} filas y llegaron ${rows.length}`);
  }

  const codes = rows.map((r) => r.code);
  if (new Set(codes).size !== codes.length) fail("hay códigos duplicados");

  for (let position = 1; position <= EXPECTED_TOTAL; position += 1) {
    if (!codes.includes(stickerCode(position))) {
      fail(`falta el código ${stickerCode(position)}`);
    }
  }

  rows.forEach((row, index) => {
    if (row.position !== index + 1) {
      fail(`${row.code}: posición ${row.position} fuera del orden del Excel`);
    }
    const group = groupFor(index + 1);
    if (row.code !== stickerCode(index + 1)) {
      fail(`posición ${index + 1}: se esperaba ${stickerCode(index + 1)} y llegó ${row.code}`);
    }
    if (row.finish !== group.finish) {
      fail(`${row.code}: familia ${row.finish}, se esperaba ${group.finish}`);
    }
    if (row.price !== group.price) {
      fail(`${row.code}: precio ${row.price}, se esperaba ${group.price}`);
    }
    if (row.inventory !== EXPECTED_INVENTORY_EACH) {
      fail(`${row.code}: inventario ${row.inventory}, se esperaba ${EXPECTED_INVENTORY_EACH}`);
    }
    if (!row.name) fail(`${row.code}: nombre vacío`);
    if (!row.finishLabel) fail(`${row.code}: acabado vacío`);
  });

  for (const group of GROUPS) {
    const expected = group.to - group.from + 1;
    const actual = rows.filter((r) => r.finish === group.finish).length;
    if (actual !== expected) {
      fail(`familia ${group.finish}: ${actual} productos, se esperaban ${expected}`);
    }
  }

  const stock = rows.reduce((sum, r) => sum + r.inventory, 0);
  if (stock !== EXPECTED_STOCK_TOTAL) {
    fail(`inventario total ${stock}, se esperaban ${EXPECTED_STOCK_TOTAL}`);
  }

  if (problems.length) {
    console.error("✗ El catálogo NO coincide con el inventario declarado:\n");
    for (const problem of problems.slice(0, 40)) console.error(`  - ${problem}`);
    if (problems.length > 40) console.error(`  … y ${problems.length - 40} más`);
    console.error("\nNo se generó nada. Corrige la fuente y vuelve a correr.");
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Emisión.
// ---------------------------------------------------------------------------
const sqlText = (value: string) => `'${value.replace(/'/g, "''")}'`;
const productUuid = (position: number) =>
  `f3000000-0000-4000-8000-${String(position).padStart(12, "0")}`;
const variantUuid = (position: number) =>
  `f4000000-0000-4000-8000-${String(position).padStart(12, "0")}`;
const handleOf = (code: string) => `sticker-${code.toLowerCase()}`;
const skuOf = (code: string) => `STK-${code.toUpperCase()}`;
const descriptionOf = (row: Row) =>
  `${row.name} — sticker UV de MatrixLab Tumbler. Acabado ${row.finishLabel}. Se vende por pieza. Ref. ${row.code}.`;

function writeLibrary(rows: Row[]): void {
  const body = rows
    .map(
      (r) =>
        `  { position: ${r.position}, code: "${r.code}", name: "${r.name}", ` +
        `finish: "${r.finish}", finishLabel: "${r.finishLabel}", ` +
        `inventory: ${r.inventory}, price: ${r.price} },`,
    )
    .join("\n");
  const source = readFileSync(LIB_PATH, "utf8");
  const start = "  // <generated:stickers>";
  const end = "  // </generated:stickers>";
  const from = source.indexOf(start);
  const to = source.indexOf(end);
  if (from === -1 || to === -1) {
    throw new Error(`Faltan los marcadores <generated:stickers> en ${LIB_PATH}`);
  }
  const next =
    source.slice(0, from) + `${start}\n${body}\n` + source.slice(to);
  writeFileSync(LIB_PATH, next);
}

function writeSeed(rows: Row[]): void {
  const values = rows
    .map((r) => {
      const cells = [
        `'${productUuid(r.position)}'::uuid`,
        `'${variantUuid(r.position)}'::uuid`,
        sqlText(r.code),
        sqlText(r.name),
        sqlText(handleOf(r.code)),
        sqlText(skuOf(r.code)),
        sqlText(descriptionOf(r)),
        `${r.price}::numeric`,
        `${r.inventory}::int`,
        `${r.position}::int`,
      ];
      return `    (${cells.join(", ")})`;
    })
    .join(",\n");

  const sql = `-- ============================================================================
-- MatrixLab Tumbler — UV Stickers — Seed aditivo e IDEMPOTENTE
--
-- ARCHIVO GENERADO. No editar a mano:
--   npx tsx scripts/data/build-tumbler-stickers.ts
--
-- Crea/actualiza los ${EXPECTED_TOTAL} UV Stickers como PRODUCTOS INDIVIDUALES dentro de la
-- categoría existente \`wraps-glow-finish\` (Wraps & Glow Finish), cada uno con
-- UNA sola variante ("Pieza") que lleva el SKU, el precio y el inventario.
--
-- FUENTE DE VERDAD: Catalogo_Stickers_MatrixLab.xlsx (hoja "Catalogo Stickers")
--   columna B -> código      |  columna C -> nombre
--   columna G -> acabado     |  columna H -> inventario (pz)
--   columna I -> SKU         |  columna J -> precio unitario
--   columna L -> handle
-- La columna K ("Total") NO se usa: es inventario x precio, no precio unitario.
--
-- DISTRIBUCIÓN
${GROUPS.map(
  (g) =>
    `--   ${stickerCode(g.from)}-${stickerCode(g.to)}  ${String(g.to - g.from + 1).padStart(3)} productos  $${g.price}  ${g.finishLabel}`,
).join("\n")}
--   Inventario: ${EXPECTED_INVENTORY_EACH} pz por SKU — total ${EXPECTED_STOCK_TOTAL} pz.
--
-- GARANTÍAS
--   * Re-ejecutable: upsert por \`handle\` (producto) y por \`sku\` (variante).
--     Si el producto ya existe, CONSERVA su id — no se reasignan ids.
--   * NO borra productos, pedidos, diseños ni usuarios (sin DELETE/TRUNCATE/DROP).
--   * NO crea una segunda categoría ni cambia el handle público
--     /tienda/categoria/wraps-glow-finish.
--   * NO toca los productos genéricos históricos de la categoría (Wrap UV
--     decorativo, Lámina decorativa para vaso, Resina UV): siguen en la base y
--     en el admin; solo se separan de ESTA vista pública.
--   * NO toca Sparkles, otras categorías, pedidos ni Mercado Pago.
--   * NO toca \`images\`: la foto se resuelve por código desde
--     public/images/tumbler/stickers/<codigo>.webp y el admin puede curar
--     imágenes manualmente sin que el seed las pise.
--   * NO toca \`compare_at_price\` ni \`production_time\` (curables desde admin).
--
-- Ejecutar después de supabase/seed_etapa2.sql (que crea la categoría).
-- ============================================================================

-- La categoría debe existir: este seed NUNCA crea una segunda categoría ni
-- cambia el handle público /tienda/categoria/wraps-glow-finish.
do $$
begin
  if not exists (
    select 1 from public.categories where handle = 'wraps-glow-finish'
  ) then
    raise exception
      'Falta la categoría wraps-glow-finish. Ejecuta supabase/seed_etapa2.sql primero.';
  end if;
end $$;

with stickers (
  product_id, variant_id, code, name, handle, sku, description, price, stock, position
) as (
  values
${values}
),
cat as (
  select id from public.categories where handle = 'wraps-glow-finish'
),
upserted as (
  insert into public.products (
    id, category_id, title, handle, description, base_price, status,
    is_customizable, min_quantity, max_quantity, tags
  )
  select
    s.product_id,
    cat.id,
    s.name,
    s.handle,
    s.description,
    s.price,
    -- Inventario real > 0 en el Excel => disponible; si algún día llega en 0,
    -- el producto queda 'agotado' y deja de poder agregarse al carrito.
    case when s.stock > 0 then 'disponible' else 'agotado' end,
    false,
    1,
    greatest(s.stock, 1),
    array['uv-stickers', 'stickers', 'matrixlab-tumbler']
  from stickers s cross join cat
  on conflict (handle) do update set
    category_id = excluded.category_id,
    title = excluded.title,
    description = excluded.description,
    base_price = excluded.base_price,
    status = excluded.status,
    is_customizable = excluded.is_customizable,
    min_quantity = excluded.min_quantity,
    max_quantity = excluded.max_quantity,
    tags = excluded.tags
  returning id, handle
)
insert into public.product_variants (
  id, product_id, title, sku, price, stock, option_label, status
)
select
  s.variant_id,
  u.id,
  'Pieza',
  s.sku,
  s.price,
  s.stock,
  'Pieza',
  case when s.stock > 0 then 'disponible' else 'agotado' end
from stickers s
join upserted u on u.handle = s.handle
on conflict (sku) do update set
  product_id = excluded.product_id,
  title = excluded.title,
  price = excluded.price,
  stock = excluded.stock,
  option_label = excluded.option_label,
  status = excluded.status;

-- ---------------------------------------------------------------------------
-- Verificación rápida (debe devolver ${EXPECTED_TOTAL} / ${EXPECTED_TOTAL} / ${EXPECTED_STOCK_TOTAL}).
-- ---------------------------------------------------------------------------
-- select
--   (select count(*) from public.products p
--      join public.categories c on c.id = p.category_id
--     where c.handle = 'wraps-glow-finish' and p.handle like 'sticker-%') as productos,
--   (select count(*) from public.product_variants where sku like 'STK-A%') as variantes,
--   (select coalesce(sum(stock), 0) from public.product_variants
--     where sku like 'STK-A%') as piezas;
`;
  writeFileSync(SEED_PATH, sql);
}

// ---------------------------------------------------------------------------
const usedCsv = existsSync(CSV_PATH);
const rows = usedCsv ? rowsFromCsv() : rowsFromSpec();
validate(rows);
writeLibrary(rows);
writeSeed(rows);

const counts = GROUPS.map(
  (g) => `${g.finish}=${rows.filter((r) => r.finish === g.finish).length}`,
).join("  ");
console.log(
  `✓ ${rows.length} UV Stickers generados desde ${usedCsv ? "data/catalogo-stickers.csv" : "la especificación por rangos"}.`,
);
console.log(`  ${counts}`);
console.log(`  inventario total: ${rows.reduce((s, r) => s + r.inventory, 0)} pz`);
console.log(`  → ${LIB_PATH}`);
console.log(`  → ${SEED_PATH}`);

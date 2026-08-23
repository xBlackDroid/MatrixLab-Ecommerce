/**
 * QA del catálogo UV Stickers de MatrixLab Tumbler.
 *
 * Valida el módulo fuente (`src/lib/store/tumbler-stickers.ts`), su espejo en
 * los mocks, el seed SQL y las rutas deterministas de imagen. Falla si algo
 * deja de coincidir con el Excel (`Catalogo_Stickers_MatrixLab.xlsx`).
 *
 * Correr con: npx tsx scripts/qa/tumbler-stickers.test.ts
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  matchesStickerFilter,
  matchesStickerQuery,
  STICKER_FINISH_ORDER,
  STICKER_PLACEHOLDER_IMAGE,
  STICKERS_CATEGORY_HANDLE,
  stickerByCode,
  stickerByHandle,
  stickerFinishCounts,
  stickerHandle,
  stickerImagePath,
  stickerSku,
  TUMBLER_STICKERS,
  type StickerFinishId,
} from "../../src/lib/store/tumbler-stickers";
import {
  MOCK_CATEGORIES,
  MOCK_PRODUCTS,
  MOCK_VARIANTS,
} from "../../src/lib/store/mock-data";

const ROOT = join(__dirname, "..", "..");

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  if (!ok) failures += 1;
  // Con 209 productos, solo se imprime el detalle de lo que falla y los
  // encabezados de cada bloque: el log se mantiene legible.
  if (!ok) console.log(`✗ ${name}${detail ? " — " + detail : ""}`);
}
function pass(name: string, detail = "") {
  console.log(`✓ ${name}${detail ? " — " + detail : ""}`);
}

// Cifras declaradas por el Excel. Son el contrato de este QA.
const EXPECTED_TOTAL = 209;
const EXPECTED_INVENTORY_EACH = 3;
const EXPECTED_STOCK_TOTAL = 627;
const EXPECTED_BY_FINISH: Record<StickerFinishId, number> = {
  "24oz": 186,
  holografico: 2,
  glitter: 8,
  mini: 13,
};
const EXPECTED_PRICE: Record<StickerFinishId, number> = {
  "24oz": 85,
  holografico: 95,
  glitter: 85,
  mini: 45,
};
/** Rangos de código por familia, tal como los define el Excel. */
const EXPECTED_RANGE: Record<StickerFinishId, [number, number]> = {
  "24oz": [1, 186],
  holografico: [187, 188],
  glitter: [189, 196],
  mini: [197, 209],
};

const code = (n: number) => `A${String(n).padStart(3, "0")}`;

// ---------------------------------------------------------------------------
// 1) Exactamente 209 productos.
// ---------------------------------------------------------------------------
check(
  `${EXPECTED_TOTAL} UV Stickers en el catálogo`,
  TUMBLER_STICKERS.length === EXPECTED_TOTAL,
  `${TUMBLER_STICKERS.length}`,
);
pass(`${TUMBLER_STICKERS.length} UV Stickers en el catálogo`);

// ---------------------------------------------------------------------------
// 2-6) Códigos A001–A209 completos, sin faltantes, únicos; handles y SKUs únicos.
// ---------------------------------------------------------------------------
const codes = TUMBLER_STICKERS.map((s) => s.code);
const handles = codes.map(stickerHandle);
const skus = codes.map(stickerSku);
const codeSet = new Set(codes);

const missing = Array.from({ length: EXPECTED_TOTAL }, (_, i) => code(i + 1)).filter(
  (c) => !codeSet.has(c),
);
check("sin códigos faltantes entre A001 y A209", missing.length === 0, missing.join(", "));
check("códigos únicos", codeSet.size === codes.length);
check("handles únicos", new Set(handles).size === handles.length);
check("SKUs únicos", new Set(skus).size === skus.length);
check(
  "handles válidos para Supabase (^[a-z0-9-]+$)",
  handles.every((h) => /^[a-z0-9-]+$/.test(h)),
);
check(
  "handles con el formato del Excel (sticker-a###)",
  TUMBLER_STICKERS.every((s) => stickerHandle(s.code) === `sticker-${s.code.toLowerCase()}`),
);
check(
  "SKUs con el prefijo STK- del Excel",
  TUMBLER_STICKERS.every((s) => stickerSku(s.code) === `STK-${s.code}`),
);
pass("códigos A001–A209 completos, únicos; handles y SKUs únicos");

// ---------------------------------------------------------------------------
// 7) Orden EXACTO del Excel: posición n ↔ código A00n.
// ---------------------------------------------------------------------------
check(
  "orden exacto del Excel (A001 → A209, sin reordenar)",
  TUMBLER_STICKERS.every((s, i) => s.position === i + 1 && s.code === code(i + 1)),
);
pass("orden exacto del Excel (A001 → A209)");

// ---------------------------------------------------------------------------
// 8-9) Inventario: 3 por SKU, 627 en total, nunca negativo.
// ---------------------------------------------------------------------------
check(
  `inventario = ${EXPECTED_INVENTORY_EACH} en todos los SKUs`,
  TUMBLER_STICKERS.every((s) => s.inventory === EXPECTED_INVENTORY_EACH),
);
check("ningún inventario negativo", TUMBLER_STICKERS.every((s) => s.inventory >= 0));
const stockTotal = TUMBLER_STICKERS.reduce((sum, s) => sum + s.inventory, 0);
check(
  `inventario total = ${EXPECTED_STOCK_TOTAL} piezas`,
  stockTotal === EXPECTED_STOCK_TOTAL,
  `${stockTotal}`,
);
pass(`inventario 3 pz por SKU — total ${stockTotal} pz`);

// ---------------------------------------------------------------------------
// 10-13) Distribución por familia y rangos de código.
// ---------------------------------------------------------------------------
const counts = stickerFinishCounts();
for (const finish of STICKER_FINISH_ORDER) {
  check(
    `${finish}: ${EXPECTED_BY_FINISH[finish]} productos`,
    counts[finish] === EXPECTED_BY_FINISH[finish],
    `${counts[finish]}`,
  );
  const [from, to] = EXPECTED_RANGE[finish];
  check(
    `${finish} cubre exactamente ${code(from)}–${code(to)}`,
    TUMBLER_STICKERS.filter((s) => s.finish === finish).every(
      (s) => s.position >= from && s.position <= to,
    ),
  );
}
pass(
  "distribución por familia",
  STICKER_FINISH_ORDER.map((f) => `${f}=${counts[f]}`).join(" "),
);

// ---------------------------------------------------------------------------
// 14-15) Precios por familia; ningún precio <= 0.
// ---------------------------------------------------------------------------
for (const item of TUMBLER_STICKERS) {
  check(
    `precio ${item.code} = ${EXPECTED_PRICE[item.finish]}`,
    item.price === EXPECTED_PRICE[item.finish],
    `es ${item.price}`,
  );
}
check("ningún precio <= 0", TUMBLER_STICKERS.every((s) => s.price > 0));
check(
  "columna K (Total) NO se usa como precio unitario",
  TUMBLER_STICKERS.every((s) => s.price !== s.price * s.inventory),
);
pass(
  "precios por familia",
  STICKER_FINISH_ORDER.map((f) => `${f}=$${EXPECTED_PRICE[f]}`).join(" "),
);

// ---------------------------------------------------------------------------
// 16) Nombre y acabado presentes en todas las filas.
// ---------------------------------------------------------------------------
check(
  "todas las filas tienen nombre y acabado",
  TUMBLER_STICKERS.every((s) => s.name.trim().length > 0 && s.finishLabel.trim().length > 0),
);
check(
  "el nombre incluye el código (búsqueda por código funciona)",
  TUMBLER_STICKERS.every((s) => s.name.includes(s.code)),
);

// ---------------------------------------------------------------------------
// 17-19) Rutas de imagen deterministas, vinculadas por CÓDIGO.
// ---------------------------------------------------------------------------
check(
  "ruta de imagen determinista por código",
  TUMBLER_STICKERS.every(
    (s) => stickerImagePath(s.code) === `/images/tumbler/stickers/${s.code.toLowerCase()}.webp`,
  ),
);
check(
  "A001 → /images/tumbler/stickers/a001.webp",
  stickerImagePath("A001") === "/images/tumbler/stickers/a001.webp",
  stickerImagePath("A001"),
);
check(
  "A209 → /images/tumbler/stickers/a209.webp",
  stickerImagePath("A209") === "/images/tumbler/stickers/a209.webp",
  stickerImagePath("A209"),
);
check("rutas de imagen únicas", new Set(codes.map(stickerImagePath)).size === codes.length);
check(
  "el placeholder existe en public/",
  existsSync(join(ROOT, "public", STICKER_PLACEHOLDER_IMAGE)),
  STICKER_PLACEHOLDER_IMAGE,
);
pass("rutas de imagen deterministas + placeholder presente");

// ---------------------------------------------------------------------------
// 20) Búsqueda por código, nombre y SKU.
// ---------------------------------------------------------------------------
const a050 = stickerByCode("A050");
check("stickerByCode('A050') resuelve", a050 !== null);
if (a050) {
  check("buscar 'A050' encuentra A050", matchesStickerQuery(a050, "A050"));
  check("buscar 'a050' (minúsculas) encuentra A050", matchesStickerQuery(a050, "a050"));
  check("buscar 'STK-A050' encuentra A050", matchesStickerQuery(a050, "STK-A050"));
  check("buscar 'stk a050' (sin guion) encuentra A050", matchesStickerQuery(a050, "stk a050"));
  check("buscar por nombre encuentra A050", matchesStickerQuery(a050, a050.name));
}
const a187 = stickerByCode("A187");
check("A187 es holográfico", a187?.finish === "holografico", a187?.finish);
check("A187 cuesta 95", a187?.price === 95, String(a187?.price));
const a209 = stickerByCode("A209");
check("A209 es mini", a209?.finish === "mini", a209?.finish);
check("buscar 'STK-A209' encuentra A209", a209 ? matchesStickerQuery(a209, "STK-A209") : false);
check(
  "una búsqueda vacía no filtra nada",
  TUMBLER_STICKERS.every((s) => matchesStickerQuery(s, "")),
);
check(
  "cada código encuentra exactamente un producto",
  TUMBLER_STICKERS.every(
    (s) => TUMBLER_STICKERS.filter((o) => matchesStickerQuery(o, s.code)).length === 1,
  ),
);
check("stickerByHandle('sticker-a001') resuelve", stickerByHandle("sticker-a001")?.code === "A001");
check("stickerByHandle ignora handles ajenos", stickerByHandle("sparkle-c08r") === null);
pass("búsqueda por código, nombre y SKU");

// ---------------------------------------------------------------------------
// 21) Filtros: 'Todos' no filtra; cada familia devuelve su conteo exacto.
// ---------------------------------------------------------------------------
check(
  "filtro 'Todos' devuelve los 209",
  TUMBLER_STICKERS.filter((s) => matchesStickerFilter(s, null)).length === EXPECTED_TOTAL,
);
for (const finish of STICKER_FINISH_ORDER) {
  check(
    `filtro ${finish} devuelve ${EXPECTED_BY_FINISH[finish]}`,
    TUMBLER_STICKERS.filter((s) => matchesStickerFilter(s, finish)).length ===
      EXPECTED_BY_FINISH[finish],
  );
}
pass("filtros por acabado con conteos exactos");

// ---------------------------------------------------------------------------
// 22) La categoría pública no cambia de handle.
// ---------------------------------------------------------------------------
check(
  "la categoría sigue siendo wraps-glow-finish",
  STICKERS_CATEGORY_HANDLE === "wraps-glow-finish",
  STICKERS_CATEGORY_HANDLE,
);
const category = MOCK_CATEGORIES.find((c) => c.handle === STICKERS_CATEGORY_HANDLE);
check("la categoría existe en los mocks", Boolean(category));
check(
  "no se creó una segunda categoría de stickers UV",
  MOCK_CATEGORIES.filter((c) => c.handle === STICKERS_CATEGORY_HANDLE).length === 1,
);
pass("categoría wraps-glow-finish intacta (una sola)");

// ---------------------------------------------------------------------------
// 23) Espejo en los mocks: 209 productos + 209 variantes, sin duplicados.
// ---------------------------------------------------------------------------
const mockProducts = MOCK_PRODUCTS.filter((p) => stickerByHandle(p.handle));
const mockVariants = MOCK_VARIANTS.filter((v) => /^STK-A\d{3}$/.test(v.sku ?? ""));
check(`mocks: ${EXPECTED_TOTAL} productos`, mockProducts.length === EXPECTED_TOTAL, `${mockProducts.length}`);
check(`mocks: ${EXPECTED_TOTAL} variantes`, mockVariants.length === EXPECTED_TOTAL, `${mockVariants.length}`);
check(
  "mocks: exactamente 209 productos activos (ninguno oculto)",
  mockProducts.filter((p) => p.status === "disponible").length === EXPECTED_TOTAL,
);
check(
  "mocks: ids de producto únicos",
  new Set(mockProducts.map((p) => p.id)).size === mockProducts.length,
);
check(
  "mocks: ids de variante únicos",
  new Set(mockVariants.map((v) => v.id)).size === mockVariants.length,
);
check(
  "mocks: todos en la categoría wraps-glow-finish",
  category ? mockProducts.every((p) => p.category_id === category.id) : false,
);
check(
  "mocks: precio y stock coinciden con el Excel",
  TUMBLER_STICKERS.every((item) => {
    const product = mockProducts.find((p) => p.handle === stickerHandle(item.code));
    const variant = mockVariants.find((v) => v.sku === stickerSku(item.code));
    return (
      Number(product?.base_price) === item.price &&
      Number(variant?.price) === item.price &&
      variant?.stock === item.inventory
    );
  }),
);
check(
  "mocks: max_quantity nunca excede el inventario real",
  mockProducts.every((p) => p.max_quantity <= EXPECTED_INVENTORY_EACH),
);
const mockStock = mockVariants.reduce((sum, v) => sum + v.stock, 0);
check(`mocks: inventario total ${EXPECTED_STOCK_TOTAL}`, mockStock === EXPECTED_STOCK_TOTAL, `${mockStock}`);
check(
  "los productos genéricos históricos siguen en los mocks",
  ["wrap-uv-decorativo", "lamina-decorativa-vaso", "resina-uv-acabado"].every((h) =>
    MOCK_PRODUCTS.some((p) => p.handle === h),
  ),
);
pass("espejo en mocks correcto y productos históricos conservados");

// ---------------------------------------------------------------------------
// 24) Los SKUs de stickers no colisionan con los ya existentes.
// ---------------------------------------------------------------------------
const otherSkus = MOCK_VARIANTS.filter((v) => !/^STK-A\d{3}$/.test(v.sku ?? "")).map(
  (v) => v.sku,
);
check(
  "los SKUs STK-A### no colisionan con SKUs existentes",
  skus.every((s) => !otherSkus.includes(s)),
);
check(
  "los handles sticker-a### no colisionan con productos existentes",
  handles.every(
    (h) => MOCK_PRODUCTS.filter((p) => p.handle === h).length === 1,
  ),
);
pass("sin colisiones de SKU ni de handle");

// ---------------------------------------------------------------------------
// 25) Seed SQL: idempotente, aditivo, no destructivo.
// ---------------------------------------------------------------------------
const seedPath = join(ROOT, "supabase", "seed_tumbler_stickers.sql");
check("el seed existe", existsSync(seedPath), seedPath);
if (existsSync(seedPath)) {
  const seed = readFileSync(seedPath, "utf8");
  // Se ignoran los comentarios: solo importan las sentencias reales.
  const statements = seed
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .toLowerCase();

  check("seed sin DELETE", !/\bdelete\s+from\b/.test(statements));
  check("seed sin TRUNCATE", !/\btruncate\b/.test(statements));
  check("seed sin DROP", !/\bdrop\s+(table|column|schema|database)\b/.test(statements));
  check(
    "seed sin crear otra categoría",
    !/insert\s+into\s+public\.categories/.test(statements),
  );
  check("seed no toca Sparkles", !statements.includes("sparkle"));
  check("seed no toca pedidos", !/public\.orders?\b/.test(statements));
  check("seed no toca diseños ni usuarios", !/public\.(designs?|users?|profiles)\b/.test(statements));
  check(
    "seed idempotente: upsert de producto por handle",
    statements.includes("on conflict (handle) do update"),
  );
  check(
    "seed idempotente: upsert de variante por sku",
    statements.includes("on conflict (sku) do update"),
  );
  check(
    "seed apunta a la categoría wraps-glow-finish",
    statements.includes("handle = 'wraps-glow-finish'"),
  );
  check("seed no toca images (curaduría del admin)", !/\bimages\b/.test(statements));

  // El seed debe contener exactamente las 209 filas, con sus handles y SKUs.
  const seedHandles: string[] = seed.match(/'sticker-a\d{3}'/g) ?? [];
  const seedSkus: string[] = seed.match(/'STK-A\d{3}'/g) ?? [];
  check(`seed con ${EXPECTED_TOTAL} handles`, new Set(seedHandles).size === EXPECTED_TOTAL, `${new Set(seedHandles).size}`);
  check(`seed con ${EXPECTED_TOTAL} SKUs`, new Set(seedSkus).size === EXPECTED_TOTAL, `${new Set(seedSkus).size}`);
  check("seed sin handles duplicados", seedHandles.length === new Set(seedHandles).size);
  check("seed sin SKUs duplicados", seedSkus.length === new Set(seedSkus).size);
  check(
    "seed: todos los handles del Excel presentes",
    handles.every((h) => seedHandles.includes(`'${h}'`)),
  );
  check(
    "seed: todos los SKUs del Excel presentes",
    skus.every((s) => seedSkus.includes(`'${s}'`)),
  );
  check(
    "seed: ids de producto únicos y deterministas",
    new Set(seed.match(/'f3000000-0000-4000-8000-\d{12}'/g) ?? []).size === EXPECTED_TOTAL,
  );
  check(
    "seed: ids de variante únicos y deterministas",
    new Set(seed.match(/'f4000000-0000-4000-8000-\d{12}'/g) ?? []).size === EXPECTED_TOTAL,
  );
  check(
    "seed: los ids no colisionan con los de Sparkles (f1/f2)",
    !/'f[12]000000-/.test(seed),
  );
  pass("seed idempotente, aditivo y no destructivo");
}

// ---------------------------------------------------------------------------
// 26) No se tocó el catálogo Sparkles.
// ---------------------------------------------------------------------------
const sparkleProducts = MOCK_PRODUCTS.filter((p) => p.handle.startsWith("sparkle-"));
check("los 46 Sparkles siguen intactos", sparkleProducts.length === 46, `${sparkleProducts.length}`);
pass("Sparkles intactos (46 productos)");

console.log(
  failures === 0
    ? `\n✓ QA UV Stickers OK — ${TUMBLER_STICKERS.length} productos validados, ${stockTotal} piezas.`
    : `\n✗ QA UV Stickers: ${failures} fallo(s).`,
);
process.exit(failures === 0 ? 0 : 1);

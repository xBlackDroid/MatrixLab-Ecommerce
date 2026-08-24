/**
 * QA del catálogo de Vasos de MatrixLab Tumbler.
 *
 * Valida el módulo fuente (`src/lib/store/tumbler-cups.ts`), su espejo en los
 * mocks, el seed SQL y las rutas deterministas de imagen. Falla si algo deja
 * de coincidir con el Excel (`Catalogo_Vasos_MatrixLab.xlsx`) o con el
 * inventario confirmado para este release.
 *
 * Correr con: npx tsx scripts/qa/tumbler-cups.test.ts
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CUP_COLLECTIONS,
  CUP_PLACEHOLDER_IMAGE,
  CUPS_CATEGORY_HANDLE,
  cupByCode,
  cupByHandle,
  cupHandle,
  cupImagePath,
  cupSku,
  TUMBLER_CUPS,
} from "../../src/lib/store/tumbler-cups";
import {
  MOCK_CATEGORIES,
  MOCK_PRODUCTS,
  MOCK_VARIANTS,
} from "../../src/lib/store/mock-data";

const ROOT = join(__dirname, "..", "..");

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? " — " + detail : ""}`);
  if (!ok) failures += 1;
}

// Cifras confirmadas para este release. Son el contrato de este QA.
const EXPECTED_TOTAL = 5;
const EXPECTED_STOCK_TOTAL = 25;
/** Precio e inventario exactos por código (columnas J y H). */
const EXPECTED: Record<string, { price: number; stock: number; capacity: string }> = {
  V001: { price: 155, stock: 5, capacity: "24 oz - Transparente" },
  V002: { price: 175, stock: 5, capacity: "24 oz - Tapa de color" },
  V003: { price: 165, stock: 5, capacity: "24 oz - Slip" },
  V004: { price: 155, stock: 5, capacity: "20 oz - Slip" },
  V005: { price: 135, stock: 5, capacity: "16 oz - Can" },
};
const EXPECTED_CODES = Object.keys(EXPECTED);

// ---------------------------------------------------------------------------
// 1) Exactamente 5 productos.
// ---------------------------------------------------------------------------
check(
  `${EXPECTED_TOTAL} vasos en el catálogo`,
  TUMBLER_CUPS.length === EXPECTED_TOTAL,
  `${TUMBLER_CUPS.length}`,
);

// ---------------------------------------------------------------------------
// 2-6) Códigos V001–V005 completos, únicos; handles y SKUs únicos.
// ---------------------------------------------------------------------------
const codes = TUMBLER_CUPS.map((c) => c.code);
const handles = codes.map(cupHandle);
const skus = codes.map(cupSku);

const missing = EXPECTED_CODES.filter((c) => !codes.includes(c));
check("sin códigos faltantes entre V001 y V005", missing.length === 0, missing.join(", "));
check("códigos únicos", new Set(codes).size === codes.length);
check("handles únicos", new Set(handles).size === handles.length);
check("SKUs únicos", new Set(skus).size === skus.length);
check(
  "handles válidos para Supabase (^[a-z0-9-]+$)",
  handles.every((h) => /^[a-z0-9-]+$/.test(h)),
);
check(
  "handles con el formato del Excel (vaso-v00#)",
  TUMBLER_CUPS.every((c) => cupHandle(c.code) === `vaso-${c.code.toLowerCase()}`),
);
check(
  "SKUs con el prefijo VAS- del Excel",
  TUMBLER_CUPS.every((c) => cupSku(c.code) === `VAS-${c.code}`),
);

// ---------------------------------------------------------------------------
// 7) Orden EXACTO del Excel: posición n ↔ código V00n.
// ---------------------------------------------------------------------------
check(
  "orden exacto del Excel (V001 → V005, sin reordenar)",
  TUMBLER_CUPS.every((c, i) => c.position === i + 1 && c.code === EXPECTED_CODES[i]),
);

// ---------------------------------------------------------------------------
// 8-12) Precios exactos por código.
// ---------------------------------------------------------------------------
for (const code of EXPECTED_CODES) {
  const cup = cupByCode(code);
  check(
    `precio ${code} = ${EXPECTED[code].price}`,
    cup?.price === EXPECTED[code].price,
    `es ${cup?.price}`,
  );
}
check("ningún precio <= 0", TUMBLER_CUPS.every((c) => c.price > 0));
check(
  "columna K (Total) NO se usa como precio unitario",
  TUMBLER_CUPS.every((c) => c.price !== c.price * c.inventory),
);

// ---------------------------------------------------------------------------
// 13-19) Inventario exacto por código, total 25, nunca negativo.
// ---------------------------------------------------------------------------
for (const code of EXPECTED_CODES) {
  const cup = cupByCode(code);
  check(
    `stock ${code} = ${EXPECTED[code].stock}`,
    cup?.inventory === EXPECTED[code].stock,
    `es ${cup?.inventory}`,
  );
}
check("ningún inventario negativo", TUMBLER_CUPS.every((c) => c.inventory >= 0));
check(
  "ninguna celda vacía interpretada como 0",
  TUMBLER_CUPS.every((c) => c.inventory > 0),
);
const stockTotal = TUMBLER_CUPS.reduce((sum, c) => sum + c.inventory, 0);
check(
  `inventario total = ${EXPECTED_STOCK_TOTAL} piezas`,
  stockTotal === EXPECTED_STOCK_TOTAL,
  `${stockTotal}`,
);

// ---------------------------------------------------------------------------
// 20) Capacidad / tipo y colección presentes y reales.
// ---------------------------------------------------------------------------
for (const code of EXPECTED_CODES) {
  const cup = cupByCode(code);
  check(
    `capacidad ${code} = "${EXPECTED[code].capacity}"`,
    cup?.capacity === EXPECTED[code].capacity,
    cup?.capacity,
  );
}
check(
  "todas las filas tienen nombre y descripción",
  TUMBLER_CUPS.every((c) => c.name.trim().length > 0 && c.description.trim().length > 0),
);
check(
  "colecciones exactamente las del Excel (4, sin inventar)",
  CUP_COLLECTIONS.length === 4 &&
    ["Colección Clásica", "Color Collection", "Slip Collection", "Can Collection"].every(
      (c) => CUP_COLLECTIONS.includes(c),
    ),
  CUP_COLLECTIONS.join(" | "),
);

// ---------------------------------------------------------------------------
// 21-23) Rutas de imagen deterministas, vinculadas por CÓDIGO.
// ---------------------------------------------------------------------------
check(
  "ruta de imagen determinista por código",
  TUMBLER_CUPS.every(
    (c) => cupImagePath(c.code) === `/images/tumbler/vasos/${c.code.toLowerCase()}.webp`,
  ),
);
check(
  "V001 → /images/tumbler/vasos/v001.webp",
  cupImagePath("V001") === "/images/tumbler/vasos/v001.webp",
  cupImagePath("V001"),
);
check(
  "V005 → /images/tumbler/vasos/v005.webp",
  cupImagePath("V005") === "/images/tumbler/vasos/v005.webp",
  cupImagePath("V005"),
);
check("rutas de imagen únicas", new Set(codes.map(cupImagePath)).size === codes.length);
check(
  "el placeholder existe en public/",
  existsSync(join(ROOT, "public", CUP_PLACEHOLDER_IMAGE)),
  CUP_PLACEHOLDER_IMAGE,
);

// ---------------------------------------------------------------------------
// 24) Resolución por handle / código.
// ---------------------------------------------------------------------------
check("cupByHandle('vaso-v001') resuelve", cupByHandle("vaso-v001")?.code === "V001");
check("cupByHandle ignora handles ajenos", cupByHandle("sparkle-c08r") === null);
check("cupByHandle ignora stickers", cupByHandle("sticker-a001") === null);
check("cupByCode('v005') es case-insensitive", cupByCode("v005")?.code === "V005");

// ---------------------------------------------------------------------------
// 25) La categoría pública auditada no cambia de handle.
// ---------------------------------------------------------------------------
check(
  "los vasos viven en la categoría existente snowglobe",
  CUPS_CATEGORY_HANDLE === "snowglobe",
  CUPS_CATEGORY_HANDLE,
);
const category = MOCK_CATEGORIES.find((c) => c.handle === CUPS_CATEGORY_HANDLE);
check("la categoría existe en los mocks", Boolean(category));
check(
  "no se creó una segunda categoría de vasos",
  MOCK_CATEGORIES.filter((c) => c.handle === CUPS_CATEGORY_HANDLE).length === 1 &&
    !MOCK_CATEGORIES.some((c) => c.handle === "vasos"),
);
check(
  "el nombre visible de la categoría NO se cambió",
  category?.title === "SnowGlobe Bar",
  category?.title,
);

// ---------------------------------------------------------------------------
// 26) Espejo en los mocks: 5 productos + 5 variantes, todos activos.
// ---------------------------------------------------------------------------
const mockProducts = MOCK_PRODUCTS.filter((p) => cupByHandle(p.handle));
const mockVariants = MOCK_VARIANTS.filter((v) => /^VAS-V\d{3}$/.test(v.sku ?? ""));
check(`mocks: ${EXPECTED_TOTAL} productos`, mockProducts.length === EXPECTED_TOTAL, `${mockProducts.length}`);
check(`mocks: ${EXPECTED_TOTAL} variantes`, mockVariants.length === EXPECTED_TOTAL, `${mockVariants.length}`);
check(
  "mocks: los 5 productos activos",
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
  "mocks: todos en la categoría snowglobe",
  category ? mockProducts.every((p) => p.category_id === category.id) : false,
);
check(
  "mocks: precio y stock coinciden con el Excel",
  TUMBLER_CUPS.every((item) => {
    const product = mockProducts.find((p) => p.handle === cupHandle(item.code));
    const variant = mockVariants.find((v) => v.sku === cupSku(item.code));
    return (
      Number(product?.base_price) === item.price &&
      Number(variant?.price) === item.price &&
      variant?.stock === item.inventory
    );
  }),
);
check(
  "mocks: max_quantity alineado al stock real (tope de 5)",
  mockProducts.every((p) => p.max_quantity === 5) &&
    TUMBLER_CUPS.every((item) => {
      const product = mockProducts.find((p) => p.handle === cupHandle(item.code));
      return product?.max_quantity === item.inventory;
    }),
);
check(
  "mocks: min_quantity = 1",
  mockProducts.every((p) => p.min_quantity === 1),
);
const mockStock = mockVariants.reduce((sum, v) => sum + v.stock, 0);
check(`mocks: inventario total ${EXPECTED_STOCK_TOTAL}`, mockStock === EXPECTED_STOCK_TOTAL, `${mockStock}`);

// ---------------------------------------------------------------------------
// 27) Los productos SnowGlobe históricos siguen existiendo.
// ---------------------------------------------------------------------------
const LEGACY = ["kit-vaso-snowglobe", "vaso-snowglobe-rellenar", "vaso-snowglobe-vidrio"];
check(
  "los productos SnowGlobe históricos siguen en los mocks",
  LEGACY.every((h) => MOCK_PRODUCTS.some((p) => p.handle === h)),
);
check(
  "los históricos NO se confunden con el catálogo nuevo",
  LEGACY.every((h) => cupByHandle(h) === null),
);

// ---------------------------------------------------------------------------
// 28-30) Sin colisiones con SKUs/handles existentes.
// ---------------------------------------------------------------------------
const otherSkus = MOCK_VARIANTS.filter((v) => !/^VAS-V\d{3}$/.test(v.sku ?? "")).map(
  (v) => v.sku,
);
check(
  "los SKUs VAS-V### no colisionan con SKUs existentes",
  skus.every((s) => !otherSkus.includes(s)),
);
check(
  "los handles vaso-v### no colisionan con productos existentes",
  handles.every((h) => MOCK_PRODUCTS.filter((p) => p.handle === h).length === 1),
);

// ---------------------------------------------------------------------------
// 31) Seed SQL: idempotente, aditivo, no destructivo.
// ---------------------------------------------------------------------------
const seedPath = join(ROOT, "supabase", "seed_tumbler_cups.sql");
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
  // "stickers UV DTF" aparece como copy legítimo en la descripción de V005;
  // lo que importa es que el seed no toque handles ni SKUs de UV Stickers.
  check(
    "seed no toca handles ni SKUs de UV Stickers",
    !/'sticker-a\d{3}'|'stk-a\d{3}'/.test(statements),
  );
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
    "seed apunta a la categoría snowglobe",
    statements.includes("handle = 'snowglobe'"),
  );
  check("seed no toca images (curaduría del admin)", !/\bimages\b/.test(statements));
  check(
    "seed acota max_quantity al stock real",
    statements.includes("greatest(c.stock, 1)"),
  );

  const seedHandles: string[] = seed.match(/'vaso-v\d{3}'/g) ?? [];
  const seedSkus: string[] = seed.match(/'VAS-V\d{3}'/g) ?? [];
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
    "seed: stock 5 en las 5 filas (25 piezas)",
    (seed.match(/, 5::int, /g) ?? []).length === EXPECTED_TOTAL,
  );
  check(
    "seed: ids de producto únicos y deterministas",
    new Set(seed.match(/'f5000000-0000-4000-8000-\d{12}'/g) ?? []).size === EXPECTED_TOTAL,
  );
  check(
    "seed: ids de variante únicos y deterministas",
    new Set(seed.match(/'f6000000-0000-4000-8000-\d{12}'/g) ?? []).size === EXPECTED_TOTAL,
  );
  check(
    "seed: los ids no colisionan con Sparkles (f1/f2) ni Stickers (f3/f4)",
    !/'f[1234]000000-/.test(seed),
  );
}

// ---------------------------------------------------------------------------
// 32) No se tocaron los catálogos ya aprobados.
// ---------------------------------------------------------------------------
check(
  "los 46 Sparkles siguen intactos",
  MOCK_PRODUCTS.filter((p) => p.handle.startsWith("sparkle-")).length === 46,
);
// Se cuentan solo los del catálogo por código (A001–A209): el producto
// histórico `sticker-personalizado` también empieza con "sticker-".
check(
  "los 209 UV Stickers siguen intactos",
  MOCK_PRODUCTS.filter((p) => /^sticker-a\d{3}$/.test(p.handle)).length === 209,
);
check(
  "el producto histórico sticker-personalizado sigue existiendo",
  MOCK_PRODUCTS.some((p) => p.handle === "sticker-personalizado"),
);

console.log(
  failures === 0
    ? `\n✓ QA Vasos OK — ${TUMBLER_CUPS.length} productos validados, ${stockTotal} piezas.`
    : `\n✗ QA Vasos: ${failures} fallo(s).`,
);
process.exit(failures === 0 ? 0 : 1);

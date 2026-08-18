/**
 * QA del catálogo Sparkles / Glitter Chunky de MatrixLab Tumbler.
 *
 * Valida el módulo fuente (`src/lib/store/tumbler-sparkles.ts`), su espejo en
 * los mocks, el seed SQL y las rutas deterministas de imagen. Falla si algo
 * deja de coincidir con el Excel (`Catalogo_Glitters_MatrixLab.xlsx`).
 *
 * Correr con: npx tsx scripts/qa/tumbler-sparkles.test.ts
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  isLimitedEditionCode,
  matchesSparkleQuery,
  SPARKLE_PLACEHOLDER_IMAGE,
  SPARKLES_CATEGORY_HANDLE,
  sparkleByCode,
  sparkleByHandle,
  sparkleHandle,
  sparkleImagePath,
  sparkleSku,
  TUMBLER_SPARKLES,
} from "../../src/lib/store/tumbler-sparkles";
import { MOCK_CATEGORIES, MOCK_PRODUCTS, MOCK_VARIANTS } from "../../src/lib/store/mock-data";

const ROOT = join(__dirname, "..", "..");

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? " — " + detail : ""}`);
  if (!ok) failures += 1;
}

// ---------------------------------------------------------------------------
// 1) Exactamente 46 productos esperados.
// ---------------------------------------------------------------------------
check("46 Sparkles en el catálogo", TUMBLER_SPARKLES.length === 46, `${TUMBLER_SPARKLES.length}`);

// ---------------------------------------------------------------------------
// 2-4) Códigos, handles y SKUs únicos.
// ---------------------------------------------------------------------------
const codes = TUMBLER_SPARKLES.map((s) => s.code);
const handles = codes.map(sparkleHandle);
const skus = codes.map(sparkleSku);
check("códigos únicos", new Set(codes).size === codes.length);
check("handles únicos", new Set(handles).size === handles.length);
check("SKUs únicos", new Set(skus).size === skus.length);
check(
  "handles válidos para Supabase (^[a-z0-9-]+$)",
  handles.every((h) => /^[a-z0-9-]+$/.test(h)),
);
check(
  "SKUs con prefijo SPK- (sin colisionar con SKUs existentes)",
  skus.every((s) => s.startsWith("SPK-")),
);

// ---------------------------------------------------------------------------
// 5) Precios por familia: 120 clásicos, 165 G001-G004, 145 LE01-LE10.
// ---------------------------------------------------------------------------
for (const item of TUMBLER_SPARKLES) {
  const expected = /^G00[1-4]$/.test(item.code)
    ? 165
    : isLimitedEditionCode(item.code)
      ? 145
      : 120;
  check(
    `precio ${item.code} (${item.name}) = ${expected}`,
    item.price === expected,
    `es ${item.price}`,
  );
}

// ---------------------------------------------------------------------------
// 6) Inventario exactamente igual al Excel.
// ---------------------------------------------------------------------------
const EXCEL_INVENTORY: Record<string, number> = {
  "2002": 2, "2003": 2, "2004": 2, "2006": 2, "2007": 2, "2008": 2, "2009": 2,
  "2010": 2, "2011": 2, "2012": 2, C03R: 2, C06R: 2, "C07R-A": 2, "C07R-B": 2,
  C08R: 2, C09R: 2, C11R: 2, C13R: 2, C14R: 3, C18R: 2, C21R: 2, C31R: 2,
  C32R: 2, C34R: 2, C50R: 2, G001: 4, G002: 4, G003: 4, G004: 4, M001: 4,
  M002: 5, M003: 4, M004: 4, M005: 4, M006: 4, M007: 4, LE01: 1, LE02: 1,
  LE03: 1, LE04: 1, LE05: 1, LE06: 1, LE07: 2, LE08: 1, LE09: 1, LE10: 1,
};
check(
  "el mapa de inventario cubre los 46 códigos",
  Object.keys(EXCEL_INVENTORY).length === 46,
);
for (const item of TUMBLER_SPARKLES) {
  check(
    `inventario ${item.code} = ${EXCEL_INVENTORY[item.code]}`,
    item.inventory === EXCEL_INVENTORY[item.code],
    `es ${item.inventory}`,
  );
}

// ---------------------------------------------------------------------------
// 7-8) Ningún precio <= 0, ningún inventario < 0.
// ---------------------------------------------------------------------------
check("ningún precio <= 0", TUMBLER_SPARKLES.every((s) => s.price > 0));
check("ningún inventario < 0", TUMBLER_SPARKLES.every((s) => s.inventory >= 0));

// ---------------------------------------------------------------------------
// 9) Rutas de imágenes deterministas y placeholder real en disco.
// ---------------------------------------------------------------------------
for (const item of TUMBLER_SPARKLES) {
  const path = sparkleImagePath(item.code);
  check(
    `ruta de imagen determinista ${item.code}`,
    path === `/images/tumbler/sparkles/${item.code.toLowerCase()}.webp` &&
      path === sparkleImagePath(item.code),
    path,
  );
}
check(
  "el placeholder de marca existe en disco",
  existsSync(join(ROOT, "public", SPARKLE_PLACEHOLDER_IMAGE)),
  SPARKLE_PLACEHOLDER_IMAGE,
);

// ---------------------------------------------------------------------------
// 10) Ningún producto duplicado (código o nombre repetido).
// ---------------------------------------------------------------------------
const names = TUMBLER_SPARKLES.map((s) => s.name);
check("nombres públicos únicos", new Set(names).size === names.length);
check(
  "lookup por handle y por código consistente",
  TUMBLER_SPARKLES.every(
    (s) =>
      sparkleByHandle(sparkleHandle(s.code))?.code === s.code &&
      sparkleByCode(s.code)?.code === s.code,
  ),
);

// ---------------------------------------------------------------------------
// 11) Buscador: por nombre y por código interno.
// ---------------------------------------------------------------------------
const dragon = sparkleByCode("C08R")!;
check("buscar 'Dragon' encuentra Dragon Core", matchesSparkleQuery(dragon, "Dragon"));
check("buscar 'C08R' encuentra Dragon Core", matchesSparkleQuery(dragon, "C08R"));
check("buscar 'c08r' (minúsculas) encuentra Dragon Core", matchesSparkleQuery(dragon, "c08r"));
check(
  "buscar 'Glow' devuelve solo coincidencias reales",
  TUMBLER_SPARKLES.filter((s) => matchesSparkleQuery(s, "Glow")).every(
    (s) => /glow/i.test(s.name) || /glow/i.test(s.code),
  ),
);
check(
  "buscar 'Glow' devuelve al menos Pixie Glow, Bubblegum Glow y Moonlight Glow",
  ["C03R", "C18R", "G003"].every((code) =>
    matchesSparkleQuery(sparkleByCode(code)!, "Glow"),
  ),
);

// ---------------------------------------------------------------------------
// 12) Mocks (preview sin Supabase): espejo exacto del catálogo.
// ---------------------------------------------------------------------------
const sparkleCategory = MOCK_CATEGORIES.find(
  (c) => c.handle === SPARKLES_CATEGORY_HANDLE,
);
check(
  `la categoría ${SPARKLES_CATEGORY_HANDLE} existe (la ruta no da 404)`,
  Boolean(sparkleCategory),
);
check(
  "la página de categoría existe en el router",
  existsSync(join(ROOT, "src/app/tienda/categoria/[handle]/page.tsx")),
);

const mockSparkles = MOCK_PRODUCTS.filter((p) => sparkleByHandle(p.handle));
check("46 productos Sparkle en los mocks", mockSparkles.length === 46, `${mockSparkles.length}`);
check(
  "todos los mocks Sparkle cuelgan de la categoría correcta",
  mockSparkles.every((p) => p.category_id === sparkleCategory?.id),
);
check(
  "ids de producto únicos en los mocks",
  new Set(mockSparkles.map((p) => p.id)).size === mockSparkles.length,
);
for (const item of TUMBLER_SPARKLES) {
  const product = MOCK_PRODUCTS.find((p) => p.handle === sparkleHandle(item.code));
  const variant = MOCK_VARIANTS.find((v) => v.sku === sparkleSku(item.code));
  check(
    `mock ${item.code}: producto + variante con precio/stock del Excel`,
    Boolean(product) &&
      Boolean(variant) &&
      product!.title === item.name &&
      Number(product!.base_price) === item.price &&
      Number(variant!.price) === item.price &&
      variant!.stock === item.inventory &&
      variant!.product_id === product!.id,
  );
}

// ---------------------------------------------------------------------------
// 13) Seed SQL: existe, es idempotente y cubre los 46.
// ---------------------------------------------------------------------------
const seedPath = join(ROOT, "supabase/seed_tumbler_sparkles.sql");
check("el seed existe", existsSync(seedPath), "supabase/seed_tumbler_sparkles.sql");
if (existsSync(seedPath)) {
  const seed = readFileSync(seedPath, "utf8");
  // Para las reglas de "no toca X" se ignoran los comentarios SQL.
  const seedCode = seed
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n");
  check(
    "el seed cubre los 46 handles",
    handles.every((h) => seed.includes(`'${h}'`)),
  );
  check("el seed cubre los 46 SKUs", skus.every((s) => seed.includes(`'${s}'`)));
  check(
    "el seed es idempotente (upsert por handle y por sku)",
    seed.includes("on conflict (handle) do update") &&
      seed.includes("on conflict (sku) do update"),
  );
  check(
    "el seed no borra nada",
    !/\bdelete\s+from\b/i.test(seed) && !/\btruncate\b/i.test(seed),
  );
  check(
    "el seed usa la categoría existente sin crear otra",
    seed.includes(`where handle = '${SPARKLES_CATEGORY_HANDLE}'`) &&
      !/insert\s+into\s+public\.categories/i.test(seed),
  );
  check(
    "el seed no toca la columna images (curaduría del admin)",
    !/\bimages\b/i.test(seedCode),
  );
}

console.log(
  failures === 0
    ? `\n✓ QA Sparkles OK — ${TUMBLER_SPARKLES.length} productos validados.`
    : `\n✗ QA Sparkles: ${failures} fallo(s).`,
);
process.exit(failures === 0 ? 0 : 1);

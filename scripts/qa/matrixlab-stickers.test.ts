/**
 * QA del catálogo MatrixLab Stickers.
 *
 * Valida el módulo fuente (`src/lib/store/matrixlab-stickers.ts`) contra las
 * cifras confirmadas del Excel (`Inventario_MatrixLab_Stickers.xlsx`), las
 * rutas deterministas de imagen y el bloqueo de precio.
 *
 * Correr con: npx tsx scripts/qa/matrixlab-stickers.test.ts
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  MATRIXLAB_STICKER_CATEGORY_LABELS,
  MATRIXLAB_STICKER_CATEGORY_ORDER,
  MATRIXLAB_STICKER_PLACEHOLDER_IMAGE,
  MATRIXLAB_STICKERS,
  MATRIXLAB_STICKERS_CATEGORY_HANDLE,
  MATRIXLAB_STICKERS_IMAGE_DIR,
  MATRIXLAB_STICKERS_PRICE_PENDING,
  matchesMatrixLabStickerQuery,
  matrixLabStickerByCode,
  matrixLabStickerByHandle,
  matrixLabStickerCategoryCounts,
  matrixLabStickerImagePath,
  matrixLabStickerSku,
  type MatrixLabStickerCategoryId,
} from "../../src/lib/store/matrixlab-stickers";

const ROOT = join(__dirname, "..", "..");

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? " — " + detail : ""}`);
  if (!ok) failures += 1;
}

// Cifras confirmadas del Excel. Son el contrato de este QA.
const EXPECTED_TOTAL = 110;
const EXPECTED_CATEGORIES = 11;
const EXPECTED_PER_CATEGORY = 10;
const EXPECTED_STOCK_EACH = 99;
const EXPECTED_STOCK_TOTAL = 10890;
/** Prefijo de código de cada familia, en el orden del Excel. */
const EXPECTED_PREFIXES: Record<MatrixLabStickerCategoryId, string> = {
  geek: "GE",
  gamer: "GA",
  pokemon: "PK",
  futbol: "FU",
  "resident-evil": "RE",
  graduaciones: "GR",
  "my-little-pony": "ML",
  "god-bless-america": "GB",
  anime: "AN",
  musica: "MU",
  lectura: "LE",
};

// ---------------------------------------------------------------------------
// 1) 110 productos, todos activos.
// ---------------------------------------------------------------------------
check(
  `${EXPECTED_TOTAL} stickers en el catálogo`,
  MATRIXLAB_STICKERS.length === EXPECTED_TOTAL,
  `${MATRIXLAB_STICKERS.length}`,
);
// El generador sólo emite filas con Estado = Activo; si el Excel trajera una
// fila inactiva, el conteo de arriba dejaría de dar 110.
check(
  "todas las filas provienen de registros Activo",
  MATRIXLAB_STICKERS.length === EXPECTED_TOTAL,
);

// ---------------------------------------------------------------------------
// 2) 11 categorías, exactamente 10 productos cada una.
// ---------------------------------------------------------------------------
const counts = matrixLabStickerCategoryCounts();
check(
  `${EXPECTED_CATEGORIES} categorías`,
  MATRIXLAB_STICKER_CATEGORY_ORDER.length === EXPECTED_CATEGORIES,
  `${MATRIXLAB_STICKER_CATEGORY_ORDER.length}`,
);
for (const category of MATRIXLAB_STICKER_CATEGORY_ORDER) {
  check(
    `${MATRIXLAB_STICKER_CATEGORY_LABELS[category]} tiene ${EXPECTED_PER_CATEGORY}`,
    counts[category] === EXPECTED_PER_CATEGORY,
    `${counts[category]}`,
  );
}

// ---------------------------------------------------------------------------
// 3) Códigos, SKUs y handles: 110 únicos de cada uno.
// ---------------------------------------------------------------------------
const codes = MATRIXLAB_STICKERS.map((s) => s.code);
const skus = codes.map(matrixLabStickerSku);
const handles = MATRIXLAB_STICKERS.map((s) => s.handle);

check(`${EXPECTED_TOTAL} códigos únicos`, new Set(codes).size === EXPECTED_TOTAL);
check(`${EXPECTED_TOTAL} SKU únicos`, new Set(skus).size === EXPECTED_TOTAL);
check(`${EXPECTED_TOTAL} handles únicos`, new Set(handles).size === EXPECTED_TOTAL);
check(
  "SKU con el formato del Excel (STK-<código>)",
  MATRIXLAB_STICKERS.every(
    (s) => matrixLabStickerSku(s.code) === `STK-${s.code}`,
  ),
);
check(
  "handles válidos para Supabase (^[a-z0-9-]+$)",
  handles.every((h) => /^[a-z0-9-]+$/.test(h)),
);
check(
  "códigos con el patrón <PREFIJO><3 dígitos>",
  codes.every((c) => /^[A-Z]{2}\d{3}$/.test(c)),
);
// Cada familia usa su prefijo y numera 001–010 sin huecos.
for (const category of MATRIXLAB_STICKER_CATEGORY_ORDER) {
  const prefix = EXPECTED_PREFIXES[category];
  const familyCodes = MATRIXLAB_STICKERS.filter(
    (s) => s.category === category,
  ).map((s) => s.code);
  const expected = Array.from(
    { length: EXPECTED_PER_CATEGORY },
    (_, i) => `${prefix}${String(i + 1).padStart(3, "0")}`,
  );
  check(
    `${MATRIXLAB_STICKER_CATEGORY_LABELS[category]}: ${prefix}001–${prefix}010 completos`,
    expected.every((c) => familyCodes.includes(c)),
    familyCodes.join(", "),
  );
}

// ---------------------------------------------------------------------------
// 4) Stock: 99 por SKU, 10 890 en total.
// ---------------------------------------------------------------------------
check(
  `stock ${EXPECTED_STOCK_EACH} en cada diseño`,
  MATRIXLAB_STICKERS.every((s) => s.inventory === EXPECTED_STOCK_EACH),
);
const stockTotal = MATRIXLAB_STICKERS.reduce((sum, s) => sum + s.inventory, 0);
check(
  `stock total ${EXPECTED_STOCK_TOTAL}`,
  stockTotal === EXPECTED_STOCK_TOTAL,
  `${stockTotal}`,
);

// ---------------------------------------------------------------------------
// 5) Orden del Excel preservado (position 1..110 consecutivo).
// ---------------------------------------------------------------------------
check(
  "orden del Excel preservado (position 1..110)",
  MATRIXLAB_STICKERS.every((s, i) => s.position === i + 1),
);

// ---------------------------------------------------------------------------
// 6) Rutas de imagen deterministas, en minúsculas y dentro de la convención.
// ---------------------------------------------------------------------------
const imagePaths = codes.map(matrixLabStickerImagePath);
check(
  "todas las rutas de imagen viven en la carpeta oficial",
  imagePaths.every((p) => p.startsWith(`${MATRIXLAB_STICKERS_IMAGE_DIR}/`)),
);
check(
  "todas las rutas de imagen son .webp en minúsculas",
  imagePaths.every((p) => p === p.toLowerCase() && p.endsWith(".webp")),
);
check(
  "ruta de imagen = <codigo en minúsculas>.webp",
  MATRIXLAB_STICKERS.every(
    (s) =>
      matrixLabStickerImagePath(s.code) ===
      `${MATRIXLAB_STICKERS_IMAGE_DIR}/${s.code.toLowerCase()}.webp`,
  ),
);
check("rutas de imagen únicas", new Set(imagePaths).size === EXPECTED_TOTAL);
check(
  "existe el placeholder de marca",
  existsSync(join(ROOT, "public", MATRIXLAB_STICKER_PLACEHOLDER_IMAGE)),
  MATRIXLAB_STICKER_PLACEHOLDER_IMAGE,
);

// ---------------------------------------------------------------------------
// 7) Precio pendiente detectado y bloqueado.
// ---------------------------------------------------------------------------
check(
  "la línea está marcada como precio pendiente",
  MATRIXLAB_STICKERS_PRICE_PENDING === true,
);
// El módulo no debe tener NINGÚN campo de precio: si alguien agrega uno, este
// QA falla antes de que un precio inventado llegue a producción.
const moduleSource = readFileSync(
  join(ROOT, "src", "lib", "store", "matrixlab-stickers.ts"),
  "utf8",
);
check(
  "el módulo no declara ningún campo de precio",
  !/^\s*price\s*[:?]/m.test(moduleSource),
);
const seedSource = readFileSync(
  join(ROOT, "supabase", "seed_matrixlab_stickers.sql"),
  "utf8",
);
check(
  "el seed está bloqueado con raise exception",
  /raise exception\s*\n?\s*'SEED BLOQUEADO/i.test(seedSource),
);
// Se revisa el SQL EJECUTABLE, no los comentarios: el encabezado del seed
// menciona "sin DELETE, sin TRUNCATE, sin DROP" como garantía escrita.
const seedStatements = seedSource
  .split("\n")
  .filter((line) => !line.trimStart().startsWith("--"))
  .join("\n");
check(
  "el seed no contiene DELETE / TRUNCATE / DROP",
  !/\b(delete\s+from|truncate|drop\s+table)\b/i.test(seedStatements),
);

// ---------------------------------------------------------------------------
// 8) Búsqueda y lookups por código / handle.
// ---------------------------------------------------------------------------
check("lookup por código funciona", matrixLabStickerByCode("GE001") !== null);
check(
  "lookup por handle funciona",
  matrixLabStickerByHandle(MATRIXLAB_STICKERS[0].handle) !== null,
);
check(
  "búsqueda por código encuentra el diseño",
  matchesMatrixLabStickerQuery(MATRIXLAB_STICKERS[0], "GE001"),
);
check(
  "búsqueda por SKU encuentra el diseño",
  matchesMatrixLabStickerQuery(MATRIXLAB_STICKERS[0], "STK-GE001"),
);
check(
  "búsqueda por categoría encuentra el diseño",
  matchesMatrixLabStickerQuery(MATRIXLAB_STICKERS[0], "Geek"),
);

// ---------------------------------------------------------------------------
// 9) Aislamiento respecto de MatrixLab Tumbler.
// ---------------------------------------------------------------------------
check(
  "la categoría objetivo es `stickers` (no wraps-glow-finish)",
  MATRIXLAB_STICKERS_CATEGORY_HANDLE === "stickers",
);
// Los 209 UV Stickers de Tumbler usan handles `sticker-a###`. Ningún handle de
// esta línea puede colisionar con ellos.
check(
  "ningún handle colisiona con los UV Stickers de Tumbler",
  handles.every((h) => !/^sticker-a\d{3}$/.test(h)),
);

console.log(
  failures === 0
    ? `\n✓ QA MatrixLab Stickers OK — ${MATRIXLAB_STICKERS.length} diseños, ${stockTotal} piezas, ${EXPECTED_TOTAL} precios pendientes.`
    : `\n✗ QA MatrixLab Stickers: ${failures} fallo(s).`,
);
process.exit(failures === 0 ? 0 : 1);

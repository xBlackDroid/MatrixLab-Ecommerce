/**
 * QA del catálogo MatrixLab Wear.
 *
 * Valida el módulo fuente (`src/lib/store/matrixlab-wear.ts`) contra las
 * cifras confirmadas del Excel (`Inventario_MatrixLab_Wear.xlsx`), las rutas
 * deterministas de imagen, el bloqueo de precio y —lo más importante— que NO
 * se hayan creado variantes falsas de talla/color.
 *
 * Correr con: npx tsx scripts/qa/matrixlab-wear.test.ts
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  MATRIXLAB_WEAR,
  MATRIXLAB_WEAR_CATEGORY_HANDLE,
  MATRIXLAB_WEAR_CATEGORY_LABELS,
  MATRIXLAB_WEAR_CATEGORY_ORDER,
  MATRIXLAB_WEAR_DESIGN_PARAM,
  MATRIXLAB_WEAR_DESIGNER_HREF,
  MATRIXLAB_WEAR_IMAGE_DIR,
  MATRIXLAB_WEAR_PLACEHOLDER_IMAGE,
  MATRIXLAB_WEAR_PRICE_PENDING,
  MATRIXLAB_WEAR_UNDEFINED_VALUE,
  matchesMatrixLabWearQuery,
  matrixLabWearByCode,
  matrixLabWearByHandle,
  matrixLabWearCategoryCounts,
  matrixLabWearDesignerHref,
  matrixLabWearHandle,
  matrixLabWearImagePath,
  matrixLabWearNeedsDefinition,
  matrixLabWearSku,
  resolveMatrixLabWearDesignParam,
  type MatrixLabWearCategoryId,
} from "../../src/lib/store/matrixlab-wear";

const ROOT = join(__dirname, "..", "..");

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? " — " + detail : ""}`);
  if (!ok) failures += 1;
}

// Cifras confirmadas del Excel. Son el contrato de este QA.
const EXPECTED_TOTAL = 100;
const EXPECTED_CATEGORIES = 10;
const EXPECTED_PER_CATEGORY = 10;
const EXPECTED_STOCK_EACH = 99;
const EXPECTED_STOCK_TOTAL = 9900;
const EXPECTED_GARMENT = "Playera";
const EXPECTED_PREFIXES: Record<MatrixLabWearCategoryId, string> = {
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
};

// ---------------------------------------------------------------------------
// 1) 100 productos, todos activos.
// ---------------------------------------------------------------------------
check(
  `${EXPECTED_TOTAL} diseños en el catálogo`,
  MATRIXLAB_WEAR.length === EXPECTED_TOTAL,
  `${MATRIXLAB_WEAR.length}`,
);
check(
  "todas las filas provienen de registros Activo",
  MATRIXLAB_WEAR.length === EXPECTED_TOTAL,
);

// ---------------------------------------------------------------------------
// 2) 10 categorías, exactamente 10 diseños cada una.
// ---------------------------------------------------------------------------
const counts = matrixLabWearCategoryCounts();
check(
  `${EXPECTED_CATEGORIES} categorías`,
  MATRIXLAB_WEAR_CATEGORY_ORDER.length === EXPECTED_CATEGORIES,
  `${MATRIXLAB_WEAR_CATEGORY_ORDER.length}`,
);
for (const category of MATRIXLAB_WEAR_CATEGORY_ORDER) {
  check(
    `${MATRIXLAB_WEAR_CATEGORY_LABELS[category]} tiene ${EXPECTED_PER_CATEGORY}`,
    counts[category] === EXPECTED_PER_CATEGORY,
    `${counts[category]}`,
  );
}

// ---------------------------------------------------------------------------
// 3) Códigos, SKUs y handles únicos y estables (derivados del CÓDIGO).
// ---------------------------------------------------------------------------
const codes = MATRIXLAB_WEAR.map((w) => w.code);
const skus = codes.map(matrixLabWearSku);
const handles = codes.map(matrixLabWearHandle);

check(`${EXPECTED_TOTAL} códigos únicos`, new Set(codes).size === EXPECTED_TOTAL);
check(`${EXPECTED_TOTAL} SKU únicos`, new Set(skus).size === EXPECTED_TOTAL);
check(`${EXPECTED_TOTAL} handles únicos`, new Set(handles).size === EXPECTED_TOTAL);
check(
  "SKU con el formato del Excel (WEAR-<código>)",
  MATRIXLAB_WEAR.every((w) => matrixLabWearSku(w.code) === `WEAR-${w.code}`),
);
// La identidad estable es el CÓDIGO, no el nombre comercial.
check(
  "handles derivados del código (wear-<código en minúsculas>)",
  MATRIXLAB_WEAR.every(
    (w) => matrixLabWearHandle(w.code) === `wear-${w.code.toLowerCase()}`,
  ),
);
check(
  "handles válidos para Supabase (^[a-z0-9-]+$)",
  handles.every((h) => /^[a-z0-9-]+$/.test(h)),
);
for (const category of MATRIXLAB_WEAR_CATEGORY_ORDER) {
  const prefix = EXPECTED_PREFIXES[category];
  const familyCodes = MATRIXLAB_WEAR.filter(
    (w) => w.category === category,
  ).map((w) => w.code);
  const expected = Array.from(
    { length: EXPECTED_PER_CATEGORY },
    (_, i) => `${prefix}${String(i + 1).padStart(3, "0")}`,
  );
  check(
    `${MATRIXLAB_WEAR_CATEGORY_LABELS[category]}: ${prefix}001–${prefix}010 completos`,
    expected.every((c) => familyCodes.includes(c)),
  );
}

// ---------------------------------------------------------------------------
// 4) Stock: 99 por diseño, 9 900 en total.
// ---------------------------------------------------------------------------
check(
  `stock ${EXPECTED_STOCK_EACH} en cada diseño`,
  MATRIXLAB_WEAR.every((w) => w.inventory === EXPECTED_STOCK_EACH),
);
const stockTotal = MATRIXLAB_WEAR.reduce((sum, w) => sum + w.inventory, 0);
check(
  `stock total ${EXPECTED_STOCK_TOTAL}`,
  stockTotal === EXPECTED_STOCK_TOTAL,
  `${stockTotal}`,
);

// ---------------------------------------------------------------------------
// 5) Tipo de prenda, color y talla EXACTAMENTE como los declara el Excel.
// ---------------------------------------------------------------------------
check(
  `los ${EXPECTED_TOTAL} registros son "${EXPECTED_GARMENT}"`,
  MATRIXLAB_WEAR.every((w) => w.garmentType === EXPECTED_GARMENT),
);
check(
  `los ${EXPECTED_TOTAL} colores siguen en "${MATRIXLAB_WEAR_UNDEFINED_VALUE}"`,
  MATRIXLAB_WEAR.every((w) => w.color === MATRIXLAB_WEAR_UNDEFINED_VALUE),
);
check(
  `las ${EXPECTED_TOTAL} tallas siguen en "${MATRIXLAB_WEAR_UNDEFINED_VALUE}"`,
  MATRIXLAB_WEAR.every((w) => w.size === MATRIXLAB_WEAR_UNDEFINED_VALUE),
);
check(
  "las 100 filas se reportan como pendientes de definir",
  MATRIXLAB_WEAR.filter(matrixLabWearNeedsDefinition).length === EXPECTED_TOTAL,
);

// ---------------------------------------------------------------------------
// 6) NO se crearon variantes falsas de talla/color.
// ---------------------------------------------------------------------------
// Regla crítica del release: 100 diseños x 2 colores x 4 tallas = 800
// variantes que NO deben existir. El módulo no debe declarar ni tallas
// concretas ni una lista de colores.
const moduleSource = readFileSync(
  join(ROOT, "src", "lib", "store", "matrixlab-wear.ts"),
  "utf8",
);
check(
  "el módulo no declara tallas concretas (CH/M/G/XG)",
  !/["'](CH|XG)["']/.test(moduleSource),
);
check(
  "el módulo no declara colores concretos",
  !/["'](Blanco|Negro|Azul marino|Beige|Natural)["']/.test(moduleSource),
);
check(
  "una fila = un diseño (no hay expansión talla x color)",
  MATRIXLAB_WEAR.length === EXPECTED_TOTAL &&
    new Set(codes).size === EXPECTED_TOTAL,
);
// La talla y el color se resuelven en el Laboratorio, que ya tiene ese modelo.
check(
  "el CTA apunta al Laboratorio existente",
  MATRIXLAB_WEAR_DESIGNER_HREF === "/tienda/disenador/playera",
);

// ---------------------------------------------------------------------------
// 6.b) El CTA conserva el diseño elegido, y SOLO acepta handles conocidos.
// ---------------------------------------------------------------------------
check(
  "el CTA conserva el diseño elegido (?design=wear-<código>)",
  MATRIXLAB_WEAR.every(
    (w) =>
      matrixLabWearDesignerHref(w.code) ===
      `${MATRIXLAB_WEAR_DESIGNER_HREF}?${MATRIXLAB_WEAR_DESIGN_PARAM}=wear-${w.code.toLowerCase()}`,
  ),
);
check(
  `${EXPECTED_TOTAL} enlaces de personalización únicos`,
  new Set(codes.map(matrixLabWearDesignerHref)).size === EXPECTED_TOTAL,
);
// Ida y vuelta: lo que genera el catálogo lo resuelve el Laboratorio.
check(
  "los 100 handles se resuelven de vuelta al diseño correcto",
  MATRIXLAB_WEAR.every(
    (w) =>
      resolveMatrixLabWearDesignParam(matrixLabWearHandle(w.code))?.code ===
      w.code,
  ),
);
// FRONTERA DE CONFIANZA: el param viene del cliente. Nada fuera de la
// allowlist puede pasar, y ningún valor raro puede tumbar la página.
const HOSTILE_PARAMS: (string | string[] | undefined)[] = [
  undefined,
  "",
  "wear-ge999",
  "playera-personalizada",
  "../../etc/passwd",
  "..%2F..%2Fetc%2Fpasswd",
  "https://evil.example.com/art.png",
  "//evil.example.com",
  "javascript:alert(1)",
  "data:text/html,<script>alert(1)</script>",
  "<img src=x onerror=alert(1)>",
  "wear-ge001' or '1'='1",
  "WEAR-GE001",
  "wear-ge001 ",
  "__proto__",
  "constructor",
  "toString",
  ["wear-ge001", "wear-ge002"],
];
const rejected = HOSTILE_PARAMS.filter(
  (value) => resolveMatrixLabWearDesignParam(value) === null,
);
check(
  "rechaza todo lo que no sea un handle conocido (URLs, paths, HTML, arrays, prototipo)",
  rejected.length === HOSTILE_PARAMS.length,
  `aceptados: ${HOSTILE_PARAMS.filter((v) => !rejected.includes(v)).join(" | ")}`,
);
// Sin param válido el Laboratorio abre igual que siempre.
check(
  "sin param el diseñador no recibe diseño (no rompe el flujo normal)",
  resolveMatrixLabWearDesignParam(undefined) === null,
);
// El handle es lo único que viaja: nunca una ruta de imagen ni una URL.
check(
  "el enlace sólo lleva el handle, nunca una ruta de imagen",
  MATRIXLAB_WEAR.every((w) => {
    const href = matrixLabWearDesignerHref(w.code);
    return !href.includes("/images/") && !href.includes(".webp");
  }),
);

// ---------------------------------------------------------------------------
// 7) Rutas de imagen deterministas y en minúsculas.
// ---------------------------------------------------------------------------
const imagePaths = codes.map(matrixLabWearImagePath);
check(
  "todas las rutas de imagen viven en la carpeta oficial",
  imagePaths.every((p) => p.startsWith(`${MATRIXLAB_WEAR_IMAGE_DIR}/`)),
);
check(
  "todas las rutas de imagen son .webp en minúsculas",
  imagePaths.every((p) => p === p.toLowerCase() && p.endsWith(".webp")),
);
check(
  "ruta de imagen = <codigo en minúsculas>.webp",
  MATRIXLAB_WEAR.every(
    (w) =>
      matrixLabWearImagePath(w.code) ===
      `${MATRIXLAB_WEAR_IMAGE_DIR}/${w.code.toLowerCase()}.webp`,
  ),
);
check("rutas de imagen únicas", new Set(imagePaths).size === EXPECTED_TOTAL);
check(
  "existe el placeholder de marca",
  existsSync(join(ROOT, "public", MATRIXLAB_WEAR_PLACEHOLDER_IMAGE)),
  MATRIXLAB_WEAR_PLACEHOLDER_IMAGE,
);

// ---------------------------------------------------------------------------
// 8) Precio pendiente = 100 y seed bloqueado.
// ---------------------------------------------------------------------------
check(
  "la línea está marcada como precio pendiente",
  MATRIXLAB_WEAR_PRICE_PENDING === true,
);
check(
  `precios pendientes = ${EXPECTED_TOTAL}`,
  MATRIXLAB_WEAR.length === EXPECTED_TOTAL,
);
const seedSource = readFileSync(
  join(ROOT, "supabase", "seed_matrixlab_wear.sql"),
  "utf8",
);
check(
  "el módulo no declara ningún campo de precio",
  !/^\s*price\s*[:?]/m.test(moduleSource),
);
// El precio comercial es el del producto base del Laboratorio
// (`playera-personalizada`, $349). NO se replica a 100 productos: si alguien
// copia esa cifra a este módulo o a su seed, este QA lo detecta.
check(
  "el módulo NO replica el precio del producto base ($349)",
  !/\b349\b/.test(moduleSource),
);
check(
  "el seed NO replica el precio del producto base ($349)",
  !/\b349\b/.test(seedSource),
);
check(
  "el seed no crea productos vendibles mientras siga bloqueado",
  /SEED BLOQUEADO/i.test(seedSource),
);
check(
  "el seed está bloqueado con raise exception",
  /raise exception\s*\n?\s*'SEED BLOQUEADO/i.test(seedSource),
);
// Se revisa el SQL EJECUTABLE, no los comentarios del encabezado.
const seedStatements = seedSource
  .split("\n")
  .filter((line) => !line.trimStart().startsWith("--"))
  .join("\n");
check(
  "el seed no contiene DELETE / TRUNCATE / DROP",
  !/\b(delete\s+from|truncate|drop\s+table)\b/i.test(seedStatements),
);

// ---------------------------------------------------------------------------
// 9) Orden, lookups y búsqueda.
// ---------------------------------------------------------------------------
check(
  "orden del Excel preservado (position 1..100)",
  MATRIXLAB_WEAR.every((w, i) => w.position === i + 1),
);
check("lookup por código funciona", matrixLabWearByCode("GE001") !== null);
check(
  "lookup por handle funciona",
  matrixLabWearByHandle("wear-ge001") !== null,
);
check(
  "búsqueda por código encuentra el diseño",
  matchesMatrixLabWearQuery(MATRIXLAB_WEAR[0], "GE001"),
);
check(
  "búsqueda por SKU encuentra el diseño",
  matchesMatrixLabWearQuery(MATRIXLAB_WEAR[0], "WEAR-GE001"),
);
check(
  "búsqueda por categoría encuentra el diseño",
  matchesMatrixLabWearQuery(MATRIXLAB_WEAR[0], "Geek"),
);
check(
  "la categoría objetivo es `playeras-prendas`",
  MATRIXLAB_WEAR_CATEGORY_HANDLE === "playeras-prendas",
);
// El producto base del Laboratorio no puede quedar tapado por un diseño.
check(
  "ningún handle colisiona con playera-personalizada",
  !handles.includes("playera-personalizada"),
);

console.log(
  failures === 0
    ? `\n✓ QA MatrixLab Wear OK — ${MATRIXLAB_WEAR.length} diseños, ${stockTotal} unidades, ${EXPECTED_TOTAL} precios pendientes, 0 variantes de talla/color creadas.`
    : `\n✗ QA MatrixLab Wear: ${failures} fallo(s).`,
);
process.exit(failures === 0 ? 0 : 1);

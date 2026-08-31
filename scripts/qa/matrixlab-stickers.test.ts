/**
 * QA del catálogo MatrixLab Stickers.
 *
 * Valida el módulo fuente (`src/lib/store/matrixlab-stickers.ts`) contra las
 * cifras confirmadas del Excel (`Inventario_MatrixLab_Stickers.xlsx`), las
 * rutas deterministas de imagen y el precio único confirmado de la línea.
 *
 * UNIDAD COMERCIAL: cada uno de los 110 SKU es una PLANILLA / colección
 * completa a $85, no un sticker suelto. Este QA vigila esa lectura en el
 * módulo, en el seed y en el copy público: un "$85 por pieza" o un $10
 * residual lo hace fallar.
 *
 * Correr con: npx tsx scripts/qa/matrixlab-stickers.test.ts
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  commercialUnitOf,
  curatedLineIdOf,
  isRelatedProductVisible,
} from "../../src/lib/store/curated-lines";
import { MATRIXLAB_WEAR, matrixLabWearHandle } from "../../src/lib/store/matrixlab-wear";
import { MATRIXLAB_3D, matrixLab3dHandle } from "../../src/lib/store/matrixlab-3d";
import { TUMBLER_SPARKLES, sparkleHandle } from "../../src/lib/store/tumbler-sparkles";
import {
  MATRIXLAB_STICKER_CATEGORY_LABELS,
  MATRIXLAB_STICKER_CATEGORY_ORDER,
  MATRIXLAB_STICKER_PLACEHOLDER_IMAGE,
  MATRIXLAB_STICKERS,
  MATRIXLAB_STICKERS_CATEGORY_HANDLE,
  MATRIXLAB_STICKERS_IMAGE_DIR,
  MATRIXLAB_STICKERS_PER_SHEET_MAX,
  MATRIXLAB_STICKERS_PER_SHEET_MIN,
  MATRIXLAB_STICKERS_PRICE_PENDING,
  MATRIXLAB_STICKERS_SHEET_CONTENTS_COPY,
  MATRIXLAB_STICKERS_SHEET_CONTENTS_COPY_LONG,
  MATRIXLAB_STICKERS_SHEET_PRICE,
  MATRIXLAB_STICKERS_UNIT_LABEL,
  MATRIXLAB_STICKERS_UNIT_LABEL_PLURAL,
  matchesMatrixLabStickerQuery,
  matrixLabStickerByCode,
  matrixLabStickerByHandle,
  matrixLabStickerCategoryCounts,
  matrixLabStickerImagePath,
  matrixLabStickerSheetPrice,
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
/** Precio único CONFIRMADO de la línea: $85 por PLANILLA completa. */
const EXPECTED_SHEET_PRICE = 85;
/** Lectura comercial anterior, ya retirada. Ningún $10 puede sobrevivir. */
const RETIRED_PRICE: number = 10;
/** Rango declarado de stickers por planilla (no hay conteo exacto por SKU). */
const EXPECTED_PER_SHEET_MIN = 15;
const EXPECTED_PER_SHEET_MAX = 21;
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
  `${EXPECTED_TOTAL} diseños de planilla en el catálogo`,
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
// 4) Stock: 99 PLANILLAS por SKU, 10 890 planillas en total. La columna H son
//    planillas disponibles, nunca stickers individuales.
// ---------------------------------------------------------------------------
check(
  `stock ${EXPECTED_STOCK_EACH} planillas en cada diseño`,
  MATRIXLAB_STICKERS.every((s) => s.inventory === EXPECTED_STOCK_EACH),
);
const stockTotal = MATRIXLAB_STICKERS.reduce((sum, s) => sum + s.inventory, 0);
check(
  `stock total ${EXPECTED_STOCK_TOTAL} planillas`,
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
// 7) Unidad comercial: PLANILLA. Precio único CONFIRMADO ($85 por planilla),
//    sin rastro del $10 por pieza de la lectura anterior.
// ---------------------------------------------------------------------------
check(
  "la línea ya NO está marcada como precio pendiente",
  MATRIXLAB_STICKERS_PRICE_PENDING === false,
);
check(
  `precio único de la línea = $${EXPECTED_SHEET_PRICE} por planilla`,
  MATRIXLAB_STICKERS_SHEET_PRICE === EXPECTED_SHEET_PRICE,
  `${MATRIXLAB_STICKERS_SHEET_PRICE}`,
);
// El accesor devuelve el constante de línea: es la única vía por la que el
// precio llega a la UI y al generador. (No se recorre el catálogo: hoy el
// precio NO depende de la fila, y fingir cobertura por diseño sería mentir.)
check(
  "el accesor de precio devuelve el constante de la línea",
  matrixLabStickerSheetPrice() === MATRIXLAB_STICKERS_SHEET_PRICE,
  `${matrixLabStickerSheetPrice()}`,
);
// Un precio en 0, negativo o no finito nunca puede pasar como válido.
check(
  "el precio es un número positivo",
  Number.isFinite(MATRIXLAB_STICKERS_SHEET_PRICE) &&
    MATRIXLAB_STICKERS_SHEET_PRICE > 0,
);
// La lectura vieja ($10 por pieza) NO puede volver por ningún lado.
check(
  `ningún precio de la línea vale $${RETIRED_PRICE}`,
  MATRIXLAB_STICKERS_SHEET_PRICE !== RETIRED_PRICE &&
    matrixLabStickerSheetPrice() !== RETIRED_PRICE,
);
// La unidad comercial se declara en el módulo y de ahí la toma la UI.
check(
  "la unidad comercial de la línea es la planilla",
  MATRIXLAB_STICKERS_UNIT_LABEL === "planilla" &&
    MATRIXLAB_STICKERS_UNIT_LABEL_PLURAL === "planillas",
  `${MATRIXLAB_STICKERS_UNIT_LABEL} / ${MATRIXLAB_STICKERS_UNIT_LABEL_PLURAL}`,
);
check(
  `una planilla trae ${EXPECTED_PER_SHEET_MIN} a ${EXPECTED_PER_SHEET_MAX} stickers`,
  MATRIXLAB_STICKERS_PER_SHEET_MIN === EXPECTED_PER_SHEET_MIN &&
    MATRIXLAB_STICKERS_PER_SHEET_MAX === EXPECTED_PER_SHEET_MAX &&
    MATRIXLAB_STICKERS_PER_SHEET_MIN < MATRIXLAB_STICKERS_PER_SHEET_MAX,
);
// El copy sale del rango: si alguien cambia el rango y no el texto, falla.
check(
  "el copy corto declara el rango, no una cifra exacta",
  MATRIXLAB_STICKERS_SHEET_CONTENTS_COPY ===
    `${EXPECTED_PER_SHEET_MIN} a ${EXPECTED_PER_SHEET_MAX} stickers aprox.`,
  MATRIXLAB_STICKERS_SHEET_CONTENTS_COPY,
);
check(
  "el copy largo explica de qué depende el conteo",
  MATRIXLAB_STICKERS_SHEET_CONTENTS_COPY_LONG.includes(
    `${EXPECTED_PER_SHEET_MIN} a ${EXPECTED_PER_SHEET_MAX} stickers`,
  ) && /tamaño de los diseños/i.test(MATRIXLAB_STICKERS_SHEET_CONTENTS_COPY_LONG),
);
// El precio vive en el módulo, no repartido por fila: si alguien mete un
// `price:` por diseño, este QA lo detecta antes de que diverja del seed.
const moduleSource = readFileSync(
  join(ROOT, "src", "lib", "store", "matrixlab-stickers.ts"),
  "utf8",
);
check(
  "el módulo no declara precio por fila (precio único de línea)",
  !/^\s*price\s*[:?]/m.test(moduleSource),
);
// El catálogo servido debe tomar el precio del módulo, no escribir un número.
const productsSource = readFileSync(
  join(ROOT, "src", "lib", "store", "products.ts"),
  "utf8",
);
check(
  "el catálogo alimenta la tarjeta con el precio del módulo",
  /matrixLabStickerSheetPrice\(\)/.test(productsSource),
);
// Ninguna fila declara un conteo propio de stickers: ese dato no existe hoy.
check(
  "el módulo no inventa un conteo de stickers por colección",
  !/stickersPerSheet|stickerCount/i.test(moduleSource),
);

const seedSource = readFileSync(
  join(ROOT, "supabase", "seed_matrixlab_stickers.sql"),
  "utf8",
);
check(
  "el seed ya NO está bloqueado",
  !/SEED BLOQUEADO/i.test(seedSource),
);
// El seed siembra las 110 filas con el MISMO precio del módulo: si alguien
// cambia el constante y no regenera, el seed y la UI divergirían.
const seedPrices = [...seedSource.matchAll(/'STK-[A-Z]{2}\d{3}', (\d+)\)/g)].map(
  (m) => Number(m[1]),
);
check(
  `el seed tiene ${EXPECTED_TOTAL} filas`,
  seedPrices.length === EXPECTED_TOTAL,
  `${seedPrices.length}`,
);
check(
  `las ${EXPECTED_TOTAL} filas del seed valen $${EXPECTED_SHEET_PRICE}`,
  seedPrices.every((p) => p === MATRIXLAB_STICKERS_SHEET_PRICE),
  `distintos: ${[...new Set(seedPrices)].join(", ")}`,
);
check(
  `ninguna fila del seed conserva el precio retirado ($${RETIRED_PRICE})`,
  seedPrices.every((p) => p !== RETIRED_PRICE),
);
// La variante ES la unidad de venta: debe llamarse Planilla, no Pieza.
check(
  "la variante del seed se llama Planilla (no Pieza)",
  /^\s*'Planilla',$/m.test(seedSource) && !/^\s*'Pieza',$/m.test(seedSource),
);
// La ficha pública del producto explica la planilla con el MISMO copy del
// módulo, generado desde él: seed y UI no pueden contar cosas distintas.
const seedCopy = seedSource.match(
  /<generated:matrixlab-stickers-copy>\s*\n\s*'([^']*)'/,
);
check(
  "el seed escribe el copy de la planilla generado desde el módulo",
  seedCopy !== null &&
    seedCopy[1] === MATRIXLAB_STICKERS_SHEET_CONTENTS_COPY_LONG,
  seedCopy?.[1] ?? "sin bloque generado",
);
// La metadata del producto corta a 160 caracteres: si el copy fuera al final,
// la ficha compartida terminaría cortada a media frase.
check(
  "el copy de la planilla encabeza la descripción sembrada",
  /<\/generated:matrixlab-stickers-copy>\s*\n\s*\|\| E'\\n\\n' \|\| s\.description/.test(
    seedSource,
  ),
);
// La ficha del producto muestra `option_label`, no el título de la variante.
check(
  "la opción visible de la variante nombra la planilla",
  /'Planilla · ' \|\| s\.finish_label/.test(seedSource),
);
// La guardia post-siembra debe exigir el precio correcto, no sólo "> 0", y
// compararlo contra el valor GENERADO desde el módulo: si el número viviera a
// mano en el SQL, cambiar el precio y regenerar dejaría la guardia exigiendo
// el precio viejo y abortando cada siembra.
check(
  "la guardia del seed exige el precio de línea por variante",
  /price is distinct from precio_esperado/.test(seedSource),
);
const seedGuardPrice = seedSource.match(
  /<generated:matrixlab-stickers-precio>\s*\n\s*([\d.]+)/,
);
check(
  `el precio generado del seed es $${EXPECTED_SHEET_PRICE}`,
  seedGuardPrice !== null &&
    Number(seedGuardPrice[1]) === MATRIXLAB_STICKERS_SHEET_PRICE,
  seedGuardPrice?.[1] ?? "sin bloque generado",
);
// El seed debe sembrar exactamente los 110 SKU del módulo, sin sobrantes.
const seedSkus = [...seedSource.matchAll(/'(STK-[A-Z]{2}\d{3})'/g)].map(
  (m) => m[1],
);
check(
  "el seed siembra exactamente los SKU del módulo",
  new Set(seedSkus).size === EXPECTED_TOTAL &&
    skus.every((s) => seedSkus.includes(s)),
);
// Debe seguir siendo re-ejecutable: upsert por handle y por sku.
check(
  "el seed es idempotente (on conflict handle + sku)",
  /on conflict \(handle\) do update/i.test(seedSource) &&
    /on conflict \(sku\) do update/i.test(seedSource),
);
check(
  "el seed valida el resultado antes de dar por buena la siembra",
  /raise exception/i.test(seedSource) && /10890/.test(seedSource),
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
// 7b) Copy público: nada puede leerse como "$85 el sticker".
// ---------------------------------------------------------------------------
const catalogSource = readFileSync(
  join(ROOT, "src", "components", "store", "MatrixLabStickersCatalog.tsx"),
  "utf8",
);
// Lo que ve el cliente es el JSX, no los comentarios: estos explican
// justamente por qué NO se dice "por pieza", así que se quitan antes de
// buscar copy prohibido.
// Se quitan bloques /* */ (incluidos los {/* */} de JSX) y comentarios //,
// también los que van al final de una línea de código. El `(^|\s)` evita
// morder un "https://" dentro de una URL.
const catalogCopy = catalogSource
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/(^|\s)\/\/.*$/gm, "$1");
check(
  "la tarjeta no vende por pieza",
  !/\/\s*pieza|por pieza|sticker individual|por sticker/i.test(catalogCopy),
);
check(
  "la tarjeta muestra el precio por planilla",
  /\/\s*\{MATRIXLAB_STICKERS_UNIT_LABEL\}/.test(catalogCopy),
);
check(
  "la tarjeta declara que el producto es una planilla",
  /Planilla de stickers/.test(catalogSource) &&
    /MATRIXLAB_STICKERS_SHEET_CONTENTS_COPY/.test(catalogSource),
);
// El copy no puede quedar hardcodeado con otro rango en la UI.
check(
  "la tarjeta no hardcodea ningún rango de stickers",
  !/\b\d+\s*a\s*\d+\s*stickers/i.test(catalogCopy),
);
// El listado cuenta colecciones, no stickers sueltos.
check(
  "el listado cuenta diseños de planilla, no stickers",
  /diseños de planilla/.test(catalogSource) &&
    !/\{entries\.length\} stickers/.test(catalogSource),
);
const categoryPageSource = readFileSync(
  join(ROOT, "src", "app", "tienda", "categoria", "[handle]", "page.tsx"),
  "utf8",
);
check(
  "el encabezado de la categoría no promete 110 stickers",
  /\$\{catalog\.entries\.length\} diseños de planilla/.test(
    categoryPageSource,
  ),
);
// El generador debe leer el MISMO constante: una sola fuente de verdad.
const generatorSource = readFileSync(
  join(ROOT, "scripts", "data", "build-matrixlab-catalogs.py"),
  "utf8",
);
check(
  "el generador lee el precio del módulo (fuente única)",
  /MATRIXLAB_STICKERS_SHEET_PRICE/.test(generatorSource) &&
    !/MATRIXLAB_STICKERS_UNIT_PRICE/.test(generatorSource),
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

// ---------------------------------------------------------------------------
// 10) Relacionados: la ficha de una planilla NO recomienda lo que la vitrina
//     esconde. El producto histórico del Laboratorio ("Planilla de stickers",
//     $199) vive en la MISMA categoría `stickers` y aparecía como relacionado
//     junto a una planilla de $85.
// ---------------------------------------------------------------------------
/** Handle real del producto genérico previo (supabase/seed_designer_base_v2.sql). */
const LEGACY_SHEET_HANDLE = "planilla-stickers";
/** Otros genéricos históricos que la categoría `stickers` puede contener. */
const LEGACY_CATEGORY_HANDLES = [
  LEGACY_SHEET_HANDLE,
  "sticker-personalizado",
  "stickers-personalizados",
];

check(
  "las 110 planillas pertenecen a la línea curada",
  handles.every((h) => curatedLineIdOf(h) === "matrixlab-stickers"),
);
check(
  `ninguna de las ${EXPECTED_TOTAL} planillas recomienda ${LEGACY_SHEET_HANDLE}`,
  handles.every((h) => !isRelatedProductVisible(h, LEGACY_SHEET_HANDLE)),
);
check(
  "ningún genérico legacy de la categoría entra como relacionado",
  handles.every((h) =>
    LEGACY_CATEGORY_HANDLES.every((legacy) => !isRelatedProductVisible(h, legacy)),
  ),
);
// El producto legacy NO se toca: sigue existiendo y su propia ficha conserva
// el comportamiento anterior (no se le filtra nada).
check(
  "la ficha del producto legacy conserva sus relacionados de siempre",
  curatedLineIdOf(LEGACY_SHEET_HANDLE) === null &&
    isRelatedProductVisible(LEGACY_SHEET_HANDLE, handles[0]) &&
    isRelatedProductVisible(LEGACY_SHEET_HANDLE, "cualquier-otro-handle"),
);
// Entre ellas SÍ se recomiendan: el filtro no vacía la sección.
check(
  "las planillas se recomiendan entre sí",
  isRelatedProductVisible(handles[0], handles[1]) &&
    isRelatedProductVisible(handles[0], handles[EXPECTED_TOTAL - 1]),
);
// Y no se cuelan diseños de otra línea MatrixLab aunque compartieran categoría.
check(
  "una planilla no recomienda un diseño de MatrixLab Wear",
  !isRelatedProductVisible(handles[0], matrixLabWearHandle(MATRIXLAB_WEAR[0].code)),
);
// El filtro es EXCLUSIVO de Stickers: es la única categoría donde el genérico
// histórico compite de frente (dos "planillas" a $199 y a $85). En Wear y 3D
// los genéricos son las piezas personalizables del Laboratorio —la entrada al
// diseñador desde la ficha— y sus relacionados NO se tocan.
const wearSample = matrixLabWearHandle(MATRIXLAB_WEAR[0].code);
check(
  "MatrixLab Wear conserva sus relacionados del Laboratorio",
  curatedLineIdOf(wearSample) === "matrixlab-wear" &&
    isRelatedProductVisible(wearSample, "playera-personalizada") &&
    isRelatedProductVisible(wearSample, "sudadera-personalizada") &&
    isRelatedProductVisible(wearSample, "tote-bag-personalizada"),
);
check(
  "MatrixLab 3D conserva sus relacionados del Laboratorio",
  isRelatedProductVisible(
    matrixLab3dHandle(MATRIXLAB_3D[0].code),
    "pieza-3d-personalizada",
  ),
);
// REGRESIÓN: nada de Tumbler ni de otras categorías queda filtrado. Sus fichas
// no pertenecen a ninguna línea registrada, así que no se les aplica política.
const sparkleSample = sparkleHandle(TUMBLER_SPARKLES[0].code);
check(
  "Tumbler y el resto del catálogo no cambian de relacionados",
  curatedLineIdOf(sparkleSample) === null &&
    isRelatedProductVisible(sparkleSample, "glitter-chunky-para-vasos") &&
    isRelatedProductVisible("sticker-a001", LEGACY_SHEET_HANDLE) &&
    isRelatedProductVisible("vaso-24oz", "cualquier-otro-handle"),
);
check(
  "el filtro no depende de handles escritos a mano",
  !/planilla-stickers/.test(
    readFileSync(join(ROOT, "src", "lib", "store", "curated-lines.ts"), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, ""),
  ),
);
check(
  "getRelatedProducts aplica la política pública de la categoría",
  /isRelatedProductVisible\(product\.handle, p\.handle\)/.test(productsSource),
);

// ---------------------------------------------------------------------------
// 11) Unidad comercial resuelta en servidor (la usa el carrito).
// ---------------------------------------------------------------------------
check(
  "las 110 planillas resuelven unidad planilla/planillas",
  handles.every((h) => {
    const unit = commercialUnitOf(h);
    return unit?.one === "planilla" && unit?.many === "planillas";
  }),
);
check(
  "Tumbler, Wear, 3D y el resto siguen SIN unidad propia",
  commercialUnitOf(sparkleSample) === null &&
    commercialUnitOf("sticker-a001") === null &&
    commercialUnitOf(matrixLabWearHandle(MATRIXLAB_WEAR[0].code)) === null &&
    commercialUnitOf(LEGACY_SHEET_HANDLE) === null &&
    commercialUnitOf("") === null,
);
// La unidad NO puede deducirse del precio: otro producto puede costar $85 sin
// ser una planilla. Se revisa el CÓDIGO, no los comentarios (que sí citan los
// precios para explicar el porqué del filtro).
const curatedSource = readFileSync(
  join(ROOT, "src", "lib", "store", "curated-lines.ts"),
  "utf8",
);
const curatedCode = curatedSource
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/(^|\s)\/\/.*$/gm, "$1");
check(
  "la unidad no se infiere del precio",
  !/price|base_price|85/.test(curatedCode),
);

console.log(
  failures === 0
    ? `\n✓ QA MatrixLab Stickers OK — ${MATRIXLAB_STICKERS.length} diseños de planilla, ${stockTotal} planillas, precio único $${MATRIXLAB_STICKERS_SHEET_PRICE} por ${MATRIXLAB_STICKERS_UNIT_LABEL}, 0 precios pendientes.`
    : `\n✗ QA MatrixLab Stickers: ${failures} fallo(s).`,
);
process.exit(failures === 0 ? 0 : 1);

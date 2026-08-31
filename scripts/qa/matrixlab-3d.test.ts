/**
 * QA del catálogo MatrixLab 3D.
 *
 * Valida el módulo fuente (`src/lib/store/matrixlab-3d.ts`) contra las cifras
 * confirmadas del Excel (`Inventario_MatrixLab_3D.xlsx`), las rutas
 * deterministas de imagen y el bloqueo de precio.
 *
 * Correr con: npx tsx scripts/qa/matrixlab-3d.test.ts
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  MATRIXLAB_3D,
  MATRIXLAB_3D_CATEGORY_HANDLE,
  MATRIXLAB_3D_CATEGORY_LABELS,
  MATRIXLAB_3D_CATEGORY_ORDER,
  MATRIXLAB_3D_IMAGE_DIR,
  MATRIXLAB_3D_PLACEHOLDER_IMAGE,
  MATRIXLAB_3D_PRICE_PENDING,
  matrixLab3dByCode,
  matrixLab3dByHandle,
  matrixLab3dCategoryCounts,
  matrixLab3dCustomizable,
  matrixLab3dHandle,
  matrixLab3dImagePath,
  matrixLab3dSku,
  type MatrixLab3dCategoryId,
} from "../../src/lib/store/matrixlab-3d";

const ROOT = join(__dirname, "..", "..");

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? " — " + detail : ""}`);
  if (!ok) failures += 1;
}

// Cifras confirmadas del Excel. Son el contrato de este QA.
const EXPECTED_TOTAL = 7;
const EXPECTED_CATEGORIES = 6;
const EXPECTED_STOCK_EACH = 99;
const EXPECTED_STOCK_TOTAL = 693;
const EXPECTED_CUSTOMIZABLE = 3;
const EXPECTED_NOT_CUSTOMIZABLE = 4;
/** Conteo exacto por categoría (Organizadores agrupa 2). */
const EXPECTED_BY_CATEGORY: Record<MatrixLab3dCategoryId, number> = {
  "lamparas-rgb": 1,
  calendarios: 1,
  "decoracion-escolar": 1,
  organizadores: 2,
  coleccionables: 1,
  personalizados: 1,
};
/** Códigos que el Excel marca como personalizables. */
const EXPECTED_CUSTOM_CODES = ["3D004", "3D005", "3D007"];

// ---------------------------------------------------------------------------
// 1) 7 piezas, todas activas.
// ---------------------------------------------------------------------------
check(
  `${EXPECTED_TOTAL} piezas en el catálogo`,
  MATRIXLAB_3D.length === EXPECTED_TOTAL,
  `${MATRIXLAB_3D.length}`,
);

// ---------------------------------------------------------------------------
// 2) 6 categorías con el conteo exacto (Organizadores = 2).
// ---------------------------------------------------------------------------
const counts = matrixLab3dCategoryCounts();
check(
  `${EXPECTED_CATEGORIES} categorías`,
  MATRIXLAB_3D_CATEGORY_ORDER.length === EXPECTED_CATEGORIES,
  `${MATRIXLAB_3D_CATEGORY_ORDER.length}`,
);
for (const category of MATRIXLAB_3D_CATEGORY_ORDER) {
  check(
    `${MATRIXLAB_3D_CATEGORY_LABELS[category]} = ${EXPECTED_BY_CATEGORY[category]}`,
    counts[category] === EXPECTED_BY_CATEGORY[category],
    `${counts[category]}`,
  );
}

// ---------------------------------------------------------------------------
// 3) Códigos, SKUs y handles únicos y estables (derivados del CÓDIGO).
// ---------------------------------------------------------------------------
const codes = MATRIXLAB_3D.map((p) => p.code);
const skus = codes.map(matrixLab3dSku);
const handles = codes.map(matrixLab3dHandle);

check(`${EXPECTED_TOTAL} códigos únicos`, new Set(codes).size === EXPECTED_TOTAL);
check(`${EXPECTED_TOTAL} SKU únicos`, new Set(skus).size === EXPECTED_TOTAL);
check(`${EXPECTED_TOTAL} handles únicos`, new Set(handles).size === EXPECTED_TOTAL);
check(
  "códigos 3D001–3D007 completos",
  Array.from(
    { length: EXPECTED_TOTAL },
    (_, i) => `3D00${i + 1}`,
  ).every((c) => codes.includes(c)),
  codes.join(", "),
);
check(
  "SKU con el formato del Excel (ML3D-<código>)",
  MATRIXLAB_3D.every((p) => matrixLab3dSku(p.code) === `ML3D-${p.code}`),
);
check(
  "handles derivados del código (ml3d-<código en minúsculas>)",
  MATRIXLAB_3D.every(
    (p) => matrixLab3dHandle(p.code) === `ml3d-${p.code.toLowerCase()}`,
  ),
);
check(
  "handles válidos para Supabase (^[a-z0-9-]+$)",
  handles.every((h) => /^[a-z0-9-]+$/.test(h)),
);

// ---------------------------------------------------------------------------
// 4) Stock: 99 por pieza, 693 en total.
// ---------------------------------------------------------------------------
check(
  `stock ${EXPECTED_STOCK_EACH} en cada pieza`,
  MATRIXLAB_3D.every((p) => p.inventory === EXPECTED_STOCK_EACH),
);
const stockTotal = MATRIXLAB_3D.reduce((sum, p) => sum + p.inventory, 0);
check(
  `stock total ${EXPECTED_STOCK_TOTAL}`,
  stockTotal === EXPECTED_STOCK_TOTAL,
  `${stockTotal}`,
);

// ---------------------------------------------------------------------------
// 5) Personalizable: 3 sí / 4 no, y exactamente 3D004, 3D005 y 3D007.
// ---------------------------------------------------------------------------
const customizable = matrixLab3dCustomizable();
check(
  `personalizables = ${EXPECTED_CUSTOMIZABLE}`,
  customizable.length === EXPECTED_CUSTOMIZABLE,
  `${customizable.length}`,
);
check(
  `no personalizables = ${EXPECTED_NOT_CUSTOMIZABLE}`,
  MATRIXLAB_3D.filter((p) => !p.customizable).length ===
    EXPECTED_NOT_CUSTOMIZABLE,
);
check(
  "los personalizables son 3D004, 3D005 y 3D007",
  EXPECTED_CUSTOM_CODES.every((c) =>
    customizable.some((p) => p.code === c),
  ) && customizable.length === EXPECTED_CUSTOM_CODES.length,
  customizable.map((p) => p.code).join(", "),
);

// ---------------------------------------------------------------------------
// 6) Rutas de imagen deterministas y en minúsculas.
// ---------------------------------------------------------------------------
const imagePaths = codes.map(matrixLab3dImagePath);
check(
  "todas las rutas de imagen viven en la carpeta oficial",
  imagePaths.every((p) => p.startsWith(`${MATRIXLAB_3D_IMAGE_DIR}/`)),
);
check(
  "todas las rutas de imagen son .webp en minúsculas",
  imagePaths.every((p) => p === p.toLowerCase() && p.endsWith(".webp")),
);
check(
  "ruta de imagen = <codigo en minúsculas>.webp",
  MATRIXLAB_3D.every(
    (p) =>
      matrixLab3dImagePath(p.code) ===
      `${MATRIXLAB_3D_IMAGE_DIR}/${p.code.toLowerCase()}.webp`,
  ),
);
check("rutas de imagen únicas", new Set(imagePaths).size === EXPECTED_TOTAL);
check(
  "existe el placeholder de marca",
  existsSync(join(ROOT, "public", MATRIXLAB_3D_PLACEHOLDER_IMAGE)),
  MATRIXLAB_3D_PLACEHOLDER_IMAGE,
);

// ---------------------------------------------------------------------------
// 7) Precio pendiente = 7 y seed bloqueado.
// ---------------------------------------------------------------------------
check(
  "la línea está marcada como precio pendiente",
  MATRIXLAB_3D_PRICE_PENDING === true,
);
check(
  `precios pendientes = ${EXPECTED_TOTAL}`,
  MATRIXLAB_3D.length === EXPECTED_TOTAL,
);
const moduleSource = readFileSync(
  join(ROOT, "src", "lib", "store", "matrixlab-3d.ts"),
  "utf8",
);
check(
  "el módulo no declara ningún campo de precio",
  !/^\s*price\s*[:?]/m.test(moduleSource),
);
const seedSource = readFileSync(
  join(ROOT, "supabase", "seed_matrixlab_3d.sql"),
  "utf8",
);
check(
  "el seed está bloqueado con raise exception",
  /raise exception\s*\n?\s*'SEED BLOQUEADO/i.test(seedSource),
);
// El seed no puede crear productos comerciales mientras falten los 7 precios.
check(
  "el seed no siembra ninguna fila con precio",
  !/ML3D-3D\d{3}',\s*\d/.test(seedSource),
);

// La tarjeta nunca puede mostrar $0 ni un precio inventado: mientras el precio
// sea null la UI muestra "Precio por confirmar" y un CTA de consulta.
const catalogSource = readFileSync(
  join(ROOT, "src", "components", "store", "MatrixLab3DCatalog.tsx"),
  "utf8",
);
check(
  "la UI muestra 'Precio por confirmar' cuando no hay precio",
  /Precio por confirmar/.test(catalogSource),
);
check(
  "la UI no imprime un precio por defecto (0 / $0)",
  !/formatPrice\(\s*0\s*\)/.test(catalogSource) &&
    !/\$0/.test(catalogSource),
);
check(
  "el CTA pide precio o personalización en lugar de vender",
  /Consultar precio/.test(catalogSource) &&
    /Consultar personalizaci/.test(catalogSource),
);
check(
  "las piezas personalizables se destacan con badge",
  /Personalizable/.test(catalogSource),
);
// No se construyó un configurador 3D nuevo: la personalización se atiende por
// WhatsApp. Se revisa el CÓDIGO, no los comentarios (que sí mencionan la
// palabra "configurador" para explicar justamente que no existe).
const catalogCode = catalogSource
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, "")
  .replace(/^\s*\/\/.*$/gm, "");
check(
  "no se introdujo un configurador 3D (sin ruta de diseñador)",
  !/\/tienda\/disenador/.test(catalogCode),
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
// 8) Orden, lookups y aislamiento.
// ---------------------------------------------------------------------------
check(
  "orden del Excel preservado (position 1..7)",
  MATRIXLAB_3D.every((p, i) => p.position === i + 1),
);
check("lookup por código funciona", matrixLab3dByCode("3D001") !== null);
check("lookup por handle funciona", matrixLab3dByHandle("ml3d-3d001") !== null);
check(
  "la categoría objetivo es `impresion-3d`",
  MATRIXLAB_3D_CATEGORY_HANDLE === "impresion-3d",
);
// El producto genérico histórico no puede quedar tapado por una pieza.
check(
  "ningún handle colisiona con pieza-3d-personalizada",
  !handles.includes("pieza-3d-personalizada"),
);

console.log(
  failures === 0
    ? `\n✓ QA MatrixLab 3D OK — ${MATRIXLAB_3D.length} piezas, ${stockTotal} unidades, ${EXPECTED_TOTAL} precios pendientes, ${customizable.length} personalizables.`
    : `\n✗ QA MatrixLab 3D: ${failures} fallo(s).`,
);
process.exit(failures === 0 ? 0 : 1);

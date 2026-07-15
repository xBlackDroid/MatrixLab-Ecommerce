/**
 * QA del mapeo canónico ruta/tipo de diseñador → handle REAL de Supabase.
 *
 * Falla si cualquier tipo de diseñador, alias de ruta o entrada del catálogo
 * del laboratorio deja de resolver a uno de los 11 handles confirmados en
 * producción (seed_designer_base_v2 ejecutado y validado).
 *
 * Correr con: npx tsx scripts/qa/designer-handles.test.ts
 */
import {
  CANONICAL_DESIGNER_HANDLES,
  DESIGNER_HANDLE_TO_TYPE,
  DESIGNER_PRODUCT_HANDLE_MAP,
  resolveDesignerHandle,
} from "../../src/lib/designer/product-handles";
import {
  DESIGNER_CATALOG,
  DESIGNER_TYPE_TO_HANDLE,
} from "../../src/lib/designer/product-catalog";

/** Los 11 handles confirmados en Supabase PRODUCCIÓN (2026-07-15). */
const PRODUCTION_HANDLES = new Set([
  "etiquetas-escolares-personalizadas",
  "gorra-clasica-personalizada",
  "gorra-personalizada",
  "gorra-trucker-personalizada",
  "grabado-laser-personalizado",
  "pieza-3d-personalizada",
  "planilla-imanes",
  "planilla-stickers",
  "playera-personalizada",
  "sudadera-personalizada",
  "tote-bag-personalizada",
]);

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? " — " + detail : ""}`);
  if (!ok) failures += 1;
}

// 1) Todo valor del mapa canónico existe en producción.
for (const [alias, handle] of Object.entries(DESIGNER_PRODUCT_HANDLE_MAP)) {
  check(
    `mapa: ${alias} → ${handle} existe en producción`,
    PRODUCTION_HANDLES.has(handle),
  );
}

// 2) El set canónico coincide con el mapa.
check(
  "CANONICAL_DESIGNER_HANDLES ⊆ handles de producción",
  [...CANONICAL_DESIGNER_HANDLES].every((h) => PRODUCTION_HANDLES.has(h)),
);

// 3) Cada entrada del catálogo del laboratorio usa un baseHandle real y
//    consistente con resolveDesignerHandle(tipo).
for (const entry of Object.values(DESIGNER_CATALOG)) {
  check(
    `catálogo: ${entry.id} → ${entry.baseHandle} es handle real`,
    PRODUCTION_HANDLES.has(entry.baseHandle),
  );
  check(
    `catálogo: resolveDesignerHandle('${entry.id}') === baseHandle`,
    resolveDesignerHandle(entry.id) === entry.baseHandle,
    `${resolveDesignerHandle(entry.id)} vs ${entry.baseHandle}`,
  );
}

// 4) DESIGNER_TYPE_TO_HANDLE (derivado del catálogo) queda alineado al mapa.
for (const [type, handle] of Object.entries(DESIGNER_TYPE_TO_HANDLE)) {
  check(
    `tipo→handle: ${type} → ${handle}`,
    resolveDesignerHandle(type) === handle && PRODUCTION_HANDLES.has(handle),
  );
}

// 5) Mapa inverso (handle → tipo) regresa al mismo handle.
for (const [handle, type] of Object.entries(DESIGNER_HANDLE_TO_TYPE)) {
  check(
    `handle→tipo: ${handle} → ${type} → ${resolveDesignerHandle(type)}`,
    resolveDesignerHandle(type) === handle,
  );
}

// 6) Un handle ya canónico pasa intacto; un alias con mayúsculas/espacios
//    también resuelve; un handle desconocido regresa tal cual.
check(
  "idempotencia: handle canónico pasa intacto",
  resolveDesignerHandle("playera-personalizada") === "playera-personalizada",
);
check(
  "normalización: ' Playera ' → playera-personalizada",
  resolveDesignerHandle(" Playera ") === "playera-personalizada",
);
check(
  "desconocido: pasa tal cual (decide el resolver)",
  resolveDesignerHandle("algo-inexistente") === "algo-inexistente",
);

console.log(
  failures === 0
    ? "\nMapeo canónico ruta/tipo → handle de producción: OK"
    : `\n${failures} inconsistencia(s) de mapeo.`,
);
process.exit(failures === 0 ? 0 : 1);

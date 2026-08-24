/**
 * MatrixLab Tumbler — catálogo de Vasos.
 *
 * FUENTE DE VERDAD COMERCIAL: `Catalogo_Vasos_MatrixLab.xlsx`
 * (hoja "Catalogo Vasos"). De ese archivo se toman EXCLUSIVAMENTE:
 *
 *   columna B -> `code`         (código interno, V001–V005)
 *   columna C -> `name`         (nombre público)
 *   columna D -> `collection`   (colección comercial)
 *   columna F -> `description`  (descripción pública)
 *   columna G -> `capacity`     (capacidad / tipo)
 *   columna H -> `inventory`    (inventario real en piezas)
 *   columna I -> `sku`          (VAS-<código>)
 *   columna J -> `price`        (precio unitario)
 *   columna L -> `handle`       (vaso-<código en minúsculas>)
 *   columna M -> ruta de imagen (/images/tumbler/vasos/<código>.webp)
 *
 * NO se usa la columna K ("Total"): es inventario x precio, no precio unitario.
 *
 * INVENTARIO: la columna H del Excel llegó vacía. El inventario inicial de
 * este release está CONFIRMADO manualmente en 5 piezas por SKU (25 en total);
 * una celda vacía NO se interpreta como 0.
 *
 * El orden del arreglo es el orden EXACTO del Excel (V001 → V005) y es el
 * orden público por defecto: no se reordena alfabéticamente ni por precio.
 *
 * Este módulo es la fuente única para catálogo, seed y QA.
 */

/**
 * Handle de la categoría donde viven los vasos.
 *
 * AUDITORÍA: el catálogo no tenía una categoría de vasos base. Las 8
 * subcategorías de MatrixLab Tumbler son snowglobe, llaveros, tags-acrilico,
 * acrilicos, accesorios-personalizacion, repuestos-consumibles (Sparkles),
 * magic-flow y wraps-glow-finish (UV Stickers). La única que ya contenía
 * vasos es `snowglobe` ("SnowGlobe Bar"), así que los 5 vasos se publican ahí
 * y NO se crea una segunda categoría. El nombre visible NO se cambia.
 */
export const CUPS_CATEGORY_HANDLE = "snowglobe";

/** Carpeta pública de las fotos, vinculadas por CÓDIGO (no por nombre). */
export const CUPS_IMAGE_DIR = "/images/tumbler/vasos";

/** Placeholder de marca para los vasos que aún no tienen fotografía. */
export const CUP_PLACEHOLDER_IMAGE = `${CUPS_IMAGE_DIR}/placeholder.webp`;

export interface CupItem {
  /** Posición en el Excel (1-5). Define el orden público por defecto. */
  position: number;
  /** Código interno (columna B). */
  code: string;
  /** Nombre público (columna C). */
  name: string;
  /** Colección comercial (columna D). */
  collection: string;
  /** Descripción pública (columna F). */
  description: string;
  /** Capacidad / tipo tal como lo declara el Excel (columna G). */
  capacity: string;
  /** Inventario real en piezas (columna H, confirmado para este release). */
  inventory: number;
  /** Precio unitario (columna J). */
  price: number;
}

/** Los 5 vasos del Excel, en su orden original. */
export const TUMBLER_CUPS: readonly CupItem[] = [
  {
    position: 1,
    code: "V001",
    name: "24 oz Transparente",
    collection: "Colección Clásica",
    description:
      "Vaso clásico de 24 oz con diseño limpio y versátil. Su acabado completamente transparente permite que colores, glitters y efectos sean los protagonistas.",
    capacity: "24 oz - Transparente",
    inventory: 5,
    price: 155,
  },
  {
    position: 2,
    code: "V002",
    name: "24 oz Tapa de Color",
    collection: "Color Collection",
    description:
      "Vaso de 24 oz con tapa de color. Mantiene la calidad de la colección clásica y permite crear combinaciones más originales.",
    capacity: "24 oz - Tapa de color",
    inventory: 5,
    price: 175,
  },
  {
    position: 3,
    code: "V003",
    name: "24 oz Slip",
    collection: "Slip Collection",
    description:
      "Vaso de 24 oz con tapa tipo Slip, diseño limpio y cómodo para uso diario. Estilo contemporáneo y funcional para personalización.",
    capacity: "24 oz - Slip",
    inventory: 5,
    price: 165,
  },
  {
    position: 4,
    code: "V004",
    name: "20 oz Slip",
    collection: "Slip Collection",
    description:
      "Vaso de 20 oz con tapa tipo Slip, diseño limpio y cómodo para uso diario. Estilo contemporáneo y funcional para personalización.",
    capacity: "20 oz - Slip",
    inventory: 5,
    price: 155,
  },
  {
    position: 5,
    code: "V005",
    name: "16 oz Can",
    collection: "Can Collection",
    description:
      "Vaso de 16 oz inspirado en las clásicas latas de bebidas. Compacto, elegante y popular para personalizar con glitter, vinil y stickers UV DTF.",
    capacity: "16 oz - Can",
    inventory: 5,
    price: 135,
  },
];

/**
 * Colecciones reales presentes en el Excel, en orden de primera aparición.
 * No se inventa ninguna: si mañana el Excel trae otra, aparece sola aquí.
 */
export const CUP_COLLECTIONS: readonly string[] = [
  ...new Set(TUMBLER_CUPS.map((item) => item.collection)),
];

/** Código normalizado para archivos/handles: minúsculas. */
export function cupCodeSlug(code: string): string {
  return code.toLowerCase();
}

/**
 * Handle estable del producto (columna L). Se deriva del CÓDIGO, nunca del
 * nombre comercial: si el nombre cambia, la URL y la imagen siguen sirviendo.
 */
export function cupHandle(code: string): string {
  return `vaso-${cupCodeSlug(code)}`;
}

/** SKU de la variante (columna I). Prefijo VAS- definido por el Excel. */
export function cupSku(code: string): string {
  return `VAS-${code.toUpperCase()}`;
}

/**
 * Ruta determinista de la fotografía (columna M), vinculada por código.
 * Publicar una foto es copiar `public/images/tumbler/vasos/<codigo>.webp`:
 * no se toca ni el código ni Supabase.
 */
export function cupImagePath(code: string): string {
  return `${CUPS_IMAGE_DIR}/${cupCodeSlug(code)}.webp`;
}

/** Etiqueta de referencia mostrada de forma discreta en la tarjeta. */
export function cupRefLabel(code: string): string {
  return `Ref. ${code}`;
}

/** Descripción pública: la del Excel más la colección y la referencia. */
export function cupDescription(item: CupItem): string {
  return `${item.description} Colección ${item.collection}. Ref. ${item.code}.`;
}

const BY_HANDLE = new Map(TUMBLER_CUPS.map((item) => [cupHandle(item.code), item]));

/** Vaso a partir del handle del producto; null si no es un vaso del catálogo. */
export function cupByHandle(handle: string): CupItem | null {
  return BY_HANDLE.get(handle) ?? null;
}

const BY_CODE = new Map(TUMBLER_CUPS.map((item) => [item.code.toUpperCase(), item]));

/** Vaso a partir de su código interno. */
export function cupByCode(code: string): CupItem | null {
  return BY_CODE.get(code.toUpperCase()) ?? null;
}

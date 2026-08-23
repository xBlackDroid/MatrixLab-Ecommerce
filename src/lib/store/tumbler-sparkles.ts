/**
 * MatrixLab Tumbler — catálogo Sparkles / Glitter Chunky.
 *
 * FUENTE DE VERDAD COMERCIAL: `Catalogo_Glitters_MatrixLab.xlsx`
 * (hoja "Catálogo de Glitters"). De ese archivo se toman EXCLUSIVAMENTE:
 *
 *   columna B -> `code`        (código interno)
 *   columna C -> `name`        (nombre público)
 *   columna D -> `collection`  (colección; null si la celda está vacía)
 *   columna H -> `inventory`   (inventario real envasado, en piezas)
 *   columna J -> `price`       (precio público por bote)
 *
 * NO se usan costo, gramaje ni fórmulas internas. Si el PDF de referencia
 * contradice al Excel, gana el Excel (p. ej. Limited Edition = $145).
 *
 * El orden del arreglo es el orden EXACTO del Excel y es el orden público
 * por defecto de la categoría: no se reordena alfabéticamente.
 *
 * Este módulo es la fuente única para catálogo, seed y QA. Al actualizar el
 * Excel, regenerar aquí y volver a correr `supabase/seed_tumbler_sparkles.sql`.
 */

/** Handle de la categoría (Sparkle Mix, subcategoría de MatrixLab Tumbler). */
export const SPARKLES_CATEGORY_HANDLE = "repuestos-consumibles";

/** Carpeta pública de las fotos, vinculadas por CÓDIGO (no por nombre). */
export const SPARKLES_IMAGE_DIR = "/images/tumbler/sparkles";

/** Placeholder de marca para los Sparkles que aún no tienen fotografía. */
export const SPARKLE_PLACEHOLDER_IMAGE = `${SPARKLES_IMAGE_DIR}/placeholder.webp`;

export interface SparkleItem {
  /** Posición en el Excel (1-46). Define el orden público por defecto. */
  position: number;
  /** Código interno (columna B). */
  code: string;
  /** Nombre público (columna C). */
  name: string;
  /** Colección (columna D). null cuando el Excel no la define. */
  collection: string | null;
  /** Inventario real envasado en piezas (columna H). */
  inventory: number;
  /** Precio público por bote (columna J). */
  price: number;
}

/** Los 46 Sparkles del Excel, en su orden original. */
export const TUMBLER_SPARKLES: readonly SparkleItem[] = [
  { position: 1, code: "2002", name: "Fairy Byte", collection: "Fantasy", inventory: 2, price: 120 },
  { position: 2, code: "2003", name: "Ice Pixel", collection: null, inventory: 2, price: 120 },
  { position: 3, code: "2004", name: "Neon Lime", collection: "Neon", inventory: 2, price: 120 },
  { position: 4, code: "2006", name: "Lime Glitch", collection: "Neon", inventory: 2, price: 120 },
  { position: 5, code: "2007", name: "Purple Circuit", collection: "Galaxy", inventory: 2, price: 120 },
  { position: 6, code: "2008", name: "Cotton Byte", collection: "Candy", inventory: 2, price: 120 },
  { position: 7, code: "2009", name: "Neon Lava", collection: "Neon", inventory: 2, price: 120 },
  { position: 8, code: "2010", name: "Berry Circuit", collection: "Candy", inventory: 2, price: 120 },
  { position: 9, code: "2011", name: "Pink Pixel Pop", collection: "Candy", inventory: 2, price: 120 },
  { position: 10, code: "2012", name: "Aqua Circuit", collection: "Ocean", inventory: 2, price: 120 },
  { position: 11, code: "C03R", name: "Pixie Glow", collection: "Fantasy", inventory: 2, price: 120 },
  { position: 12, code: "C06R", name: "Mermaid Glitch", collection: "Fantasy", inventory: 2, price: 120 },
  { position: 13, code: "C07R-A", name: "Rosy Hologram", collection: "Candy", inventory: 2, price: 120 },
  { position: 14, code: "C07R-B", name: "Mint Circuit", collection: "Nature", inventory: 2, price: 120 },
  { position: 15, code: "C08R", name: "Dragon Core", collection: "Elements", inventory: 2, price: 120 },
  { position: 16, code: "C09R", name: "Fuchsia Pop", collection: "Candy", inventory: 2, price: 120 },
  { position: 17, code: "C11R", name: "Electric Wave", collection: "Ocean", inventory: 2, price: 120 },
  { position: 18, code: "C13R", name: "Emerald Glitch", collection: "Nature", inventory: 2, price: 120 },
  { position: 19, code: "C14R", name: "Aurora Pearl", collection: "Fantasy", inventory: 3, price: 120 },
  { position: 20, code: "C18R", name: "Bubblegum Glow", collection: "Candy", inventory: 2, price: 120 },
  { position: 21, code: "C21R", name: "Ice Mermaid", collection: "Fantasy", inventory: 2, price: 120 },
  { position: 22, code: "C31R", name: "Pixie Lime", collection: null, inventory: 2, price: 120 },
  { position: 23, code: "C32R", name: "Coral Crush", collection: "Tropical", inventory: 2, price: 120 },
  { position: 24, code: "C34R", name: "Tangerine Glitch", collection: "Tropical", inventory: 2, price: 120 },
  { position: 25, code: "C50R", name: "Solar Byte", collection: "Neon", inventory: 2, price: 120 },
  { position: 26, code: "G001", name: "Pink Afterglow", collection: "Glow", inventory: 4, price: 165 },
  { position: 27, code: "G002", name: "Solar Flare", collection: "Glow", inventory: 4, price: 165 },
  { position: 28, code: "G003", name: "Moonlight Glow", collection: "Glow", inventory: 4, price: 165 },
  { position: 29, code: "G004", name: "Ghost Light", collection: "Glow", inventory: 4, price: 165 },
  { position: 30, code: "M001", name: "Electric Voltage", collection: "Galaxy", inventory: 4, price: 120 },
  { position: 31, code: "M002", name: "Lavender Glitch", collection: "Galaxy", inventory: 5, price: 120 },
  { position: 32, code: "M003", name: "Raspberry Pixel", collection: "Candy", inventory: 4, price: 120 },
  { position: 33, code: "M004", name: "Olive Moss", collection: "Nature", inventory: 4, price: 120 },
  { position: 34, code: "M005", name: "Lagoon Matrix", collection: "Galaxy", inventory: 4, price: 120 },
  { position: 35, code: "M006", name: "Stardust", collection: "Galaxy", inventory: 4, price: 120 },
  { position: 36, code: "M007", name: "Cosmic Orchid", collection: null, inventory: 4, price: 120 },
  { position: 37, code: "LE01", name: "Cherry Blossom", collection: null, inventory: 1, price: 145 },
  { position: 38, code: "LE02", name: "Cotton Candy", collection: null, inventory: 1, price: 145 },
  { position: 39, code: "LE03", name: "Rose Quartz", collection: null, inventory: 1, price: 145 },
  { position: 40, code: "LE04", name: "Royal Amethyst", collection: null, inventory: 1, price: 145 },
  { position: 41, code: "LE05", name: "Opal Dream", collection: null, inventory: 1, price: 145 },
  { position: 42, code: "LE06", name: "Pink Champagne", collection: null, inventory: 1, price: 145 },
  { position: 43, code: "LE07", name: "Black Cherry", collection: null, inventory: 2, price: 145 },
  { position: 44, code: "LE08", name: "Moonstone", collection: null, inventory: 1, price: 145 },
  { position: 45, code: "LE09", name: "Peacock Blue", collection: null, inventory: 1, price: 145 },
  { position: 46, code: "LE10", name: "Royal Sapphire", collection: null, inventory: 1, price: 145 },
];

/** Código normalizado para archivos/handles: minúsculas. */
export function sparkleCodeSlug(code: string): string {
  return code.toLowerCase();
}

/**
 * Handle estable del producto. Se deriva del CÓDIGO, nunca del nombre
 * comercial: si el nombre cambia, la URL y la imagen siguen funcionando.
 */
export function sparkleHandle(code: string): string {
  return `sparkle-${sparkleCodeSlug(code)}`;
}

/** SKU de la variante. Prefijo SPK- para no colisionar con SKUs existentes. */
export function sparkleSku(code: string): string {
  return `SPK-${code.toUpperCase()}`;
}

/**
 * Ruta determinista de la fotografía, vinculada por código. Actualizar una
 * foto es reemplazar el archivo; no se toca código ni base de datos.
 */
export function sparkleImagePath(code: string): string {
  return `${SPARKLES_IMAGE_DIR}/${sparkleCodeSlug(code)}.webp`;
}

/** Etiqueta de referencia mostrada de forma discreta en la tarjeta. */
export function sparkleRefLabel(code: string): string {
  return `Ref. ${code}`;
}

/** Descripción pública neutra (no inventa datos que el Excel no tiene). */
export function sparkleDescription(item: SparkleItem): string {
  const collection = item.collection ? ` Colección ${item.collection}.` : "";
  return `${item.name} — glitter chunky de la línea Sparkles de MatrixLab Tumbler.${collection} Se vende por bote. Ref. ${item.code}.`;
}

/** ¿Es una edición limitada? Se deriva del prefijo del código (LE##). */
export function isLimitedEditionCode(code: string): boolean {
  return /^LE\d/i.test(code);
}

const BY_HANDLE = new Map(
  TUMBLER_SPARKLES.map((item) => [sparkleHandle(item.code), item]),
);

/** Sparkle a partir del handle del producto; null si no es un Sparkle. */
export function sparkleByHandle(handle: string): SparkleItem | null {
  return BY_HANDLE.get(handle) ?? null;
}

const BY_CODE = new Map(
  TUMBLER_SPARKLES.map((item) => [item.code.toUpperCase(), item]),
);

/** Sparkle a partir de su código interno. */
export function sparkleByCode(code: string): SparkleItem | null {
  return BY_CODE.get(code.toUpperCase()) ?? null;
}

/**
 * Colecciones reales presentes en el Excel, en orden de primera aparición.
 * NO se inventa colección para las filas con la celda vacía.
 */
export const SPARKLE_COLLECTIONS: readonly string[] = [
  ...new Set(
    TUMBLER_SPARKLES.map((item) => item.collection).filter(
      (c): c is string => Boolean(c),
    ),
  ),
];

/** Id del filtro "Limited Edition" (agrupado por prefijo LE). */
export const LIMITED_EDITION_FILTER = "limited-edition";
/** Id del filtro para Sparkles sin colección declarada en el Excel. */
export const UNCLASSIFIED_FILTER = "sin-coleccion";

/** ¿El Sparkle entra en el filtro dado? `null` = "Todos". */
export function matchesSparkleFilter(
  item: SparkleItem,
  filter: string | null,
): boolean {
  if (!filter) return true;
  if (filter === LIMITED_EDITION_FILTER) return isLimitedEditionCode(item.code);
  if (filter === UNCLASSIFIED_FILTER) {
    return !item.collection && !isLimitedEditionCode(item.code);
  }
  return item.collection === filter;
}

/** Búsqueda por nombre público O código interno (sin distinguir acentos). */
export function matchesSparkleQuery(
  item: { name: string; code: string },
  query: string,
): boolean {
  const q = normalizeSearch(query);
  if (!q) return true;
  return (
    normalizeSearch(item.name).includes(q) ||
    normalizeSearch(item.code).includes(q)
  );
}

/** Normaliza para búsqueda: minúsculas, sin acentos, sin guiones sobrantes. */
export function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

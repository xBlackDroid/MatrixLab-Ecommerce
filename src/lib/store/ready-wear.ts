/**
 * Vitrina de PRENDAS LISTAS (/tienda/prendas-listas): colecciones, tipo de
 * prenda, regla de foto real y estado del filtro en la URL. Sin dependencias
 * de servidor: lo usan la página, el catálogo de cliente y la tienda.
 */
import type { ProductRow } from "@/lib/db/types";
import { sanitizeText } from "@/lib/security/sanitize";
import {
  getDefaultReadyWearColor,
  isReadyWearGarmentHandle,
  isReadyWearHoodieHandle,
  isReadyWearShirtHandle,
  readyWearColorImages,
} from "@/lib/store/ready-wear-colors";

/** Tipos de prenda, en el orden del filtro (`?tipo=`). */
export const READY_WEAR_TYPES = [
  { id: "playeras", label: "Playeras", designerHref: "/tienda/disenador/playera" },
  { id: "sudaderas", label: "Sudaderas", designerHref: "/tienda/disenador/sudadera" },
  { id: "totes", label: "Totes", designerHref: "/tienda/disenador/tote" },
  { id: "gorras", label: "Gorras", designerHref: "/tienda/disenador/gorra" },
] as const;

export type ReadyWearType = (typeof READY_WEAR_TYPES)[number]["id"];

/**
 * Prendas listas incorporadas desde las carpetas de inventario. `type` es el
 * tipo de prenda que aloja la colección (su categoría `handle` lo implica).
 */
export const READY_WEAR_COLLECTIONS = [
  { id: "call-of-duty", label: "Call of Duty", handle: "wear-call-of-duty", type: "playeras" },
  { id: "friends", label: "Friends", handle: "wear-friends", type: "playeras" },
  { id: "gta", label: "GTA", handle: "wear-gta", type: "playeras" },
  { id: "kpop", label: "K-pop", handle: "wear-kpop", type: "playeras" },
  { id: "music-rock", label: "Music Rock", handle: "wear-music-rock", type: "playeras" },
  { id: "resident-evil", label: "Resident Evil", handle: "wear-resident-evil", type: "playeras" },
  { id: "toluca", label: "Toluca", handle: "wear-toluca", type: "playeras" },
  { id: "totes", label: "Totes", handle: "wear-totes", type: "totes" },
  { id: "sudaderas", label: "Sudaderas", handle: "wear-sudaderas", type: "sudaderas" },
] as const satisfies readonly {
  id: string;
  label: string;
  handle: string;
  type: ReadyWearType;
}[];

export type ReadyWearCollectionId = (typeof READY_WEAR_COLLECTIONS)[number]["id"];

const TOTE_HANDLE = /^wear-tote-to(\d{3})$/;
const FIRST_TOTE = 1;
const LAST_TOTE = 4;

/** Totes listas conocidas (`wear-tote-to001` … `to003`). */
export function isReadyWearToteHandle(handle: string): boolean {
  const match = TOTE_HANDLE.exec(handle);
  if (!match) return false;
  const number = Number(match[1]);
  return number >= FIRST_TOTE && number <= LAST_TOTE;
}

/** Producto propio de la vitrina: playera o sudadera con foto por color, o tote. */
export function isReadyWearListingHandle(handle: string): boolean {
  return isReadyWearGarmentHandle(handle) || isReadyWearToteHandle(handle) || handle === "wear-gorra-go001";
}

// ---------------------------------------------------------------------------
// Tipo de prenda
// ---------------------------------------------------------------------------

type ParamValue = string | readonly string[] | null | undefined;

function firstParam(value: ParamValue): string | null {
  if (typeof value === "string") return value;
  return Array.isArray(value) && typeof value[0] === "string" ? value[0] : null;
}

export function parseReadyWearType(value: ParamValue): ReadyWearType | null {
  const needle = firstParam(value)?.trim().toLowerCase();
  return READY_WEAR_TYPES.find((t) => t.id === needle)?.id ?? null;
}

export function parseReadyWearCollection(
  value: ParamValue,
): ReadyWearCollectionId | null {
  const needle = firstParam(value)?.trim().toLowerCase();
  return READY_WEAR_COLLECTIONS.find((c) => c.id === needle)?.id ?? null;
}

/**
 * Categorías que por sí solas definen el tipo. `playeras-prendas` NO está a
 * propósito: aloja la playera, la sudadera y la tote del Laboratorio.
 */
const TYPE_BY_CATEGORY: ReadonlyMap<string, ReadyWearType> = new Map<
  string,
  ReadyWearType
>([
  ["gorras", "gorras"],
  ...READY_WEAR_COLLECTIONS.map((c): [string, ReadyWearType] => [c.handle, c.type]),
]);

function tagValues(tags: readonly string[] | null | undefined, prefix: string) {
  return (Array.isArray(tags) ? tags : [])
    .filter((tag): tag is string => typeof tag === "string")
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag.startsWith(prefix))
    .map((tag) => tag.slice(prefix.length));
}

/**
 * Tipo de prenda de un producto, de la señal más estable a la más laxa:
 * handle conocido → etiqueta `tipo:<id>` → categoría → etiqueta
 * `coleccion:<id>`. Sin señal reconocible: null (sólo aparece en "Todos").
 */
export function readyWearTypeOf(product: {
  handle: string;
  tags?: readonly string[] | null;
  categoryHandle?: string | null;
}): ReadyWearType | null {
  if (isReadyWearShirtHandle(product.handle)) return "playeras";
  if (isReadyWearHoodieHandle(product.handle)) return "sudaderas";
  if (isReadyWearToteHandle(product.handle)) return "totes";
  for (const value of tagValues(product.tags, "tipo:")) {
    const type = parseReadyWearType(value);
    if (type) return type;
  }
  const byCategory = product.categoryHandle
    ? TYPE_BY_CATEGORY.get(product.categoryHandle)
    : undefined;
  if (byCategory) return byCategory;
  for (const value of tagValues(product.tags, "coleccion:")) {
    const collection = READY_WEAR_COLLECTIONS.find((c) => c.id === value);
    if (collection) return collection.type;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Foto real
// ---------------------------------------------------------------------------

/**
 * Lo que NO es foto de producto aunque sea una imagen válida: placeholders de
 * marca, logos de categoría y de línea, y mockups/plantillas del Laboratorio.
 * Se evalúa sobre la ruta en minúsculas.
 */
const NOT_A_PRODUCT_PHOTO: readonly RegExp[] = [
  /placeholder/,
  /^\/images\/categories\//,
  /^\/images\/products\//,
  /(^|\/)(matrixlab-|logo)[^/]*$/,
];

function photoPath(value: string): string | null {
  if (value.startsWith("/") && !value.startsWith("//")) {
    return value.split(/[?#]/)[0];
  }
  if (!/^https:\/\/[^\s"'<>]+$/i.test(value)) return null;
  try {
    return new URL(value).pathname;
  } catch {
    return null;
  }
}

/**
 * ¿`src` es una foto de producto publicable? Reglas SÓLO por URL: en una
 * función serverless el filesystem no es fuente confiable de qué existe.
 * Acepta rutas públicas propias y https (Supabase Storage).
 */
export function isProductPhoto(src: unknown): src is string {
  if (typeof src !== "string") return false;
  const path = photoPath(src.trim());
  if (!path) return false;
  const lower = path.toLowerCase();
  return !NOT_A_PRODUCT_PHOTO.some((rule) => rule.test(lower));
}

/** Fotos reales de un producto, en su orden. */
export function productPhotos(images: unknown): string[] {
  return Array.isArray(images)
    ? images.filter(isProductPhoto).map((src) => src.trim())
    : [];
}

/**
 * El producto con SÓLO fotos reales: las suyas o, si es playera/sudadera sin
 * fotos en base, las de su color por defecto. null si no tiene ninguna.
 */
export function withProductPhotos<T extends Pick<ProductRow, "handle" | "images">>(
  product: T,
): T | null {
  const own = productPhotos(product.images);
  const color = getDefaultReadyWearColor(product.handle);
  const images =
    own.length > 0 || !color ? own : readyWearColorImages(product.handle, color);
  return images.length > 0 ? { ...product, images } : null;
}

/** Producto de la vitrina: fotos reales + tipo de prenda resuelto en servidor. */
export type ReadyWearListing<T extends ProductRow = ProductRow> = T & {
  readyWearType: ReadyWearType | null;
};

export function toReadyWearListing<T extends ProductRow>(
  product: T,
  categoryHandle: string | null,
): ReadyWearListing<T> | null {
  const shown = withProductPhotos(product);
  if (!shown) return null;
  return {
    ...shown,
    readyWearType: readyWearTypeOf({
      handle: product.handle,
      tags: product.tags,
      categoryHandle,
    }),
  };
}

// ---------------------------------------------------------------------------
// Filtros: tipo + colección + búsqueda, y su URL compartible
// ---------------------------------------------------------------------------

export interface ReadyWearFilters {
  type: ReadyWearType | null;
  collection: ReadyWearCollectionId | null;
  query: string;
}

export const EMPTY_READY_WEAR_FILTERS: ReadyWearFilters = {
  type: null,
  collection: null,
  query: "",
};

/** Parámetros de la URL: `?tipo=sudaderas&coleccion=toluca&q=architect`. */
export const READY_WEAR_FILTER_PARAMS = {
  type: "tipo",
  collection: "coleccion",
  query: "q",
} as const;

export const READY_WEAR_QUERY_MAX_LENGTH = 80;

export const READY_WEAR_LIST_PATH = "/tienda/prendas-listas";

export function parseReadyWearQuery(value: ParamValue): string {
  return sanitizeText(firstParam(value), READY_WEAR_QUERY_MAX_LENGTH);
}

/** Filtros pedidos en la URL; cualquier valor fuera de lista se ignora. */
export function parseReadyWearFilters(
  params: Readonly<Record<string, ParamValue>>,
): ReadyWearFilters {
  return {
    type: parseReadyWearType(params[READY_WEAR_FILTER_PARAMS.type]),
    collection: parseReadyWearCollection(params[READY_WEAR_FILTER_PARAMS.collection]),
    query: parseReadyWearQuery(params[READY_WEAR_FILTER_PARAMS.query]),
  };
}

function inCollection(
  product: Pick<ProductRow, "tags">,
  collection: ReadyWearCollectionId,
): boolean {
  return tagValues(product.tags, "coleccion:").includes(collection);
}

/**
 * Colecciones que se ofrecen con el tipo elegido: sin tipo, todas; con tipo,
 * sólo las que tienen al menos un producto de ese tipo.
 */
export function readyWearCollectionsFor(
  products: readonly ReadyWearListing[],
  type: ReadyWearType | null,
) {
  if (!type) return [...READY_WEAR_COLLECTIONS];
  return READY_WEAR_COLLECTIONS.filter((collection) =>
    products.some(
      (product) => product.readyWearType === type && inCollection(product, collection.id),
    ),
  );
}

/**
 * Quita la colección si no convive con el tipo (p. ej. tipo Sudaderas con
 * colección Toluca): así cambiar de tipo nunca deja la vitrina vacía para
 * siempre. Misma regla en servidor (URL) y en cliente (clic).
 */
export function normalizeReadyWearFilters(
  products: readonly ReadyWearListing[],
  filters: ReadyWearFilters,
): ReadyWearFilters {
  const collection =
    filters.collection &&
    readyWearCollectionsFor(products, filters.type).some(
      (c) => c.id === filters.collection,
    )
      ? filters.collection
      : null;
  return { ...filters, collection };
}

/** Minúsculas y sin acentos: "Café" encuentra "cafe". */
function foldSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLocaleLowerCase("es")
    .replace(/\s+/g, " ")
    .trim();
}

function searchTextOf(product: ReadyWearListing): string {
  const type = READY_WEAR_TYPES.find((t) => t.id === product.readyWearType);
  const collections = READY_WEAR_COLLECTIONS.filter((c) => inCollection(product, c.id));
  return [product.title, product.handle, type?.label, ...collections.map((c) => c.label)]
    .filter(Boolean)
    .join(" ");
}

export function filterReadyWearListings<T extends ReadyWearListing>(
  products: readonly T[],
  filters: ReadyWearFilters,
): T[] {
  const needle = foldSearch(filters.query);
  return products.filter(
    (product) =>
      (!filters.type || product.readyWearType === filters.type) &&
      (!filters.collection || inCollection(product, filters.collection)) &&
      (!needle || foldSearch(searchTextOf(product)).includes(needle)),
  );
}

export function countReadyWearTypes(
  products: readonly ReadyWearListing[],
): Record<ReadyWearType, number> {
  const counts = Object.fromEntries(
    READY_WEAR_TYPES.map((t) => [t.id, 0]),
  ) as Record<ReadyWearType, number>;
  for (const product of products) {
    if (product.readyWearType) counts[product.readyWearType] += 1;
  }
  return counts;
}

/** Escribe los filtros en `params` (borra los vacíos y conserva el resto). */
export function writeReadyWearFilters(
  params: URLSearchParams,
  filters: ReadyWearFilters,
): void {
  const query = parseReadyWearQuery(filters.query);
  const entries: [string, string | null][] = [
    [READY_WEAR_FILTER_PARAMS.type, filters.type],
    [READY_WEAR_FILTER_PARAMS.collection, filters.collection],
    [READY_WEAR_FILTER_PARAMS.query, query || null],
  ];
  for (const [key, value] of entries) {
    if (value) params.set(key, value);
    else params.delete(key);
  }
}

/** Enlace compartible a la vitrina con filtros (`/tienda/prendas-listas?tipo=…`). */
export function readyWearListHref(filters: Partial<ReadyWearFilters> = {}): string {
  const params = new URLSearchParams();
  writeReadyWearFilters(params, { ...EMPTY_READY_WEAR_FILTERS, ...filters });
  const search = params.toString();
  return search ? `${READY_WEAR_LIST_PATH}?${search}` : READY_WEAR_LIST_PATH;
}

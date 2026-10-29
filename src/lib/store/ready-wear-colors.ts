/**
 * Colores fotográficos de las prendas listas:
 *
 *   * playeras `wear-lista-wr001` … `wr034`: Blanca, Negra o Gris (Negra por
 *     defecto). Fotos en /public/images/matrixlab-wear/colors/.
 *   * sudaderas adulto `wear-sudadera-su001` … `su009`: nueve colores (Lila
 *     por defecto). Fotos en /public/images/matrixlab-wear/hoodies/.
 *   * gorras `wear-gorra-go001` … `go006`: cuatro colores (Rosa por defecto).
 *     Fotos en /public/images/matrixlab-wear/gorras/colors/.
 *
 * Sin dependencias de servidor: lo usan la ficha, la tarjeta, el carrito y la
 * miniatura del inventario admin. Cada prenda tiene su PROPIA lista cerrada de
 * colores: `?color=lila` en una playera no arma la ruta de una foto que no
 * existe, sólo cae al color por defecto de esa prenda.
 */

export const READY_WEAR_COLORS = [
  { label: "Blanca", slug: "blanca" },
  { label: "Negra", slug: "negra" },
  { label: "Gris", slug: "gris" },
] as const;

/**
 * Colores de las sudaderas, en el orden del selector. `label` es EXACTAMENTE
 * el valor de `product_variants.color`; `slug` nombra la foto y va en `?color=`.
 */
export const READY_WEAR_HOODIE_COLORS = [
  { label: "Lila", slug: "lila" },
  { label: "Negro", slug: "negro" },
  { label: "Blanco", slug: "blanco" },
  { label: "Negro jaspe", slug: "negro-jaspe" },
  { label: "Gris jaspe", slug: "gris-jaspe" },
  { label: "Rojo", slug: "rojo" },
  { label: "Azul marino", slug: "azul-marino" },
  { label: "Azul royal", slug: "azul-royal" },
  { label: "Rosa pastel", slug: "rosa-pastel" },
] as const;

export const READY_WEAR_CAP_COLORS = [
  { label: "Rosa", slug: "rosa" },
  { label: "Negro", slug: "negro" },
  { label: "Blanco", slug: "blanco" },
  { label: "Rosa pastel", slug: "rosa-pastel" },
] as const;

type ShirtColorOption = (typeof READY_WEAR_COLORS)[number];
type HoodieColorOption = (typeof READY_WEAR_HOODIE_COLORS)[number];
type CapColorOption = (typeof READY_WEAR_CAP_COLORS)[number];

export type ReadyWearShirtColor = ShirtColorOption["label"];
export type ReadyWearHoodieColor = HoodieColorOption["label"];
/** Cualquier color fotografiado de una prenda lista. */
export type ReadyWearColor = ReadyWearShirtColor | ReadyWearHoodieColor | CapColorOption["label"];
export type ReadyWearColorSlug = ShirtColorOption["slug"] | HoodieColorOption["slug"] | CapColorOption["slug"];

export interface ReadyWearColorOption {
  readonly label: ReadyWearColor;
  readonly slug: ReadyWearColorSlug;
}

/** Color por defecto de las PLAYERAS. Por prenda: `getDefaultReadyWearColor`. */
export const DEFAULT_READY_WEAR_COLOR: ReadyWearShirtColor = "Negra";
export const DEFAULT_READY_WEAR_HOODIE_COLOR: ReadyWearHoodieColor = "Lila";

/** Prenda lista con foto por color. El valor sirve tal cual en los textos. */
export type ReadyWearGarment = "playera" | "sudadera" | "gorra";

interface GarmentSpec {
  garment: ReadyWearGarment;
  pattern: RegExp;
  /** Prefijo del código (`wr005`, `su001`). */
  prefix: string;
  first: number;
  last: number;
  colors: readonly ReadyWearColorOption[];
  defaultColor: ReadyWearColor;
  dir: string;
  /** Modelos con una segunda foto por color (`-2`). */
  withSecondaryPhoto: ReadonlySet<string>;
  /** Encuadre de la foto, para el texto alternativo. */
  photoView: string | null;
}

const SHIRTS: GarmentSpec = {
  garment: "playera",
  pattern: /^wear-lista-wr(\d{3})$/,
  prefix: "wr",
  first: 1,
  last: 34,
  colors: READY_WEAR_COLORS,
  defaultColor: DEFAULT_READY_WEAR_COLOR,
  dir: "/images/matrixlab-wear/colors",
  withSecondaryPhoto: new Set(["wr005", "wr030"]),
  photoView: null,
};

const HOODIES: GarmentSpec = {
  garment: "sudadera",
  pattern: /^wear-sudadera-su(\d{3})$/,
  prefix: "su",
  first: 1,
  last: 9,
  colors: READY_WEAR_HOODIE_COLORS,
  defaultColor: DEFAULT_READY_WEAR_HOODIE_COLOR,
  dir: "/images/matrixlab-wear/hoodies",
  withSecondaryPhoto: new Set(),
  // Las fotos de origen muestran a la modelo de espaldas.
  photoView: "vista de espalda",
};

const CAPS: GarmentSpec = {
  garment: "gorra",
  pattern: /^wear-gorra-go(\d{3})$/,
  prefix: "go",
  first: 1,
  last: 6,
  colors: READY_WEAR_CAP_COLORS,
  defaultColor: "Rosa",
  dir: "/images/matrixlab-wear/gorras/colors",
  withSecondaryPhoto: new Set(),
  photoView: "vista frontal",
};

const GARMENTS: readonly GarmentSpec[] = [SHIRTS, HOODIES, CAPS];

const ALL_COLORS: readonly ReadyWearColorOption[] = [
  ...READY_WEAR_COLORS,
  ...READY_WEAR_HOODIE_COLORS,
  ...READY_WEAR_CAP_COLORS,
];

/** Prenda y código (`wr005`, `su001`) del handle; null si no es una soportada. */
function garmentOf(handle: string): { spec: GarmentSpec; code: string } | null {
  for (const spec of GARMENTS) {
    const match = spec.pattern.exec(handle);
    if (!match) continue;
    const number = Number(match[1]);
    if (number < spec.first || number > spec.last) return null;
    return { spec, code: `${spec.prefix}${match[1]}` };
  }
  return null;
}

/** SÓLO playeras (`wear-lista-wr001` … `wr034`). */
export function isReadyWearShirtHandle(handle: string): boolean {
  return garmentOf(handle)?.spec === SHIRTS;
}

/** SÓLO sudaderas adulto (`wear-sudadera-su001` … `su009`). */
export function isReadyWearHoodieHandle(handle: string): boolean {
  return garmentOf(handle)?.spec === HOODIES;
}

export function isReadyWearCapHandle(handle: string): boolean {
  return garmentOf(handle)?.spec === CAPS;
}

/** Playera, sudadera o gorra lista con selector de color por fotografía. */
export function isReadyWearGarmentHandle(handle: string): boolean {
  return garmentOf(handle) !== null;
}

export function readyWearGarmentOf(handle: string): ReadyWearGarment | null {
  return garmentOf(handle)?.spec.garment ?? null;
}

/** Colores de la prenda en el orden del selector; [] si no es prenda lista. */
export function getReadyWearColors(
  handle: string,
): readonly ReadyWearColorOption[] {
  return garmentOf(handle)?.spec.colors ?? [];
}

export function getDefaultReadyWearColor(handle: string): ReadyWearColor | null {
  return garmentOf(handle)?.spec.defaultColor ?? null;
}

function findColor<T extends ReadyWearColorOption>(
  options: readonly T[],
  value: string | null | undefined,
): T | null {
  if (typeof value !== "string") return null;
  const needle = value.trim().toLowerCase();
  if (!needle) return null;
  return (
    options.find((c) => c.slug === needle || c.label.toLowerCase() === needle) ??
    null
  );
}

/**
 * Normaliza "Negra", "negra" o " NEGRA " a un color de PLAYERA. Para cualquier
 * prenda (sudaderas incluidas) usa `parseReadyWearColorFor`.
 */
export function parseReadyWearColor(
  value: string | null | undefined,
): ReadyWearShirtColor | null {
  return findColor(READY_WEAR_COLORS, value)?.label ?? null;
}

/** Color de `value` dentro de la lista cerrada de ESA prenda; si no, null. */
export function parseReadyWearColorFor(
  handle: string,
  value: string | null | undefined,
): ReadyWearColor | null {
  const garment = garmentOf(handle);
  if (!garment) return null;
  return findColor(garment.spec.colors, value)?.label ?? null;
}

/** Color pedido (`?color=`) o, si no es de esa prenda, su color por defecto. */
export function resolveReadyWearColor(
  handle: string,
  value: string | null | undefined,
): ReadyWearColor | null {
  return parseReadyWearColorFor(handle, value) ?? getDefaultReadyWearColor(handle);
}

export function readyWearColorSlug(color: ReadyWearColor): ReadyWearColorSlug {
  return ALL_COLORS.find((c) => c.label === color)!.slug;
}

export function readyWearColorImages(
  handle: string,
  color: ReadyWearColor,
): string[] {
  const garment = garmentOf(handle);
  if (!garment) return [];
  const { spec, code } = garment;
  // Un color de OTRA prenda (Lila en una playera) no arma una ruta inexistente.
  const option = spec.colors.find((c) => c.label === color);
  if (!option) return [];
  const images = [`${spec.dir}/${code}-${option.slug}.webp`];
  if (spec.withSecondaryPhoto.has(code)) {
    images.push(`${spec.dir}/${code}-${option.slug}-2.webp`);
  }
  return images;
}

export function readyWearColorImage(
  handle: string,
  color: ReadyWearColor,
): string | null {
  return readyWearColorImages(handle, color)[0] ?? null;
}

/** Foto del color de una variante; null si el handle o el color no aplican. */
export function readyWearVariantImage(
  handle: string,
  variantColor: string | null | undefined,
): string | null {
  const color = parseReadyWearColorFor(handle, variantColor);
  if (!color) return null;
  return readyWearColorImage(handle, color);
}

/**
 * Color de una variante: primero su columna `color`; si falta, los segmentos
 * del título ("Hombre / Mediana / Negro jaspe"), del último al primero.
 */
export function readyWearVariantColor(
  handle: string,
  variant: { color?: string | null; title?: string | null },
): ReadyWearColor | null {
  const fromColumn = parseReadyWearColorFor(handle, variant.color);
  if (fromColumn) return fromColumn;
  const segments = (variant.title ?? "").split("/");
  for (let i = segments.length - 1; i >= 0; i -= 1) {
    const color = parseReadyWearColorFor(handle, segments[i]);
    if (color) return color;
  }
  return null;
}

/** Ficha de la prenda con su color en la URL (`?color=`) si es de esa prenda. */
export function readyWearProductHref(
  handle: string,
  color: ReadyWearColor | null,
): string {
  const href = `/tienda/producto/${handle}`;
  if (!color || !getReadyWearColors(handle).some((c) => c.label === color)) {
    return href;
  }
  return `${href}?color=${readyWearColorSlug(color)}`;
}

/** "playera color Negra" / "sudadera color Lila, vista de espalda". */
export function readyWearPhotoDescription(
  handle: string,
  color: ReadyWearColor,
): string {
  const spec = garmentOf(handle)?.spec;
  const base = `${spec?.garment ?? "prenda"} color ${color}`;
  return spec?.photoView ? `${base}, ${spec.photoView}` : base;
}

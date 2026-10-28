/**
 * Colores fotográficos de las playeras listas (wear-lista-wr001 … wr034).
 * Sin dependencias de servidor: lo usan la ficha, la tarjeta y el carrito.
 * Las fotos viven en /public/images/matrixlab-wear/colors/.
 */

export const READY_WEAR_COLORS = [
  { label: "Blanca", slug: "blanca" },
  { label: "Negra", slug: "negra" },
  { label: "Gris", slug: "gris" },
] as const;

export type ReadyWearColor = (typeof READY_WEAR_COLORS)[number]["label"];
export type ReadyWearColorSlug = (typeof READY_WEAR_COLORS)[number]["slug"];

export const DEFAULT_READY_WEAR_COLOR: ReadyWearColor = "Negra";

const HANDLE_PATTERN = /^wear-lista-wr(\d{3})$/;
const FIRST_NUMBER = 1;
const LAST_NUMBER = 34;
/** Modelos con una segunda foto por color (`-2`). */
const WITH_SECONDARY_PHOTO = new Set(["wr005", "wr030"]);
const COLORS_DIR = "/images/matrixlab-wear/colors";

/** Código `wrNNN` del handle, o null si no es una playera soportada. */
function readyWearCode(handle: string): string | null {
  const match = HANDLE_PATTERN.exec(handle);
  if (!match) return null;
  const number = Number(match[1]);
  if (number < FIRST_NUMBER || number > LAST_NUMBER) return null;
  return `wr${match[1]}`;
}

export function isReadyWearShirtHandle(handle: string): boolean {
  return readyWearCode(handle) !== null;
}

/** Normaliza "Negra", "negra" o " NEGRA " al color soportado. */
export function parseReadyWearColor(
  value: string | null | undefined,
): ReadyWearColor | null {
  if (!value) return null;
  const needle = value.trim().toLowerCase();
  const found = READY_WEAR_COLORS.find(
    (c) => c.slug === needle || c.label.toLowerCase() === needle,
  );
  return found?.label ?? null;
}

export function readyWearColorSlug(color: ReadyWearColor): ReadyWearColorSlug {
  return READY_WEAR_COLORS.find((c) => c.label === color)!.slug;
}

export function readyWearColorImages(
  handle: string,
  color: ReadyWearColor,
): string[] {
  const code = readyWearCode(handle);
  if (!code) return [];
  const slug = readyWearColorSlug(color);
  const images = [`${COLORS_DIR}/${code}-${slug}.webp`];
  if (WITH_SECONDARY_PHOTO.has(code)) {
    images.push(`${COLORS_DIR}/${code}-${slug}-2.webp`);
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
  const color = parseReadyWearColor(variantColor);
  if (!color) return null;
  return readyWearColorImage(handle, color);
}

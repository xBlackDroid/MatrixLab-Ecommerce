/**
 * Fotografias de la linea Magic Flow.
 *
 * Las imagenes se vinculan por el handle estable del producto para que el
 * nombre comercial pueda cambiar sin romper la ruta publica de la foto.
 */

export const MAGIC_FLOW_IMAGE_DIR = "/images/tumbler/magic-flow";

const MAGIC_FLOW_IMAGES = new Map<string, string>([
  ["liquido-efecto-snowglobe", "mf001.webp"],
  ["mezcla-efecto-lava", "mf002.webp"],
  ["glicerina-movimiento-lento", "mf003.webp"],
]);

/** Devuelve la ruta publica de la foto o null si el handle no es Magic Flow. */
export function magicFlowImagePath(handle: string): string | null {
  const filename = MAGIC_FLOW_IMAGES.get(handle);
  return filename ? `${MAGIC_FLOW_IMAGE_DIR}/${filename}` : null;
}

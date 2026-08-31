/**
 * MatrixLab 3D — catálogo de piezas impresas.
 *
 * FUENTE DE VERDAD COMERCIAL: `Inventario_MatrixLab_3D.xlsx`
 * (hoja "Inventario 3D"). De ese archivo se toman EXCLUSIVAMENTE:
 *
 *   columna B -> `code`          (código interno: 3D001…3D007)
 *   columna C -> `name`          (nombre público)
 *   columna D -> `category`      (categoría, normalizada a id de filtro)
 *   columna F -> `description`   (descripción comercial)
 *   columna G -> `usageLabel`    (tipo / uso)
 *   columna H -> `finishLabel`   (color / acabado)
 *   columna I -> `inventory`     (unidades por SKU)
 *   columna M -> `customizable`  ("Sí"/"No" -> booleano)
 *
 * La columna J (SKU) se deriva con `matrixLab3dSku` y coincide con el Excel en
 * las 7 filas. La columna L ("Valor total") NO se usa.
 *
 * PRECIO — BLOQUEO DE SEGURIDAD
 * La columna K (Precio) llega VACÍA en las 7 filas. Este módulo NO define
 * ningún campo de precio: mientras no se confirme, la tarjeta muestra "Precio
 * por confirmar" y el seed SQL se niega a crear variantes vendibles.
 * Ver `MATRIXLAB_3D_PRICE_PENDING`.
 *
 * PERSONALIZACIÓN
 * Tres piezas (3D004, 3D005, 3D007) llegan marcadas como personalizables en el
 * Excel. El Laboratorio NO tiene hoy un editor para piezas 3D
 * (`DESIGNER_CATALOG` no incluye un tipo 3D con editor propio), así que esas
 * piezas se destacan visualmente y se cotizan por WhatsApp: no se inventa un
 * configurador nuevo.
 *
 * El orden del arreglo es el orden EXACTO del Excel (3D001 -> 3D007).
 *
 * El bloque de datos está delimitado por marcadores y lo regenera
 * `scripts/data/build-matrixlab-catalogs.py` leyendo el Excel.
 */

/** Handle de la categoría existente que aloja la línea. NO se crea otra. */
export const MATRIXLAB_3D_CATEGORY_HANDLE = "impresion-3d";

/** Carpeta pública de las fotos, vinculadas por CÓDIGO (no por nombre). */
export const MATRIXLAB_3D_IMAGE_DIR = "/images/matrixlab-3d";

/** Placeholder de marca para las piezas que aún no tienen fotografía. */
export const MATRIXLAB_3D_PLACEHOLDER_IMAGE = `${MATRIXLAB_3D_IMAGE_DIR}/placeholder.webp`;

/** Encabezado público de la línea dentro de la categoría. */
export const MATRIXLAB_3D_PUBLIC_TITLE = "MatrixLab 3D";

/**
 * El Excel entregó las 7 celdas de Precio vacías. Mientras esta bandera sea
 * `true` el catálogo se publica como vitrina (sin precio y sin agregar al
 * carrito) y el seed SQL se niega a crear variantes vendibles.
 */
export const MATRIXLAB_3D_PRICE_PENDING = true;

/** Categorías reales del Excel (columna D). No se inventa ninguna. */
export type MatrixLab3dCategoryId =
  | "lamparas-rgb"
  | "calendarios"
  | "decoracion-escolar"
  | "organizadores"
  | "coleccionables"
  | "personalizados";

export interface MatrixLab3dItem {
  /** Posición en el Excel (1-7). Define el orden público por defecto. */
  position: number;
  /** Código interno (columna B). Identidad estable de la pieza. */
  code: string;
  /** Nombre público (columna C). */
  name: string;
  /** Categoría (columna D), normalizada a id de filtro. */
  category: MatrixLab3dCategoryId;
  /** Descripción comercial (columna F). */
  description: string;
  /** Tipo / uso declarado (columna G). */
  usageLabel: string;
  /** Color / acabado declarado (columna H). */
  finishLabel: string;
  /** Unidades por SKU (columna I). */
  inventory: number;
  /** Personalizable según el Excel (columna M). */
  customizable: boolean;
}

/** Etiquetas públicas de cada categoría (filtros y ficha de producto). */
export const MATRIXLAB_3D_CATEGORY_LABELS: Record<
  MatrixLab3dCategoryId,
  string
> = {
  "lamparas-rgb": "Lámparas RGB",
  calendarios: "Calendarios",
  "decoracion-escolar": "Decoración escolar",
  organizadores: "Organizadores",
  coleccionables: "Coleccionables",
  personalizados: "Personalizados",
};

/** Orden de los filtros en la interfaz (mismo orden que el Excel). */
export const MATRIXLAB_3D_CATEGORY_ORDER: readonly MatrixLab3dCategoryId[] = [
  "lamparas-rgb",
  "calendarios",
  "decoracion-escolar",
  "organizadores",
  "coleccionables",
  "personalizados",
];

/** Las 7 piezas del Excel, en su orden original. */
export const MATRIXLAB_3D: readonly MatrixLab3dItem[] = [
  // <generated:matrixlab-3d>
  { position: 1, code: "3D001", name: "Dragón Fuego Vivo - Lámpara RGB 3D", category: "lamparas-rgb", description: "Pieza de impacto: un dragón lanzando fuego con luz RGB para convertir cualquier cuarto en una escena épica.", usageLabel: "Lámpara decorativa", finishLabel: "RGB / efecto fuego", inventory: 99, customizable: false },
  { position: 2, code: "3D002", name: "Calendario Fórmula 1 2026 - Temporada en Tu Escritorio", category: "calendarios", description: "Para fans que viven cada carrera: calendario 2026 con vibra de paddock, perfecto para escritorio o regalo.", usageLabel: "Calendario decorativo", finishLabel: "Temporada 2026", inventory: 99, customizable: false },
  { position: 3, code: "3D003", name: "Lápiz Gigante Pastel - Decoración 3D", category: "decoracion-escolar", description: "Un acento pastel que ilumina escritorios, salones y fotos; grande, bonito y listo para robar miradas.", usageLabel: "Decoración", finishLabel: "Colores pastel", inventory: 99, customizable: false },
  { position: 4, code: "3D004", name: "Porta Lápices Playera Fútbol - Escritorio Campeón", category: "organizadores", description: "Organizador con espíritu de cancha: práctico, llamativo y perfecto para fans que quieren orden con personalidad.", usageLabel: "Porta lápices", finishLabel: "Color/equipo por definir", inventory: 99, customizable: true },
  { position: 5, code: "3D005", name: "Porta Lápices Unicornio Bicolor - Magia de Escritorio", category: "organizadores", description: "Dulce, funcional y muy regalable: un unicornio bicolor que convierte cualquier escritorio en algo especial.", usageLabel: "Porta lápices", finishLabel: "Bicolor por definir", inventory: 99, customizable: true },
  { position: 6, code: "3D006", name: "Pokébola Motion - Coleccionable 3D con Movimiento", category: "coleccionables", description: "Se mueve, sorprende y se vuelve el centro de cualquier repisa gamer, setup o colección fan.", usageLabel: "Coleccionable", finishLabel: "Rojo/blanco", inventory: 99, customizable: false },
  { position: 7, code: "3D007", name: "Tag Nombre 3D para Lápiz - Tu Lápiz, Tu Estilo", category: "personalizados", description: "El detalle que vuelve único cada lápiz: nombre en 3D, color elegido y acabado listo para regalar.", usageLabel: "Tag para lápiz", finishLabel: "Nombre y color por definir", inventory: 99, customizable: true },
  // </generated:matrixlab-3d>
];

/** Código normalizado para archivos/handles: minúsculas. */
export function matrixLab3dCodeSlug(code: string): string {
  return code.toLowerCase();
}

/**
 * Handle estable de la pieza. El Excel NO trae handle, así que se deriva del
 * CÓDIGO y nunca del nombre: el código sigue siendo la identidad estable
 * aunque mañana cambie el nombre comercial.
 */
export function matrixLab3dHandle(code: string): string {
  return `ml3d-${matrixLab3dCodeSlug(code)}`;
}

/** SKU de la variante (columna J). Prefijo ML3D- definido por el Excel. */
export function matrixLab3dSku(code: string): string {
  return `ML3D-${code.toUpperCase()}`;
}

/**
 * Ruta determinista de la fotografía, vinculada por código y en MINÚSCULAS.
 * La convención oficial es lowercase para que el filesystem case-sensitive de
 * Vercel/Linux resuelva igual que el de Windows/macOS en desarrollo.
 */
export function matrixLab3dImagePath(code: string): string {
  return `${MATRIXLAB_3D_IMAGE_DIR}/${matrixLab3dCodeSlug(code)}.webp`;
}

/** Etiqueta de referencia mostrada de forma discreta en la tarjeta. */
export function matrixLab3dRefLabel(code: string): string {
  return `Ref. ${code}`;
}

const BY_HANDLE = new Map(
  MATRIXLAB_3D.map((item) => [matrixLab3dHandle(item.code), item]),
);

/** Pieza a partir del handle; null si no es una pieza MatrixLab 3D. */
export function matrixLab3dByHandle(handle: string): MatrixLab3dItem | null {
  return BY_HANDLE.get(handle) ?? null;
}

const BY_CODE = new Map(
  MATRIXLAB_3D.map((item) => [item.code.toUpperCase(), item]),
);

/** Pieza a partir de su código interno. */
export function matrixLab3dByCode(code: string): MatrixLab3dItem | null {
  return BY_CODE.get(code.toUpperCase()) ?? null;
}

/** Conteo real por categoría, derivado del Excel (para los filtros). */
export function matrixLab3dCategoryCounts(
  items: readonly MatrixLab3dItem[] = MATRIXLAB_3D,
): Record<MatrixLab3dCategoryId, number> {
  const counts = Object.fromEntries(
    MATRIXLAB_3D_CATEGORY_ORDER.map((id) => [id, 0]),
  ) as Record<MatrixLab3dCategoryId, number>;
  for (const item of items) counts[item.category] += 1;
  return counts;
}

/** ¿La pieza entra en el filtro dado? `null` = "Todas". */
export function matchesMatrixLab3dFilter(
  item: MatrixLab3dItem,
  filter: MatrixLab3dCategoryId | null,
): boolean {
  return !filter || item.category === filter;
}

/** Piezas marcadas como personalizables en el Excel (3D004, 3D005, 3D007). */
export function matrixLab3dCustomizable(
  items: readonly MatrixLab3dItem[] = MATRIXLAB_3D,
): MatrixLab3dItem[] {
  return items.filter((item) => item.customizable);
}

/**
 * Catálogo generado desde la hoja "Inventario 3D" del Excel actualizado.
 * B:H: identidad y descripción; I: unidades; K: precio MXN; M: personalización;
 * P:R: fotos ordenadas. Los datos comerciales vacíos se conservan como null.
 * Las consultas y pedidos se atienden por WhatsApp, incluida la personalización.
 * Regenerar: python scripts/data/build-matrixlab-catalogs.py <archivo.xlsx> --only 3d
 */

/** Handle de la categoría existente que aloja la línea. NO se crea otra. */
export const MATRIXLAB_3D_CATEGORY_HANDLE = "impresion-3d";

/** Carpeta pública de las fotos, vinculadas por CÓDIGO (no por nombre). */
export const MATRIXLAB_3D_IMAGE_DIR = "/images/matrixlab-3d";

/** Placeholder de marca para las piezas que aún no tienen fotografía. */
export const MATRIXLAB_3D_PLACEHOLDER_IMAGE = `${MATRIXLAB_3D_IMAGE_DIR}/placeholder.webp`;

/** Encabezado público de la línea dentro de la categoría. */
export const MATRIXLAB_3D_PUBLIC_TITLE = "MatrixLab 3D";



/** Categorías reales del Excel (columna D). No se inventa ninguna. */
export type MatrixLab3dCategoryId =
  | "lamparas-rgb"
  | "calendarios"
  | "decoracion-escolar"
  | "organizadores"
  | "coleccionables"
  | "personalizados"
  | "gaming";

export interface MatrixLab3dItem {
  /** Posición en el Excel (1 en adelante). Define el orden público por defecto. */
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
  inventory: number | null;
  /** Precio confirmado en el inventario, en MXN; null si falta. */
  price: number | null;
  priceFrom: boolean;
  salesUnit: string;
  status: string | null;
  /** Personalizable según el Excel (columna M). */
  customizable: boolean | null;
  /** Fotos 1–3 del inventario; se omiten las rutas todavía sin archivo. */
  imagePaths?: readonly string[];
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
  gaming: "Gaming",
};

/** Orden de los filtros en la interfaz (mismo orden que el Excel). */
export const MATRIXLAB_3D_CATEGORY_ORDER: readonly MatrixLab3dCategoryId[] = [
  "lamparas-rgb",
  "calendarios",
  "decoracion-escolar",
  "organizadores",
  "coleccionables",
  "personalizados",
  "gaming",
];

/** Productos con nombre en el Excel, en su orden original. */
export const MATRIXLAB_3D: readonly MatrixLab3dItem[] = [
  // <generated:matrixlab-3d>
  {"position": 1, "code": "3D001", "name": "Dragón Fuego Vivo - Lámpara RGB 3D", "category": "lamparas-rgb", "description": "Pieza de impacto: un dragón lanzando fuego con luz RGB para convertir cualquier cuarto en una escena épica.", "usageLabel": "Lámpara decorativa", "finishLabel": "RGB / efecto fuego", "inventory": 99, "price": 1900, "priceFrom": false, "salesUnit": "pieza", "status": "Activo", "customizable": false, "imagePaths": ["/images/matrixlab-3d/3d001.webp", "/images/matrixlab-3d/3d001-2.webp", "/images/matrixlab-3d/3d001-3.webp"]},
  {"position": 2, "code": "3D002", "name": "Calendario Fórmula 1 2026 - Temporada en Tu Escritorio", "category": "calendarios", "description": "Para fans que viven cada carrera: calendario 2026 con vibra de paddock, perfecto para escritorio o regalo.", "usageLabel": "Calendario decorativo", "finishLabel": "Temporada 2026", "inventory": 99, "price": 1100, "priceFrom": false, "salesUnit": "pieza", "status": "Activo", "customizable": false, "imagePaths": ["/images/matrixlab-3d/3d002.webp"]},
  {"position": 3, "code": "3D003", "name": "Lápiz Gigante Pastel - Decoración 3D", "category": "decoracion-escolar", "description": "Un acento pastel que ilumina escritorios, salones y fotos; grande, bonito y listo para robar miradas.", "usageLabel": "Decoración", "finishLabel": "Colores pastel", "inventory": 99, "price": 85, "priceFrom": false, "salesUnit": "pieza", "status": "Activo", "customizable": false, "imagePaths": ["/images/matrixlab-3d/3d003.webp"]},
  {"position": 4, "code": "3D004", "name": "Porta Lápices Playera Fútbol - Escritorio Campeón", "category": "organizadores", "description": "Organizador con espíritu de cancha: práctico, llamativo y perfecto para fans que quieren orden con personalidad.", "usageLabel": "Porta lápices", "finishLabel": "Color/equipo por definir", "inventory": 99, "price": 220, "priceFrom": false, "salesUnit": "pieza", "status": "Activo", "customizable": true, "imagePaths": ["/images/matrixlab-3d/3d004.webp", "/images/matrixlab-3d/3d004-2.webp", "/images/matrixlab-3d/3d004-3.webp"]},
  {"position": 5, "code": "3D005", "name": "Portalápices Unicornio Pastel - Magia de Escritorio", "category": "organizadores", "description": "Un unicornio para darle un lugar especial a tus lápices. Su silueta de fantasía y sus tonos pastel aportan color al escritorio, al salón o a un rincón creativo. Elige los colores de tu pieza y convierte el orden en un detalle para regalar.", "usageLabel": "Portalápices", "finishLabel": "Tonos pastel; colores a elegir", "inventory": 99, "price": 220, "priceFrom": true, "salesUnit": "pieza", "status": "Activo", "customizable": true, "imagePaths": ["/images/matrixlab-3d/3d005.webp"]},
  {"position": 6, "code": "3D006", "name": "Pokébola Motion - Coleccionable 3D con Movimiento", "category": "coleccionables", "description": "Se mueve, sorprende y se vuelve el centro de cualquier repisa gamer, setup o colección fan.", "usageLabel": "Coleccionable", "finishLabel": "Rojo/blanco", "inventory": 99, "price": 800, "priceFrom": false, "salesUnit": "pieza", "status": "Activo", "customizable": false, "imagePaths": ["/images/matrixlab-3d/3d006.webp"]},
  {"position": 7, "code": "3D007", "name": "Tag Nombre 3D para Lápiz - Tu Lápiz, Tu Estilo", "category": "personalizados", "description": "El detalle que vuelve único cada lápiz: nombre en 3D, color elegido y acabado listo para regalar.", "usageLabel": "Tag para lápiz", "finishLabel": "Nombre y color por definir", "inventory": 99, "price": 160, "priceFrom": true, "salesUnit": "paquete de 12 piezas", "status": "Activo", "customizable": true, "imagePaths": ["/images/matrixlab-3d/3d007.webp", "/images/matrixlab-3d/3d007-2.webp"]},
  {"position": 8, "code": "3D008", "name": "Lanyard infantil personalizado con nombre", "category": "personalizados", "description": "Su nombre, sus colores y un detalle que se reconoce a primera vista. Este lanyard combina letras en relieve, cuentas y un cordón de tonos pastel para acompañar su gafete o accesorio favorito. Cuéntanos el nombre y la combinación que buscas y preparamos la propuesta contigo.", "usageLabel": "Lanyard personalizado", "finishLabel": "Nombre y colores a elegir", "inventory": 99, "price": 299, "priceFrom": false, "salesUnit": "pieza", "status": "Activo", "customizable": true, "imagePaths": ["/images/matrixlab-3d/3d008.webp"]},
  {"position": 9, "code": "3D009", "name": "Lanyard personalizado con nombre", "category": "personalizados", "description": "Lleva tu nombre con un estilo que se reconozca a primera vista. Un lanyard con cuentas de colores y letras personalizadas para acompañar tu gafete o llaves. Elige la combinación que va contigo y cotiza los detalles por WhatsApp.", "usageLabel": "Lanyard para gafete o llaves", "finishLabel": "Nombre y combinación de colores a elegir", "inventory": 99, "price": 349, "priceFrom": false, "salesUnit": "pieza", "status": "Activo", "customizable": true, "imagePaths": ["/images/matrixlab-3d/3d009.webp", "/images/matrixlab-3d/3d009-2.webp"]},
  {"position": 10, "code": "3D010", "name": "Tag llavero personalizado 5 × 5 cm", "category": "personalizados", "description": "Un detalle pequeño con toda tu personalidad. Personaliza este tag llavero de 5 × 5 cm con tu nombre y los colores que prefieras: una idea para identificar tus llaves o regalar un recuerdo hecho a tu gusto.", "usageLabel": "Tag llavero", "finishLabel": "Nombre y colores a elegir", "inventory": 99, "price": 155, "priceFrom": false, "salesUnit": "pieza", "status": "Activo", "customizable": true, "imagePaths": ["/images/matrixlab-3d/3d010.webp"]},
  {"position": 11, "code": "3D011", "name": "Crayola gigante pastel - Decoración 3D", "category": "decoracion-escolar", "description": "Dale color a tu rincón creativo con una crayola que se sale del estuche. Su silueta de gran formato y acabado pastel aportan un toque divertido al escritorio, al salón o a una decoración escolar. Combínala con otras piezas de la colección para crear tu propio espacio de color.", "usageLabel": "Decoración escolar", "finishLabel": "Tono pastel; color a confirmar", "inventory": 99, "price": 85, "priceFrom": false, "salesUnit": "pieza", "status": "Activo", "customizable": null, "imagePaths": ["/images/matrixlab-3d/3d011.webp"]},
  {"position": 12, "code": "3D012", "name": "Colgador de Llaves GTA VI", "category": "gaming", "description": "Que tus llaves tengan su propio lugar en tu espacio gamer. Este colgador inspirado en GTA VI combina un marco de estética automotriz, detalles en morado y soportes con forma de rueda. Una pieza que organiza y se convierte en parte de la decoración.", "usageLabel": "Colgador de llaves", "finishLabel": "Gris, negro y morado", "inventory": 99, "price": 900, "priceFrom": false, "salesUnit": "pieza", "status": "Activo", "customizable": null, "imagePaths": ["/images/matrixlab-3d/3d012.webp"]},
  {"position": 13, "code": "3D013", "name": "Colgador de Llaves Mustang", "category": "coleccionables", "description": "La presencia de un Mustang, ahora en la entrada de tu casa o junto a tu escritorio. Su frente azul con franjas negras convierte este colgador de llaves en una pieza para fans del diseño automotriz. Ten tus llaves a mano y dale carácter a ese rincón.", "usageLabel": "Colgador de llaves", "finishLabel": "Azul con franjas negras", "inventory": 99, "price": 2000, "priceFrom": false, "salesUnit": "pieza", "status": "Activo", "customizable": null, "imagePaths": ["/images/matrixlab-3d/3d013.webp"]},
  {"position": 14, "code": "3D014", "name": "Colgador de llaves Mustang Exhaust", "category": "coleccionables", "description": "Un guiño al Mustang desde su ángulo más reconocible. La carrocería blanca, las franjas azules y los detalles de la parte trasera dan forma a un colgador que mantiene tus llaves juntas y tu pasión por los autos a la vista.", "usageLabel": "Colgador de llaves", "finishLabel": "Blanco con franjas azules", "inventory": 99, "price": 2000, "priceFrom": false, "salesUnit": "pieza", "status": "Activo", "customizable": null, "imagePaths": ["/images/matrixlab-3d/3d014.webp"]},
  {"position": 15, "code": "3D015", "name": "Llaveros GTA VI - Pack de 3", "category": "gaming", "description": "Tres piezas para llevar tu estilo gamer contigo. Este pack de llaveros inspirado en GTA VI es una idea para repartir entre amigos, regalar o darle un detalle distinto a cada juego de llaves.", "usageLabel": "Pack de 3 llaveros", "finishLabel": "Combinación de colores según modelo", "inventory": 99, "price": 299, "priceFrom": false, "salesUnit": "paquete de 3 piezas", "status": "Activo", "customizable": null, "imagePaths": ["/images/matrixlab-3d/3d015.webp"]},
  {"position": 16, "code": "3D016", "name": "Portavasos GTA VI", "category": "gaming", "description": "Dale un lugar a tu bebida con el estilo de Vice City. Estos diseños de portavasos inspirados en GTA VI combinan palmeras, siluetas urbanas y colores rosa y morado sobre fondo negro. Elige tu diseño favorito para acompañar tu escritorio o espacio gamer y consulta las opciones por WhatsApp.", "usageLabel": "Portavasos", "finishLabel": "Negro con detalles rosa, morado y blanco", "inventory": 99, "price": 1500, "priceFrom": false, "salesUnit": "pieza", "status": "Activo", "customizable": null, "imagePaths": ["/images/matrixlab-3d/3d016.webp"]},
  {"position": 17, "code": "3D017", "name": "Funda para lata estilo NOS", "category": "coleccionables", "description": "Dale a tu bebida un toque de taller de carreras. Esta funda azul, inspirada en las botellas NOS, convierte una lata en un accesorio de estética automotriz para tu escritorio, colección o próximo regalo. Consulta las medidas para confirmar la compatibilidad con tu lata.", "usageLabel": "Funda decorativa para lata", "finishLabel": "Azul con detalles estilo NOS", "inventory": 99, "price": null, "priceFrom": false, "salesUnit": "pieza", "status": "Activo", "customizable": null, "imagePaths": ["/images/matrixlab-3d/3d017.webp"]},
  {"position": 18, "code": "3D018", "name": "Portalápices Sudadera Automotriz", "category": "coleccionables", "description": "Tu pasión por los autos también tiene lugar en el escritorio. Este portalápices con forma de sudadera reúne un diseño de ropa en miniatura y detalles inspirados en marcas automotrices. Organiza lápices y plumas con una pieza que acompaña tu colección.", "usageLabel": "Portalápices", "finishLabel": "Colores y emblemas según modelo", "inventory": 99, "price": null, "priceFrom": false, "salesUnit": "pieza", "status": "Activo", "customizable": null, "imagePaths": ["/images/matrixlab-3d/3d018.webp"]},
  {"position": 19, "code": "3D019", "name": "Caja para pañuelos en forma de lápiz", "category": "decoracion-escolar", "description": "Un lápiz gigante que guarda un detalle práctico: tus pañuelos a mano. Su diseño horizontal, con punta y borrador, aporta un toque divertido al salón, al escritorio o a tu rincón creativo. Una pieza decorativa que combina con el resto de la colección escolar.", "usageLabel": "Caja para pañuelos", "finishLabel": "Amarillo o verde con detalles rosa y blanco", "inventory": 99, "price": null, "priceFrom": false, "salesUnit": "pieza", "status": "Activo", "customizable": null, "imagePaths": ["/images/matrixlab-3d/3d019.webp"]},
  {"position": 20, "code": "3D020", "name": "Portalatas en forma de lápiz", "category": "decoracion-escolar", "description": "La hora de la bebida también puede tener un toque creativo. Este portalatas con forma de lápiz combina cuerpo amarillo, detalles de borrador y un asa para completar su diseño. Un accesorio para acompañar el escritorio o regalar a quien disfruta los detalles escolares. Consulta las medidas de la lata compatible.", "usageLabel": "Portalatas", "finishLabel": "Amarillo con detalles rosa y negro", "inventory": 99, "price": null, "priceFrom": false, "salesUnit": "pieza", "status": "Activo", "customizable": null, "imagePaths": ["/images/matrixlab-3d/3d020.webp"]},
  // </generated:matrixlab-3d>
];

/** Indica si queda algún precio sin confirmar. */
export const MATRIXLAB_3D_PRICE_PENDING = MATRIXLAB_3D.some((item) => item.price === null);

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

/** La primera foto conserva el nombre histórico; las otras usan -2 y -3. */
export function matrixLab3dImagePaths(code: string): string[] {
  const base = matrixLab3dImagePath(code).replace(/\.webp$/, "");
  return [`${base}.webp`, `${base}-2.webp`, `${base}-3.webp`];
}

/** Conserva las fotos administradas y completa con archivos locales reales. */
export function selectMatrixLab3dImages(
  curated: readonly string[],
  local: readonly string[],
): string[] {
  const images = [...new Set([...curated, ...local].map((src) => src.trim()))]
    .filter((src) => src && src !== MATRIXLAB_3D_PLACEHOLDER_IMAGE)
    .slice(0, 3);
  return images.length ? images : [MATRIXLAB_3D_PLACEHOLDER_IMAGE];
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

/** Piezas confirmadas como personalizables en el Excel. */
export function matrixLab3dCustomizable(
  items: readonly MatrixLab3dItem[] = MATRIXLAB_3D,
): MatrixLab3dItem[] {
  return items.filter((item) => item.customizable);
}

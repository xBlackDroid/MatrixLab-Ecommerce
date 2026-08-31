/**
 * MatrixLab Wear — catálogo de DISEÑOS de playera.
 *
 * FUENTE DE VERDAD COMERCIAL: `Inventario_MatrixLab_Wear.xlsx`
 * (hoja "Inventario Wear"). De ese archivo se toman EXCLUSIVAMENTE:
 *
 *   columna B -> `code`         (código interno: GE001…MU010)
 *   columna C -> `name`         (nombre público)
 *   columna D -> `category`     (familia temática, normalizada a id de filtro)
 *   columna F -> `description`  (descripción comercial)
 *   columna G -> `garmentType`  ("Playera" en las 100 filas)
 *   columna H -> `color`        ("Por definir" en las 100 filas)
 *   columna I -> `size`         ("Por definir" en las 100 filas)
 *   columna J -> `inventory`    (unidades por diseño)
 *
 * La columna K (SKU) se deriva con `matrixLabWearSku` y coincide con el Excel
 * en las 100 filas. La columna M ("Valor total") NO se usa.
 *
 * QUÉ ES UNA FILA — LECTURA DEL MODELO
 * Cada fila es un DISEÑO, no una prenda física con talla y color concretos.
 * El Excel lo dice explícitamente: Color = "Por definir" y Talla / Edad =
 * "Por definir" en los 100 registros. Por eso este módulo NO genera variantes
 * de talla/color: la tienda ya modela talla y color en el producto base
 * `playera-personalizada` (variantes reales Blanco/Negro x CH/M/G/XG) y en el
 * Laboratorio (`/tienda/disenador/playera`, `usesProfileSize: true`).
 * Duplicar esa lógica aquí crearía inventario falso.
 *
 * SIGNIFICADO DE `inventory` (99)
 * Es la capacidad declarada del DISEÑO en el Excel, no 99 playeras físicas por
 * cada combinación de talla y color. Se conserva como dato de origen y se
 * muestra como disponibilidad del diseño; NUNCA se multiplica por talla/color.
 *
 * PRECIO — BLOQUEO DE SEGURIDAD
 * La columna L (Precio) llega VACÍA en las 100 filas. Este módulo NO define
 * ningún campo de precio. El precio de una playera personalizada lo resuelve
 * el producto base en Supabase durante el flujo del Laboratorio, no este
 * catálogo. Ver `MATRIXLAB_WEAR_PRICE_PENDING`.
 *
 * El orden del arreglo es el orden EXACTO del Excel.
 *
 * El bloque de datos está delimitado por marcadores y lo regenera
 * `scripts/data/build-matrixlab-catalogs.py` leyendo el Excel.
 */

/** Handle de la categoría existente que aloja la línea. NO se crea otra. */
export const MATRIXLAB_WEAR_CATEGORY_HANDLE = "playeras-prendas";

/** Carpeta pública de las fotos, vinculadas por CÓDIGO (no por nombre). */
export const MATRIXLAB_WEAR_IMAGE_DIR = "/images/matrixlab-wear";

/** Placeholder de marca para los diseños que aún no tienen fotografía. */
export const MATRIXLAB_WEAR_PLACEHOLDER_IMAGE = `${MATRIXLAB_WEAR_IMAGE_DIR}/placeholder.webp`;

/** Encabezado público de la línea dentro de la categoría. */
export const MATRIXLAB_WEAR_PUBLIC_TITLE = "MatrixLab Wear";

/**
 * Ruta del Laboratorio donde SÍ se eligen talla y color y se resuelve el
 * precio real. Es el destino del CTA "Personalizar" de cada tarjeta: el
 * catálogo no duplica el diseñador, lo alimenta.
 */
export const MATRIXLAB_WEAR_DESIGNER_HREF = "/tienda/disenador/playera";

/**
 * Nombre del query param que lleva el diseño elegido al Laboratorio.
 * Su valor SIEMPRE es un handle de esta línea (`wear-<código>`), nunca una URL
 * ni una ruta: el diseñador lo valida contra la allowlist de los 100 handles
 * y descarta cualquier otra cosa.
 */
export const MATRIXLAB_WEAR_DESIGN_PARAM = "design";

/**
 * Enlace al Laboratorio conservando el diseño elegido.
 *
 * El handle se codifica siempre (aunque el patrón `^[a-z0-9-]+$` no lo exija)
 * para que la construcción del enlace no dependa de esa suposición.
 */
export function matrixLabWearDesignerHref(code: string): string {
  const handle = matrixLabWearHandle(code);
  return `${MATRIXLAB_WEAR_DESIGNER_HREF}?${MATRIXLAB_WEAR_DESIGN_PARAM}=${encodeURIComponent(handle)}`;
}

/**
 * Resuelve el diseño que llega por query param.
 *
 * ES LA FRONTERA DE CONFIANZA: el valor viene del cliente y puede ser
 * cualquier cosa (otra URL, `../../etc/passwd`, HTML, un array de Next si el
 * param se repite). Sólo se acepta si es EXACTAMENTE uno de los 100 handles
 * conocidos; en cualquier otro caso devuelve `null` y el Laboratorio abre
 * normal, como si no se hubiera pasado nada.
 *
 * Nunca se usa el texto recibido para construir rutas ni para renderizar: lo
 * que se muestra sale de la fila del Excel que encontró este lookup.
 */
export function resolveMatrixLabWearDesignParam(
  value: string | string[] | undefined,
): MatrixLabWearItem | null {
  if (typeof value !== "string") return null;
  return matrixLabWearByHandle(value);
}

/**
 * El Excel entregó las 100 celdas de Precio vacías, y color/talla como "Por
 * definir". Mientras esta bandera sea `true` el catálogo es una vitrina de
 * diseños: sin precio, sin agregar al carrito y sin variantes de talla/color.
 */
export const MATRIXLAB_WEAR_PRICE_PENDING = true;

/** Valor literal que el Excel usa para los campos aún no resueltos. */
export const MATRIXLAB_WEAR_UNDEFINED_VALUE = "Por definir";

/** Familias temáticas reales del Excel (columna D). No se inventa ninguna. */
export type MatrixLabWearCategoryId =
  | "geek"
  | "gamer"
  | "pokemon"
  | "futbol"
  | "resident-evil"
  | "graduaciones"
  | "my-little-pony"
  | "god-bless-america"
  | "anime"
  | "musica";

export interface MatrixLabWearItem {
  /** Posición en el Excel (1-100). Define el orden público por defecto. */
  position: number;
  /** Código interno (columna B). Identidad estable del diseño. */
  code: string;
  /** Nombre público (columna C). */
  name: string;
  /** Familia temática (columna D), normalizada a id de filtro. */
  category: MatrixLabWearCategoryId;
  /** Descripción comercial (columna F). */
  description: string;
  /** Tipo de prenda (columna G): "Playera" en las 100 filas. */
  garmentType: string;
  /** Color declarado (columna H): "Por definir". NO se inventa un color. */
  color: string;
  /** Talla / edad declarada (columna I): "Por definir". NO se inventa. */
  size: string;
  /** Unidades declaradas por DISEÑO (columna J), no por talla/color. */
  inventory: number;
}

/** Etiquetas públicas de cada familia (filtros y ficha de producto). */
export const MATRIXLAB_WEAR_CATEGORY_LABELS: Record<
  MatrixLabWearCategoryId,
  string
> = {
  geek: "Geek",
  gamer: "Gamer",
  pokemon: "Pokemon",
  futbol: "Futbol",
  "resident-evil": "Resident Evil",
  graduaciones: "Graduaciones",
  "my-little-pony": "My Little Pony",
  "god-bless-america": "God Bless America",
  anime: "Anime",
  musica: "Musica",
};

/** Orden de los filtros en la interfaz (mismo orden que el Excel). */
export const MATRIXLAB_WEAR_CATEGORY_ORDER: readonly MatrixLabWearCategoryId[] =
  [
    "geek",
    "gamer",
    "pokemon",
    "futbol",
    "resident-evil",
    "graduaciones",
    "my-little-pony",
    "god-bless-america",
    "anime",
    "musica",
  ];

/** Los 100 diseños del Excel, en su orden original. */
export const MATRIXLAB_WEAR: readonly MatrixLabWearItem[] = [
  // <generated:matrixlab-wear>
  { position: 1, code: "GE001", name: "Playera Geek - Código Cósmico", category: "geek", description: "Playera para mentes curiosas que quieren vestir creatividad y humor inteligente.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 2, code: "GE002", name: "Playera Geek - Modo Nerd", category: "geek", description: "Diseño cómodo y divertido para presumir con orgullo el lado geek.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 3, code: "GE003", name: "Playera Geek - Ctrl Z", category: "geek", description: "Ideal para fans de la tecnología que aman los guiños simples y memorables.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 4, code: "GE004", name: "Playera Geek - Ciencia Pop", category: "geek", description: "Una playera con vibra creativa para destacar sin esfuerzo.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 5, code: "GE005", name: "Playera Geek - Pixel Genius", category: "geek", description: "Look retro digital para outfits casuales con personalidad.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 6, code: "GE006", name: "Playera Geek - Café y Código", category: "geek", description: "Perfecta para días largos, buenas ideas y mucho estilo.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 7, code: "GE007", name: "Playera Geek - Universo Retro", category: "geek", description: "Nostalgia geek lista para convertirse en favorita del guardarropa.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 8, code: "GE008", name: "Playera Geek - Byte Lover", category: "geek", description: "Diseño ligero y expresivo para amantes del mundo tech.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 9, code: "GE009", name: "Playera Geek - Lab Vibes", category: "geek", description: "Estilo MatrixLab para quienes convierten ideas en cosas reales.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 10, code: "GE010", name: "Playera Geek - Cerebro Digital", category: "geek", description: "Playera con chispa para quienes piensan diferente y lo disfrutan.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 11, code: "GA001", name: "Playera Gamer - Nivel Pro", category: "gamer", description: "Playera gamer con actitud para salir, jugar y destacar.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 12, code: "GA002", name: "Playera Gamer - Respawn", category: "gamer", description: "Diseño fresco para quienes siempre vuelven con más energía.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 13, code: "GA003", name: "Playera Gamer - Joystick Power", category: "gamer", description: "Un básico con vibra de partida lista y setup encendido.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 14, code: "GA004", name: "Playera Gamer - Boss Final", category: "gamer", description: "Look potente para fans que juegan con mentalidad ganadora.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 15, code: "GA005", name: "Playera Gamer - Loot Legendario", category: "gamer", description: "Playera coleccionable que se siente como recompensa desbloqueada.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 16, code: "GA006", name: "Playera Gamer - GG Vibes", category: "gamer", description: "Diseño casual, divertido y fácil de combinar para cualquier gamer.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 17, code: "GA007", name: "Playera Gamer - Modo Co-op", category: "gamer", description: "Perfecta para dúos, equipos y regalos con buena química.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 18, code: "GA008", name: "Playera Gamer - Game Over Cool", category: "gamer", description: "Actitud gamer con un toque atrevido para outfit diario.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 19, code: "GA009", name: "Playera Gamer - XP Boost", category: "gamer", description: "Playera dinámica para subirle nivel al estilo personal.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 20, code: "GA010", name: "Playera Gamer - Headset On", category: "gamer", description: "Vibra de streaming y partidas largas en una prenda cómoda.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 21, code: "PK001", name: "Playera Pokemon - Entrenador Elite", category: "pokemon", description: "Playera para fans que llevan su aventura favorita con orgullo.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 22, code: "PK002", name: "Playera Pokemon - Pokebola Pop", category: "pokemon", description: "Diseño nostálgico y llamativo para looks llenos de energía.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 23, code: "PK003", name: "Playera Pokemon - Tipo Eléctrico", category: "pokemon", description: "Una opción vibrante para outfits con chispa y movimiento.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 24, code: "PK004", name: "Playera Pokemon - Ruta Aventura", category: "pokemon", description: "Perfecta para colecciones temáticas y regalos fan friendly.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 25, code: "PK005", name: "Playera Pokemon - Batalla Épica", category: "pokemon", description: "Playera con emoción de duelo y espíritu de campeón.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 26, code: "PK006", name: "Playera Pokemon - Starter Vibes", category: "pokemon", description: "Diseño inicial irresistible para armar un set coleccionable.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 27, code: "PK007", name: "Playera Pokemon - Gimnasio Pro", category: "pokemon", description: "Look ganador para quienes aman los retos y la nostalgia.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 28, code: "PK008", name: "Playera Pokemon - Captura Total", category: "pokemon", description: "Una prenda hecha para atrapar miradas desde el primer momento.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 29, code: "PK009", name: "Playera Pokemon - Liga Master", category: "pokemon", description: "Playera con presencia para fans de todas las generaciones.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 30, code: "PK010", name: "Playera Pokemon - Evolución Glow", category: "pokemon", description: "Diseño brillante y coleccionable para llevar la magia del fandom.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 31, code: "FU001", name: "Playera Futbol - Golazo", category: "futbol", description: "Playera con pasión de cancha para vivir cada partido con estilo.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 32, code: "FU002", name: "Playera Futbol - Pasión de Cancha", category: "futbol", description: "Diseño para hinchas que sienten el futbol en serio.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 33, code: "FU003", name: "Playera Futbol - Barra Brava", category: "futbol", description: "Look con energía de estadio para destacar entre la afición.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 34, code: "FU004", name: "Playera Futbol - Campeón", category: "futbol", description: "Perfecta para celebrar torneos, victorias y días de partido.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 35, code: "FU005", name: "Playera Futbol - Tiro Libre", category: "futbol", description: "Playera dinámica para quienes aman las jugadas que cambian todo.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 36, code: "FU006", name: "Playera Futbol - Portería", category: "futbol", description: "Diseño deportivo y limpio para outfits casuales futboleros.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 37, code: "FU007", name: "Playera Futbol - Balón Clásico", category: "futbol", description: "Un básico vendible para fans de todas las edades.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 38, code: "FU008", name: "Playera Futbol - La 10", category: "futbol", description: "Para quien quiere vestir como figura dentro y fuera de la cancha.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 39, code: "FU009", name: "Playera Futbol - Hincha Fiel", category: "futbol", description: "Playera con orgullo para quienes nunca sueltan a su equipo.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 40, code: "FU010", name: "Playera Futbol - Final Soñada", category: "futbol", description: "Ideal para regalos y temporadas de campeonato.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 41, code: "RE001", name: "Playera Resident Evil - Umbrella Alert", category: "resident-evil", description: "Playera de estética survival horror para fans de lo oscuro.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 42, code: "RE002", name: "Playera Resident Evil - Survival Mode", category: "resident-evil", description: "Diseño intenso y cómodo para looks con misterio.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 43, code: "RE003", name: "Playera Resident Evil - Biohazard", category: "resident-evil", description: "Un clásico visual fuerte para quienes aman el terror gamer.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 44, code: "RE004", name: "Playera Resident Evil - Laboratorio Oscuro", category: "resident-evil", description: "Playera con vibra de suspenso y estilo de culto.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 45, code: "RE005", name: "Playera Resident Evil - Noche Infectada", category: "resident-evil", description: "Perfecta para fans que buscan una prenda con carácter.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 46, code: "RE006", name: "Playera Resident Evil - Misión Escape", category: "resident-evil", description: "Diseño llamativo para llevar una historia secreta en el outfit.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 47, code: "RE007", name: "Playera Resident Evil - Clave Roja", category: "resident-evil", description: "Look oscuro y elegante para amantes del horror de supervivencia.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 48, code: "RE008", name: "Playera Resident Evil - Susto Premium", category: "resident-evil", description: "Playera de impacto para destacar en cualquier colección fan.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 49, code: "RE009", name: "Playera Resident Evil - Archivo Secreto", category: "resident-evil", description: "Diseño misterioso para quienes aman pistas, tensión y nostalgia.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 50, code: "RE010", name: "Playera Resident Evil - Antihero Vibes", category: "resident-evil", description: "Actitud intensa para una prenda cómoda y memorable.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 51, code: "GR001", name: "Playera Graduaciones - Orgullo Graduado", category: "graduaciones", description: "Playera perfecta para celebrar el logro con estilo y emoción.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 52, code: "GR002", name: "Playera Graduaciones - Birrete Brillante", category: "graduaciones", description: "Diseño festivo para recuerdos, fotos y fiestas de graduación.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 53, code: "GR003", name: "Playera Graduaciones - Generación 2026", category: "graduaciones", description: "Ideal para grupos que quieren una prenda conmemorativa.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 54, code: "GR004", name: "Playera Graduaciones - Meta Cumplida", category: "graduaciones", description: "Playera emotiva para cerrar una etapa y empezar otra.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 55, code: "GR005", name: "Playera Graduaciones - Foto de Honor", category: "graduaciones", description: "Diseño especial para lucir en sesiones, convivios y celebraciones.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 56, code: "GR006", name: "Playera Graduaciones - Diploma Vibes", category: "graduaciones", description: "Look alegre y elegante para festejar el gran día.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 57, code: "GR007", name: "Playera Graduaciones - Promoción", category: "graduaciones", description: "Una opción versátil para paquetes escolares y eventos.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 58, code: "GR008", name: "Playera Graduaciones - Sueño Logrado", category: "graduaciones", description: "Playera con mensaje inspirador y alto valor sentimental.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 59, code: "GR009", name: "Playera Graduaciones - Fiesta de Grado", category: "graduaciones", description: "Diseño lleno de celebración para recuerdos inolvidables.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 60, code: "GR010", name: "Playera Graduaciones - Futuro Brillante", category: "graduaciones", description: "Prenda optimista para vender como detalle de cierre y comienzo.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 61, code: "ML001", name: "Playera My Little Pony - Arcoíris Amistad", category: "my-little-pony", description: "Playera colorida y tierna para fans de la magia y amistad.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 62, code: "ML002", name: "Playera My Little Pony - Pony Magic", category: "my-little-pony", description: "Diseño encantador para outfits alegres y llenos de fantasía.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 63, code: "ML003", name: "Playera My Little Pony - Dulce Encanto", category: "my-little-pony", description: "Perfecta para regalos con vibra cute y muy vendible.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 64, code: "ML004", name: "Playera My Little Pony - Brillo Pastel", category: "my-little-pony", description: "Look suave y coleccionable para quienes aman los tonos dulces.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 65, code: "ML005", name: "Playera My Little Pony - Friendship Vibes", category: "my-little-pony", description: "Playera feliz para celebrar amistad, color y nostalgia.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 66, code: "ML006", name: "Playera My Little Pony - Marca Mágica", category: "my-little-pony", description: "Diseño especial con personalidad tierna y mucha luz visual.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 67, code: "ML007", name: "Playera My Little Pony - Nube Pastel", category: "my-little-pony", description: "Una prenda suave y llamativa para estilo cute diario.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 68, code: "ML008", name: "Playera My Little Pony - Aventura Pony", category: "my-little-pony", description: "Ideal para fans que quieren vestir fantasía a su manera.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 69, code: "ML009", name: "Playera My Little Pony - Corazón Arcoíris", category: "my-little-pony", description: "Playera alegre que agrega color instantáneo al outfit.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 70, code: "ML010", name: "Playera My Little Pony - Sueño Mágico", category: "my-little-pony", description: "Diseño dulce y brillante, fácil de amar desde el primer vistazo.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 71, code: "GB001", name: "Playera God Bless America - Stars & Stripes", category: "god-bless-america", description: "Playera patriótica con presencia limpia para días especiales.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 72, code: "GB002", name: "Playera God Bless America - Freedom Vibes", category: "god-bless-america", description: "Diseño positivo para celebrar orgullo, libertad y estilo casual.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 73, code: "GB003", name: "Playera God Bless America - USA Pride", category: "god-bless-america", description: "Un clásico vendible para temporadas patrióticas y regalos.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 74, code: "GB004", name: "Playera God Bless America - Patriotic Heart", category: "god-bless-america", description: "Playera emotiva para celebraciones familiares y recuerdos.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 75, code: "GB005", name: "Playera God Bless America - Liberty Shine", category: "god-bless-america", description: "Look con brillo de libertad y mensaje fuerte.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 76, code: "GB006", name: "Playera God Bless America - America Strong", category: "god-bless-america", description: "Diseño poderoso para quienes quieren vestir orgullo con estilo.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 77, code: "GB007", name: "Playera God Bless America - Red White Blue", category: "god-bless-america", description: "Combinación icónica y llamativa para destacar rápido.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 78, code: "GB008", name: "Playera God Bless America - Blessings USA", category: "god-bless-america", description: "Playera con fe, orgullo y vibra positiva para regalar.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 79, code: "GB009", name: "Playera God Bless America - Liberty Spirit", category: "god-bless-america", description: "Estilo patriótico elegante para colecciones temáticas.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 80, code: "GB010", name: "Playera God Bless America - Home of the Brave", category: "god-bless-america", description: "Una prenda con mensaje memorable y mucha presencia.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 81, code: "AN001", name: "Playera Anime - Senpai Mood", category: "anime", description: "Playera divertida para fans que aman vestir su fandom.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 82, code: "AN002", name: "Playera Anime - Kawaii Pop", category: "anime", description: "Diseño colorido y tierno para looks cute y casuales.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 83, code: "AN003", name: "Playera Anime - Shonen Power", category: "anime", description: "Energía de protagonista para una prenda con mucha actitud.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 84, code: "AN004", name: "Playera Anime - Chibi Star", category: "anime", description: "Playera adorable y coleccionable para regalos temáticos.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 85, code: "AN005", name: "Playera Anime - Sakura Vibes", category: "anime", description: "Toque suave de inspiración japonesa para outfits relajados.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 86, code: "AN006", name: "Playera Anime - Otaku Heart", category: "anime", description: "Diseño directo para presumir fandom con orgullo.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 87, code: "AN007", name: "Playera Anime - Manga Panel", category: "anime", description: "Look de viñeta para llevar estética de historia.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 88, code: "AN008", name: "Playera Anime - Hero Arc", category: "anime", description: "Playera con vibra de evolución, aventura y momento épico.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 89, code: "AN009", name: "Playera Anime - Mecha Energy", category: "anime", description: "Estilo futurista para una prenda con presencia fuerte.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 90, code: "AN010", name: "Playera Anime - Magic Girl", category: "anime", description: "Brillo, color y fantasía para looks llenos de encanto.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 91, code: "MU001", name: "Playera Musica - Beat Lover", category: "musica", description: "Playera para quienes llevan el ritmo a todas partes.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 92, code: "MU002", name: "Playera Musica - Vinilo Retro", category: "musica", description: "Diseño nostálgico para fans de sonidos clásicos y buen estilo.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 93, code: "MU003", name: "Playera Musica - Corazón Pop", category: "musica", description: "Look alegre para amantes de canciones pegajosas y color.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 94, code: "MU004", name: "Playera Musica - Bajo Profundo", category: "musica", description: "Playera con presencia para outfits con actitud sonora.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 95, code: "MU005", name: "Playera Musica - Karaoke Night", category: "musica", description: "Ideal para regalos divertidos y noches con amigos.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 96, code: "MU006", name: "Playera Musica - Festival Vibes", category: "musica", description: "Diseño lleno de energía para amantes de conciertos.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 97, code: "MU007", name: "Playera Musica - Playlist Mood", category: "musica", description: "Prenda moderna para quienes viven armando canciones favoritas.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 98, code: "MU008", name: "Playera Musica - Guitarra Vibe", category: "musica", description: "Look clásico para fans de riffs, bandas y escenarios.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 99, code: "MU009", name: "Playera Musica - Nota Brillante", category: "musica", description: "Diseño musical limpio, vendible y fácil de combinar.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  { position: 100, code: "MU010", name: "Playera Musica - DJ Energy", category: "musica", description: "Playera dinámica para looks con vibra nocturna y movimiento.", garmentType: "Playera", color: "Por definir", size: "Por definir", inventory: 99 },
  // </generated:matrixlab-wear>
];

/** Código normalizado para archivos/handles: minúsculas. */
export function matrixLabWearCodeSlug(code: string): string {
  return code.toLowerCase();
}

/**
 * Handle estable del diseño. El Excel NO trae handle, así que se deriva del
 * CÓDIGO y nunca del nombre: el código sigue siendo la identidad estable
 * aunque mañana cambie el nombre comercial.
 */
export function matrixLabWearHandle(code: string): string {
  return `wear-${matrixLabWearCodeSlug(code)}`;
}

/** SKU del diseño (columna K). Prefijo WEAR- definido por el Excel. */
export function matrixLabWearSku(code: string): string {
  return `WEAR-${code.toUpperCase()}`;
}

/**
 * Ruta determinista de la fotografía, vinculada por código y en MINÚSCULAS.
 * La convención oficial es lowercase para que el filesystem case-sensitive de
 * Vercel/Linux resuelva igual que el de Windows/macOS en desarrollo.
 */
export function matrixLabWearImagePath(code: string): string {
  return `${MATRIXLAB_WEAR_IMAGE_DIR}/${matrixLabWearCodeSlug(code)}.webp`;
}

/** Etiqueta de referencia mostrada de forma discreta en la tarjeta. */
export function matrixLabWearRefLabel(code: string): string {
  return `Ref. ${code}`;
}

/** ¿La fila tiene talla y color aún sin resolver? (las 100 del Excel, sí). */
export function matrixLabWearNeedsDefinition(item: MatrixLabWearItem): boolean {
  return (
    item.color === MATRIXLAB_WEAR_UNDEFINED_VALUE ||
    item.size === MATRIXLAB_WEAR_UNDEFINED_VALUE
  );
}

const BY_HANDLE = new Map(
  MATRIXLAB_WEAR.map((item) => [matrixLabWearHandle(item.code), item]),
);

/** Diseño a partir del handle; null si no es un MatrixLab Wear. */
export function matrixLabWearByHandle(handle: string): MatrixLabWearItem | null {
  return BY_HANDLE.get(handle) ?? null;
}

const BY_CODE = new Map(
  MATRIXLAB_WEAR.map((item) => [item.code.toUpperCase(), item]),
);

/** Diseño a partir de su código interno. */
export function matrixLabWearByCode(code: string): MatrixLabWearItem | null {
  return BY_CODE.get(code.toUpperCase()) ?? null;
}

/** Conteo real por familia, derivado del Excel (para los filtros). */
export function matrixLabWearCategoryCounts(
  items: readonly MatrixLabWearItem[] = MATRIXLAB_WEAR,
): Record<MatrixLabWearCategoryId, number> {
  const counts = Object.fromEntries(
    MATRIXLAB_WEAR_CATEGORY_ORDER.map((id) => [id, 0]),
  ) as Record<MatrixLabWearCategoryId, number>;
  for (const item of items) counts[item.category] += 1;
  return counts;
}

/** ¿El diseño entra en el filtro dado? `null` = "Todos". */
export function matchesMatrixLabWearFilter(
  item: MatrixLabWearItem,
  filter: MatrixLabWearCategoryId | null,
): boolean {
  return !filter || item.category === filter;
}

/** Normaliza para búsqueda: minúsculas, sin acentos, sin guiones ni espacios. */
export function normalizeMatrixLabWearSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[\s-]+/g, "")
    .trim();
}

/** Búsqueda por código, SKU, nombre o categoría. */
export function matchesMatrixLabWearQuery(
  item: MatrixLabWearItem,
  query: string,
): boolean {
  const q = normalizeMatrixLabWearSearch(query);
  if (!q) return true;
  return (
    normalizeMatrixLabWearSearch(item.code).includes(q) ||
    normalizeMatrixLabWearSearch(matrixLabWearSku(item.code)).includes(q) ||
    normalizeMatrixLabWearSearch(item.name).includes(q) ||
    normalizeMatrixLabWearSearch(
      MATRIXLAB_WEAR_CATEGORY_LABELS[item.category],
    ).includes(q)
  );
}

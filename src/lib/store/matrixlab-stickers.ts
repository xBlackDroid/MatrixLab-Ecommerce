/**
 * MatrixLab Stickers — catálogo de diseños.
 *
 * FUENTE DE VERDAD COMERCIAL: `Inventario_MatrixLab_Stickers.xlsx`
 * (hoja "Inventario Stickers"). De ese archivo se toman EXCLUSIVAMENTE:
 *
 *   columna B -> `code`         (código interno: GE001…LE010)
 *   columna C -> `name`         (nombre público)
 *   columna D -> `category`     (familia temática, normalizada a id de filtro)
 *   columna F -> `description`  (descripción comercial)
 *   columna G -> `finishLabel`  (acabado / tamaño)
 *   columna H -> `inventory`    (unidades por SKU)
 *   columna L -> `handle`       (handle público, YA definido en el Excel)
 *
 * La columna I (SKU) se deriva con `matrixLabStickerSku` y coincide con el
 * Excel en las 110 filas. La columna K ("Valor total") NO se usa.
 *
 * PRECIO — BLOQUEO DE SEGURIDAD
 * La columna J (Precio) llega VACÍA en las 110 filas. Este módulo NO define
 * ningún campo de precio: no hay lugar donde un 0, un 1 ni un precio histórico
 * puedan colarse. El precio se resuelve SIEMPRE contra la variante real en
 * Supabase, y mientras esa variante no exista la tarjeta muestra "Precio por
 * confirmar" en vez de una cifra inventada. Ver `MATRIXLAB_STICKERS_PRICE_PENDING`.
 *
 * ESTA LÍNEA NO ES MatrixLab Tumbler. Los 209 UV Stickers de Tumbler viven en
 * `tumbler-stickers.ts` y son otro catálogo, otra categoría y otros precios.
 *
 * El orden del arreglo es el orden EXACTO del Excel y es el orden público por
 * defecto de la categoría: no se reordena alfabéticamente.
 *
 * El bloque de datos está delimitado por marcadores y lo regenera
 * `scripts/data/build-matrixlab-catalogs.py` leyendo el Excel.
 */

/** Handle de la categoría existente que aloja la línea. NO se crea otra. */
export const MATRIXLAB_STICKERS_CATEGORY_HANDLE = "stickers";

/** Carpeta pública de las fotos, vinculadas por CÓDIGO (no por nombre). */
export const MATRIXLAB_STICKERS_IMAGE_DIR = "/images/matrixlab-stickers";

/** Placeholder de marca para los diseños que aún no tienen fotografía. */
export const MATRIXLAB_STICKER_PLACEHOLDER_IMAGE = `${MATRIXLAB_STICKERS_IMAGE_DIR}/placeholder.webp`;

/** Encabezado público de la línea dentro de la categoría `stickers`. */
export const MATRIXLAB_STICKERS_PUBLIC_TITLE = "MatrixLab Stickers";

/**
 * El Excel entregó las 110 celdas de Precio vacías. Mientras esta bandera sea
 * `true` el catálogo se publica como vitrina (sin precio y sin agregar al
 * carrito) y el seed SQL se niega a crear variantes vendibles.
 */
export const MATRIXLAB_STICKERS_PRICE_PENDING = true;

/** Familias temáticas reales del Excel (columna D). No se inventa ninguna. */
export type MatrixLabStickerCategoryId =
  | "geek"
  | "gamer"
  | "pokemon"
  | "futbol"
  | "resident-evil"
  | "graduaciones"
  | "my-little-pony"
  | "god-bless-america"
  | "anime"
  | "musica"
  | "lectura";

export interface MatrixLabStickerItem {
  /** Posición en el Excel (1-110). Define el orden público por defecto. */
  position: number;
  /** Código interno (columna B). Identidad estable de la fila. */
  code: string;
  /** Nombre público (columna C). */
  name: string;
  /** Familia temática (columna D), normalizada a id de filtro. */
  category: MatrixLabStickerCategoryId;
  /** Descripción comercial (columna F). */
  description: string;
  /** Acabado / tamaño tal como lo declara el Excel (columna G). */
  finishLabel: string;
  /** Unidades por SKU (columna H). */
  inventory: number;
  /** Handle público (columna L), tal cual viene del Excel. */
  handle: string;
}

/** Etiquetas públicas de cada familia (filtros y ficha de producto). */
export const MATRIXLAB_STICKER_CATEGORY_LABELS: Record<
  MatrixLabStickerCategoryId,
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
  lectura: "Lectura",
};

/** Orden de los filtros en la interfaz (mismo orden que el Excel). */
export const MATRIXLAB_STICKER_CATEGORY_ORDER: readonly MatrixLabStickerCategoryId[] =
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
    "lectura",
  ];

/** Los 110 diseños del Excel, en su orden original. */
export const MATRIXLAB_STICKERS: readonly MatrixLabStickerItem[] = [
  // <generated:matrixlab-stickers>
  { position: 1, code: "GE001", name: "Sticker Geek - Código Cósmico", category: "geek", description: "Look inteligente y divertido para darle personalidad a laptop, vaso o libreta.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-geek-codigo-cosmico" },
  { position: 2, code: "GE002", name: "Sticker Geek - Modo Nerd", category: "geek", description: "Un detalle geek con actitud cool para quienes presumen lo que aman.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-geek-modo-nerd" },
  { position: 3, code: "GE003", name: "Sticker Geek - Ctrl Z", category: "geek", description: "Perfecto para fans de la tecnología que quieren un sticker con guiño divertido.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-geek-ctrl-z" },
  { position: 4, code: "GE004", name: "Sticker Geek - Ciencia Pop", category: "geek", description: "Color, curiosidad y vibra creativa en un diseño fácil de combinar.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-geek-ciencia-pop" },
  { position: 5, code: "GE005", name: "Sticker Geek - Pixel Genius", category: "geek", description: "Toque retro-digital para que cualquier accesorio se vea más único.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-geek-pixel-genius" },
  { position: 6, code: "GE006", name: "Sticker Geek - Café y Código", category: "geek", description: "Ideal para mentes creativas que funcionan mejor con café y buenas ideas.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-geek-cafe-y-codigo" },
  { position: 7, code: "GE007", name: "Sticker Geek - Universo Retro", category: "geek", description: "Nostalgia geek lista para pegar y convertir lo simple en especial.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-geek-universo-retro" },
  { position: 8, code: "GE008", name: "Sticker Geek - Byte Lover", category: "geek", description: "Pequeño, expresivo y hecho para fans de los detalles tech.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-geek-byte-lover" },
  { position: 9, code: "GE009", name: "Sticker Geek - Lab Vibes", category: "geek", description: "Energía de laboratorio creativo para personalizar con estilo MatrixLab.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-geek-lab-vibes" },
  { position: 10, code: "GE010", name: "Sticker Geek - Cerebro Digital", category: "geek", description: "Diseño con chispa para quienes llevan la creatividad en modo activo.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-geek-cerebro-digital" },
  { position: 11, code: "GA001", name: "Sticker Gamer - Nivel Pro", category: "gamer", description: "Para subirle el estilo a cualquier termo, consola o setup gamer.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-gamer-nivel-pro" },
  { position: 12, code: "GA002", name: "Sticker Gamer - Respawn", category: "gamer", description: "Un sticker con vibra de segunda oportunidad y partida nueva.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-gamer-respawn" },
  { position: 13, code: "GA003", name: "Sticker Gamer - Joystick Power", category: "gamer", description: "Energía gamer lista para destacar en tu colección favorita.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-gamer-joystick-power" },
  { position: 14, code: "GA004", name: "Sticker Gamer - Boss Final", category: "gamer", description: "Diseño con presencia para quienes juegan siempre con actitud ganadora.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-gamer-boss-final" },
  { position: 15, code: "GA005", name: "Sticker Gamer - Loot Legendario", category: "gamer", description: "Ese detalle especial que se siente como recompensa desbloqueada.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-gamer-loot-legendario" },
  { position: 16, code: "GA006", name: "Sticker Gamer - GG Vibes", category: "gamer", description: "Simple, divertido y perfecto para fans de las buenas partidas.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-gamer-gg-vibes" },
  { position: 17, code: "GA007", name: "Sticker Gamer - Modo Co-op", category: "gamer", description: "Ideal para regalar o combinar con tu dúo gamer favorito.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-gamer-modo-co-op" },
  { position: 18, code: "GA008", name: "Sticker Gamer - Game Over Cool", category: "gamer", description: "Un toque atrevido para accesorios que necesitan más personalidad.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-gamer-game-over-cool" },
  { position: 19, code: "GA009", name: "Sticker Gamer - XP Boost", category: "gamer", description: "Diseño dinámico para que tu sticker se sienta como mejora instantánea.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-gamer-xp-boost" },
  { position: 20, code: "GA010", name: "Sticker Gamer - Headset On", category: "gamer", description: "Vibra de streaming, chat y partidas largas en un solo detalle.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-gamer-headset-on" },
  { position: 21, code: "PK001", name: "Sticker Pokemon - Entrenador Elite", category: "pokemon", description: "Para fans que quieren llevar su aventura favorita a todos lados.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-pokemon-entrenador-elite" },
  { position: 22, code: "PK002", name: "Sticker Pokemon - Pokebola Pop", category: "pokemon", description: "Color llamativo y nostalgia instantánea para personalizar con energía.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-pokemon-pokebola-pop" },
  { position: 23, code: "PK003", name: "Sticker Pokemon - Tipo Eléctrico", category: "pokemon", description: "Diseño vibrante para darle chispa a vasos, libretas o laptops.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-pokemon-tipo-electrico" },
  { position: 24, code: "PK004", name: "Sticker Pokemon - Ruta Aventura", category: "pokemon", description: "Un sticker listo para acompañar colecciones, regalos y combos temáticos.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-pokemon-ruta-aventura" },
  { position: 25, code: "PK005", name: "Sticker Pokemon - Batalla Épica", category: "pokemon", description: "Perfecto para quienes aman la emoción de cada duelo y evolución.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-pokemon-batalla-epica" },
  { position: 26, code: "PK006", name: "Sticker Pokemon - Starter Vibes", category: "pokemon", description: "Ese detalle inicial que vuelve cualquier accesorio más coleccionable.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-pokemon-starter-vibes" },
  { position: 27, code: "PK007", name: "Sticker Pokemon - Gimnasio Pro", category: "pokemon", description: "Estilo de campeón para fans que no pasan desapercibidos.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-pokemon-gimnasio-pro" },
  { position: 28, code: "PK008", name: "Sticker Pokemon - Captura Total", category: "pokemon", description: "Diseño irresistible para atrapar miradas desde el primer vistazo.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-pokemon-captura-total" },
  { position: 29, code: "PK009", name: "Sticker Pokemon - Liga Master", category: "pokemon", description: "Un toque ganador para completar sets con mucha personalidad.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-pokemon-liga-master" },
  { position: 30, code: "PK010", name: "Sticker Pokemon - Evolución Glow", category: "pokemon", description: "Vibra brillante y coleccionable para fans de todas las generaciones.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-pokemon-evolucion-glow" },
  { position: 31, code: "FU001", name: "Sticker Futbol - Golazo", category: "futbol", description: "Pura pasión de cancha para pegar donde se vive el futbol.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-futbol-golazo" },
  { position: 32, code: "FU002", name: "Sticker Futbol - Pasión de Cancha", category: "futbol", description: "Diseño hecho para hinchas que llevan el juego en el corazón.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-futbol-pasion-de-cancha" },
  { position: 33, code: "FU003", name: "Sticker Futbol - Barra Brava", category: "futbol", description: "Energía de estadio para accesorios con carácter y movimiento.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-futbol-barra-brava" },
  { position: 34, code: "FU004", name: "Sticker Futbol - Campeón", category: "futbol", description: "Sticker ideal para celebrar victorias, torneos y equipos favoritos.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-futbol-campeon" },
  { position: 35, code: "FU005", name: "Sticker Futbol - Tiro Libre", category: "futbol", description: "Un detalle dinámico que se siente listo para meter gol.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-futbol-tiro-libre" },
  { position: 36, code: "FU006", name: "Sticker Futbol - Portería", category: "futbol", description: "Estilo futbolero limpio para vasos, termos o libretas deportivas.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-futbol-porteria" },
  { position: 37, code: "FU007", name: "Sticker Futbol - Balón Clásico", category: "futbol", description: "Diseño fácil de vender para fans de todas las edades.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-futbol-balon-clasico" },
  { position: 38, code: "FU008", name: "Sticker Futbol - La 10", category: "futbol", description: "Para quien quiere sentirse figura dentro y fuera de la cancha.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-futbol-la-10" },
  { position: 39, code: "FU009", name: "Sticker Futbol - Hincha Fiel", category: "futbol", description: "Un sticker con orgullo para quienes nunca abandonan a su equipo.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-futbol-hincha-fiel" },
  { position: 40, code: "FU010", name: "Sticker Futbol - Final Soñada", category: "futbol", description: "Perfecto para regalos, celebraciones y temporadas de torneo.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-futbol-final-sonada" },
  { position: 41, code: "RE001", name: "Sticker Resident Evil - Umbrella Alert", category: "resident-evil", description: "Estética survival horror para fans que aman lo oscuro y coleccionable.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-resident-evil-umbrella-alert" },
  { position: 42, code: "RE002", name: "Sticker Resident Evil - Survival Mode", category: "resident-evil", description: "Diseño intenso para darle misterio a cualquier accesorio.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-resident-evil-survival-mode" },
  { position: 43, code: "RE003", name: "Sticker Resident Evil - Biohazard", category: "resident-evil", description: "Un clásico de terror con presencia fuerte y estilo gamer.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-resident-evil-biohazard" },
  { position: 44, code: "RE004", name: "Sticker Resident Evil - Laboratorio Oscuro", category: "resident-evil", description: "Vibra de suspenso perfecta para termos, laptops y libretas.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-resident-evil-laboratorio-oscuro" },
  { position: 45, code: "RE005", name: "Sticker Resident Evil - Noche Infectada", category: "resident-evil", description: "Para quienes buscan un sticker con tensión y mucho carácter.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-resident-evil-noche-infectada" },
  { position: 46, code: "RE006", name: "Sticker Resident Evil - Misión Escape", category: "resident-evil", description: "Diseño llamativo que se siente listo para una historia secreta.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-resident-evil-mision-escape" },
  { position: 47, code: "RE007", name: "Sticker Resident Evil - Clave Roja", category: "resident-evil", description: "Un detalle oscuro y elegante para fans del horror de supervivencia.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-resident-evil-clave-roja" },
  { position: 48, code: "RE008", name: "Sticker Resident Evil - Susto Premium", category: "resident-evil", description: "Sticker con impacto visual para destacar en cualquier colección.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-resident-evil-susto-premium" },
  { position: 49, code: "RE009", name: "Sticker Resident Evil - Archivo Secreto", category: "resident-evil", description: "Perfecto para quienes aman pistas, misterio y estética de culto.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-resident-evil-archivo-secreto" },
  { position: 50, code: "RE010", name: "Sticker Resident Evil - Antihero Vibes", category: "resident-evil", description: "Actitud intensa y coleccionable para accesorios con personalidad fuerte.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-resident-evil-antihero-vibes" },
  { position: 51, code: "GR001", name: "Sticker Graduaciones - Orgullo Graduado", category: "graduaciones", description: "Ideal para celebrar el logro con un detalle bonito y memorable.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-graduaciones-orgullo-graduado" },
  { position: 52, code: "GR002", name: "Sticker Graduaciones - Birrete Brillante", category: "graduaciones", description: "Un sticker festivo para regalos, termos y recuerdos de graduación.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-graduaciones-birrete-brillante" },
  { position: 53, code: "GR003", name: "Sticker Graduaciones - Generación 2026", category: "graduaciones", description: "Perfecto para personalizar souvenirs de una generación inolvidable.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-graduaciones-generacion-2026" },
  { position: 54, code: "GR004", name: "Sticker Graduaciones - Meta Cumplida", category: "graduaciones", description: "Diseño emotivo para celebrar esfuerzo, cierre de etapa y nuevos comienzos.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-graduaciones-meta-cumplida" },
  { position: 55, code: "GR005", name: "Sticker Graduaciones - Foto de Honor", category: "graduaciones", description: "Detalle especial para acompañar recuerdos, álbumes o regalos.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-graduaciones-foto-de-honor" },
  { position: 56, code: "GR006", name: "Sticker Graduaciones - Diploma Vibes", category: "graduaciones", description: "Un toque elegante y alegre para festejar el gran día.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-graduaciones-diploma-vibes" },
  { position: 57, code: "GR007", name: "Sticker Graduaciones - Promoción", category: "graduaciones", description: "Sticker versátil para packs escolares, fiestas y entregas especiales.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-graduaciones-promocion" },
  { position: 58, code: "GR008", name: "Sticker Graduaciones - Sueño Logrado", category: "graduaciones", description: "Mensaje inspirador que convierte cualquier producto en recuerdo significativo.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-graduaciones-sueno-logrado" },
  { position: 59, code: "GR009", name: "Sticker Graduaciones - Fiesta de Grado", category: "graduaciones", description: "Energía de celebración lista para personalizar y regalar.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-graduaciones-fiesta-de-grado" },
  { position: 60, code: "GR010", name: "Sticker Graduaciones - Futuro Brillante", category: "graduaciones", description: "Diseño optimista para vender como detalle de cierre y comienzo.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-graduaciones-futuro-brillante" },
  { position: 61, code: "ML001", name: "Sticker My Little Pony - Arcoíris Amistad", category: "my-little-pony", description: "Color dulce y mágico para fans de los detalles tiernos.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-my-little-pony-arcoiris-amistad" },
  { position: 62, code: "ML002", name: "Sticker My Little Pony - Pony Magic", category: "my-little-pony", description: "Diseño encantador que vuelve cualquier accesorio más alegre.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-my-little-pony-pony-magic" },
  { position: 63, code: "ML003", name: "Sticker My Little Pony - Dulce Encanto", category: "my-little-pony", description: "Perfecto para regalos infantiles, termos y libretas llenas de color.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-my-little-pony-dulce-encanto" },
  { position: 64, code: "ML004", name: "Sticker My Little Pony - Brillo Pastel", category: "my-little-pony", description: "Vibra suave, bonita y muy coleccionable para combinar en sets.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-my-little-pony-brillo-pastel" },
  { position: 65, code: "ML005", name: "Sticker My Little Pony - Friendship Vibes", category: "my-little-pony", description: "Un sticker alegre para celebrar amistad, color y fantasía.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-my-little-pony-friendship-vibes" },
  { position: 66, code: "ML006", name: "Sticker My Little Pony - Marca Mágica", category: "my-little-pony", description: "Detalle especial con personalidad tierna y mucha luz visual.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-my-little-pony-marca-magica" },
  { position: 67, code: "ML007", name: "Sticker My Little Pony - Nube Pastel", category: "my-little-pony", description: "Diseño suave y llamativo para productos con estilo cute.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-my-little-pony-nube-pastel" },
  { position: 68, code: "ML008", name: "Sticker My Little Pony - Aventura Pony", category: "my-little-pony", description: "Ideal para fans que quieren llevar fantasía a todas partes.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-my-little-pony-aventura-pony" },
  { position: 69, code: "ML009", name: "Sticker My Little Pony - Corazón Arcoíris", category: "my-little-pony", description: "Un toque feliz para accesorios que necesitan más color.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-my-little-pony-corazon-arcoiris" },
  { position: 70, code: "ML010", name: "Sticker My Little Pony - Sueño Mágico", category: "my-little-pony", description: "Sticker dulce y brillante, fácil de amar desde el primer vistazo.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-my-little-pony-sueno-magico" },
  { position: 71, code: "GB001", name: "Sticker God Bless America - Stars & Stripes", category: "god-bless-america", description: "Orgullo patriótico con look limpio para termos, autos o laptops.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-god-bless-america-stars-and-stripes" },
  { position: 72, code: "GB002", name: "Sticker God Bless America - Freedom Vibes", category: "god-bless-america", description: "Diseño fuerte y positivo para celebrar el espíritu americano.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-god-bless-america-freedom-vibes" },
  { position: 73, code: "GB003", name: "Sticker God Bless America - USA Pride", category: "god-bless-america", description: "Un clásico visual fácil de vender en temporadas patrióticas.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-god-bless-america-usa-pride" },
  { position: 74, code: "GB004", name: "Sticker God Bless America - Patriotic Heart", category: "god-bless-america", description: "Detalle emotivo para regalos, celebraciones y recuerdos familiares.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-god-bless-america-patriotic-heart" },
  { position: 75, code: "GB005", name: "Sticker God Bless America - Liberty Shine", category: "god-bless-america", description: "Brillo de libertad para accesorios con presencia y significado.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-god-bless-america-liberty-shine" },
  { position: 76, code: "GB006", name: "Sticker God Bless America - America Strong", category: "god-bless-america", description: "Mensaje poderoso para quienes quieren mostrar orgullo con estilo.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-god-bless-america-america-strong" },
  { position: 77, code: "GB007", name: "Sticker God Bless America - Red White Blue", category: "god-bless-america", description: "Combinación icónica para destacar rápido en cualquier producto.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-god-bless-america-red-white-blue" },
  { position: 78, code: "GB008", name: "Sticker God Bless America - Blessings USA", category: "god-bless-america", description: "Diseño con fe, orgullo y vibra positiva para regalar.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-god-bless-america-blessings-usa" },
  { position: 79, code: "GB009", name: "Sticker God Bless America - Liberty Spirit", category: "god-bless-america", description: "Estilo patriótico elegante para colecciones temáticas y souvenirs.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-god-bless-america-liberty-spirit" },
  { position: 80, code: "GB010", name: "Sticker God Bless America - Home of the Brave", category: "god-bless-america", description: "Un sticker con mensaje fuerte y presencia memorable.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-god-bless-america-home-of-the-brave" },
  { position: 81, code: "AN001", name: "Sticker Anime - Senpai Mood", category: "anime", description: "Vibra anime divertida para fans que aman personalizarlo todo.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-anime-senpai-mood" },
  { position: 82, code: "AN002", name: "Sticker Anime - Kawaii Pop", category: "anime", description: "Color y ternura para hacer más cute cualquier accesorio.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-anime-kawaii-pop" },
  { position: 83, code: "AN003", name: "Sticker Anime - Shonen Power", category: "anime", description: "Energía de protagonista para stickers con mucha actitud.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-anime-shonen-power" },
  { position: 84, code: "AN004", name: "Sticker Anime - Chibi Star", category: "anime", description: "Diseño adorable y coleccionable para regalos y combos temáticos.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-anime-chibi-star" },
  { position: 85, code: "AN005", name: "Sticker Anime - Sakura Vibes", category: "anime", description: "Toque suave y visual para fans del estilo japonés.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-anime-sakura-vibes" },
  { position: 86, code: "AN006", name: "Sticker Anime - Otaku Heart", category: "anime", description: "Un sticker directo para quienes presumen su fandom con orgullo.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-anime-otaku-heart" },
  { position: 87, code: "AN007", name: "Sticker Anime - Manga Panel", category: "anime", description: "Look de viñeta para personalizar con estética de historia.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-anime-manga-panel" },
  { position: 88, code: "AN008", name: "Sticker Anime - Hero Arc", category: "anime", description: "Diseño con vibra de evolución, aventura y momento épico.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-anime-hero-arc" },
  { position: 89, code: "AN009", name: "Sticker Anime - Mecha Energy", category: "anime", description: "Estilo futurista para accesorios con presencia fuerte.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-anime-mecha-energy" },
  { position: 90, code: "AN010", name: "Sticker Anime - Magic Girl", category: "anime", description: "Brillo, color y fantasía para colecciones llenas de encanto.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-anime-magic-girl" },
  { position: 91, code: "MU001", name: "Sticker Musica - Beat Lover", category: "musica", description: "Ritmo visual para fans que llevan la música a todos lados.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-musica-beat-lover" },
  { position: 92, code: "MU002", name: "Sticker Musica - Vinilo Retro", category: "musica", description: "Nostalgia musical perfecta para termos, laptops y libretas.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-musica-vinilo-retro" },
  { position: 93, code: "MU003", name: "Sticker Musica - Corazón Pop", category: "musica", description: "Diseño alegre para quienes aman canciones pegajosas y buen estilo.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-musica-corazon-pop" },
  { position: 94, code: "MU004", name: "Sticker Musica - Bajo Profundo", category: "musica", description: "Un sticker con presencia para accesorios con actitud sonora.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-musica-bajo-profundo" },
  { position: 95, code: "MU005", name: "Sticker Musica - Karaoke Night", category: "musica", description: "Ideal para regalos divertidos y colecciones con vibra de fiesta.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-musica-karaoke-night" },
  { position: 96, code: "MU006", name: "Sticker Musica - Festival Vibes", category: "musica", description: "Color y energía para quienes viven esperando el próximo concierto.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-musica-festival-vibes" },
  { position: 97, code: "MU007", name: "Sticker Musica - Playlist Mood", category: "musica", description: "Un detalle moderno para personalizar con canciones favoritas.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-musica-playlist-mood" },
  { position: 98, code: "MU008", name: "Sticker Musica - Guitarra Vibe", category: "musica", description: "Diseño clásico para fans de riffs, bandas y escenarios.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-musica-guitarra-vibe" },
  { position: 99, code: "MU009", name: "Sticker Musica - Nota Brillante", category: "musica", description: "Toque musical limpio y vendible para cualquier producto.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-musica-nota-brillante" },
  { position: 100, code: "MU010", name: "Sticker Musica - DJ Energy", category: "musica", description: "Vibra nocturna y dinámica para stickers con mucho movimiento.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-musica-dj-energy" },
  { position: 101, code: "LE001", name: "Sticker Lectura - Book Lover", category: "lectura", description: "Para quien siempre trae una historia favorita en la cabeza.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-lectura-book-lover" },
  { position: 102, code: "LE002", name: "Sticker Lectura - Capítulo Feliz", category: "lectura", description: "Un sticker cálido para libretas, termos y rincones de lectura.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-lectura-capitulo-feliz" },
  { position: 103, code: "LE003", name: "Sticker Lectura - Café y Libro", category: "lectura", description: "Combo irresistible para lectores que disfrutan los pequeños rituales.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-lectura-cafe-y-libro" },
  { position: 104, code: "LE004", name: "Sticker Lectura - Página Mágica", category: "lectura", description: "Diseño encantador que convierte cualquier accesorio en biblioteca personal.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-lectura-pagina-magica" },
  { position: 105, code: "LE005", name: "Sticker Lectura - TBR Mood", category: "lectura", description: "Perfecto para fans de listas infinitas y próximas lecturas.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-lectura-tbr-mood" },
  { position: 106, code: "LE006", name: "Sticker Lectura - Librería Vibes", category: "lectura", description: "Aroma visual de estantes, historias nuevas y tardes tranquilas.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-lectura-libreria-vibes" },
  { position: 107, code: "LE007", name: "Sticker Lectura - Marcapáginas Cool", category: "lectura", description: "Un detalle lector que también funciona perfecto como regalo.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-lectura-marcapaginas-cool" },
  { position: 108, code: "LE008", name: "Sticker Lectura - Novela Favorita", category: "lectura", description: "Sticker emotivo para quienes se enamoran de cada historia.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-lectura-novela-favorita" },
  { position: 109, code: "LE009", name: "Sticker Lectura - Plot Twist", category: "lectura", description: "Diseño divertido para lectores que aman las sorpresas.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-lectura-plot-twist" },
  { position: 110, code: "LE010", name: "Sticker Lectura - Lectura Cozy", category: "lectura", description: "Vibra cómoda y bonita para accesorios con alma tranquila.", finishLabel: "UV DTF / temático", inventory: 99, handle: "sticker-lectura-lectura-cozy" },
  // </generated:matrixlab-stickers>
];

/** Código normalizado para archivos/handles: minúsculas. */
export function matrixLabStickerCodeSlug(code: string): string {
  return code.toLowerCase();
}

/**
 * Handle público del diseño. Viene del Excel (columna L), no se recalcula
 * desde el nombre: si mañana cambia el nombre comercial, la URL no se rompe.
 */
export function matrixLabStickerHandle(item: MatrixLabStickerItem): string {
  return item.handle;
}

/** SKU de la variante (columna I). Prefijo STK- definido por el Excel. */
export function matrixLabStickerSku(code: string): string {
  return `STK-${code.toUpperCase()}`;
}

/**
 * Ruta determinista de la fotografía, vinculada por código y en MINÚSCULAS.
 * La convención oficial es lowercase para que el filesystem case-sensitive de
 * Vercel/Linux resuelva igual que el de Windows/macOS en desarrollo.
 * Publicar una foto es copiar `public/images/matrixlab-stickers/<codigo>.webp`.
 */
export function matrixLabStickerImagePath(code: string): string {
  return `${MATRIXLAB_STICKERS_IMAGE_DIR}/${matrixLabStickerCodeSlug(code)}.webp`;
}

/** Etiqueta de referencia mostrada de forma discreta en la tarjeta. */
export function matrixLabStickerRefLabel(code: string): string {
  return `Ref. ${code}`;
}

const BY_HANDLE = new Map(
  MATRIXLAB_STICKERS.map((item) => [item.handle, item]),
);

/** Diseño a partir del handle público; null si no es un MatrixLab Sticker. */
export function matrixLabStickerByHandle(
  handle: string,
): MatrixLabStickerItem | null {
  return BY_HANDLE.get(handle) ?? null;
}

const BY_CODE = new Map(
  MATRIXLAB_STICKERS.map((item) => [item.code.toUpperCase(), item]),
);

/** Diseño a partir de su código interno. */
export function matrixLabStickerByCode(
  code: string,
): MatrixLabStickerItem | null {
  return BY_CODE.get(code.toUpperCase()) ?? null;
}

/** Conteo real por familia, derivado del Excel (para los filtros). */
export function matrixLabStickerCategoryCounts(
  items: readonly MatrixLabStickerItem[] = MATRIXLAB_STICKERS,
): Record<MatrixLabStickerCategoryId, number> {
  const counts = Object.fromEntries(
    MATRIXLAB_STICKER_CATEGORY_ORDER.map((id) => [id, 0]),
  ) as Record<MatrixLabStickerCategoryId, number>;
  for (const item of items) counts[item.category] += 1;
  return counts;
}

/** ¿El diseño entra en el filtro dado? `null` = "Todos". */
export function matchesMatrixLabStickerFilter(
  item: MatrixLabStickerItem,
  filter: MatrixLabStickerCategoryId | null,
): boolean {
  return !filter || item.category === filter;
}

/** Normaliza para búsqueda: minúsculas, sin acentos, sin guiones ni espacios. */
export function normalizeMatrixLabStickerSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[\s-]+/g, "")
    .trim();
}

/**
 * Búsqueda por código, SKU, nombre o categoría. Con 110 referencias es la vía
 * principal de navegación: "GE001", "STK-GE001", "Código Cósmico" y "Geek"
 * llevan al mismo diseño.
 */
export function matchesMatrixLabStickerQuery(
  item: MatrixLabStickerItem,
  query: string,
): boolean {
  const q = normalizeMatrixLabStickerSearch(query);
  if (!q) return true;
  return (
    normalizeMatrixLabStickerSearch(item.code).includes(q) ||
    normalizeMatrixLabStickerSearch(matrixLabStickerSku(item.code)).includes(q) ||
    normalizeMatrixLabStickerSearch(item.name).includes(q) ||
    normalizeMatrixLabStickerSearch(
      MATRIXLAB_STICKER_CATEGORY_LABELS[item.category],
    ).includes(q)
  );
}

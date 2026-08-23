/**
 * MatrixLab Tumbler — catálogo UV Stickers.
 *
 * FUENTE DE VERDAD COMERCIAL: `Catalogo_Stickers_MatrixLab.xlsx`
 * (hoja "Catalogo Stickers"). De ese archivo se toman EXCLUSIVAMENTE:
 *
 *   columna B -> `code`         (código interno, A001–A209)
 *   columna C -> `name`         (nombre público)
 *   columna D -> `category`     (familia comercial)
 *   columna G -> `finishLabel`  (acabado / tamaño)
 *   columna H -> `inventory`    (inventario real en piezas)
 *   columna I -> `sku`          (STK-<código>)
 *   columna J -> `price`        (precio unitario)
 *   columna L -> `handle`       (sticker-<código en minúsculas>)
 *   columna M -> ruta de imagen (/images/tumbler/stickers/<código>.webp)
 *
 * NO se usa la columna K ("Total"): es inventario x precio, no precio unitario.
 *
 * El orden del arreglo es el orden EXACTO del Excel (A001 → A209) y es el
 * orden público por defecto de la categoría: no se reordena alfabéticamente.
 *
 * Este módulo es la fuente única para catálogo, seed y QA. El bloque de datos
 * está delimitado por marcadores y lo regenera
 * `scripts/data/build-tumbler-stickers.ts` (que también reescribe el seed SQL).
 */

/** Handle de la categoría (Wraps & Glow Finish, subcategoría de Tumbler). */
export const STICKERS_CATEGORY_HANDLE = "wraps-glow-finish";

/** Carpeta pública de las fotos, vinculadas por CÓDIGO (no por nombre). */
export const STICKERS_IMAGE_DIR = "/images/tumbler/stickers";

/** Placeholder de marca para los stickers que aún no tienen fotografía. */
export const STICKER_PLACEHOLDER_IMAGE = `${STICKERS_IMAGE_DIR}/placeholder.webp`;

/**
 * Encabezado público de la categoría. Es SOLO presentación: ni el handle ni la
 * fila de `categories` cambian, así que /tienda/categoria/wraps-glow-finish y
 * cualquier referencia interna a "Wraps & Glow Finish" siguen funcionando.
 */
export const STICKERS_PUBLIC_TITLE = "UV Stickers MatrixLab Tumbler";

/** Familias reales del Excel (columna D). No se inventa ninguna otra. */
export type StickerFinishId = "24oz" | "holografico" | "glitter" | "mini";

export interface StickerItem {
  /** Posición en el Excel (1-209). Define el orden público por defecto. */
  position: number;
  /** Código interno (columna B). */
  code: string;
  /** Nombre público (columna C). */
  name: string;
  /** Familia comercial (columna D), normalizada a un id de filtro. */
  finish: StickerFinishId;
  /** Acabado / tamaño tal como lo declara el Excel (columna G). */
  finishLabel: string;
  /** Inventario real en piezas (columna H). */
  inventory: number;
  /** Precio unitario (columna J). */
  price: number;
}

/** Etiquetas públicas de cada familia (para filtros y ficha de producto). */
export const STICKER_FINISH_LABELS: Record<StickerFinishId, string> = {
  "24oz": "24 oz",
  holografico: "Holográfico",
  glitter: "Glitter",
  mini: "Mini",
};

/** Nombre comercial completo de la familia (columna D del Excel). */
export const STICKER_FINISH_CATEGORIES: Record<StickerFinishId, string> = {
  "24oz": "UV Stickers 24oz",
  holografico: "UV Stickers Especiales — Holográfico",
  glitter: "UV Stickers Especiales — Glitter",
  mini: "UV Stickers Mini",
};

/** Orden de los filtros en la interfaz (mismo orden que el Excel). */
export const STICKER_FINISH_ORDER: readonly StickerFinishId[] = [
  "24oz",
  "holografico",
  "glitter",
  "mini",
];

/** Los 209 UV Stickers del Excel, en su orden original. */
export const TUMBLER_STICKERS: readonly StickerItem[] = [
  // <generated:stickers>
  { position: 1, code: "A001", name: "UV Sticker 24oz A001", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 2, code: "A002", name: "UV Sticker 24oz A002", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 3, code: "A003", name: "UV Sticker 24oz A003", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 4, code: "A004", name: "UV Sticker 24oz A004", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 5, code: "A005", name: "UV Sticker 24oz A005", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 6, code: "A006", name: "UV Sticker 24oz A006", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 7, code: "A007", name: "UV Sticker 24oz A007", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 8, code: "A008", name: "UV Sticker 24oz A008", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 9, code: "A009", name: "UV Sticker 24oz A009", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 10, code: "A010", name: "UV Sticker 24oz A010", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 11, code: "A011", name: "UV Sticker 24oz A011", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 12, code: "A012", name: "UV Sticker 24oz A012", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 13, code: "A013", name: "UV Sticker 24oz A013", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 14, code: "A014", name: "UV Sticker 24oz A014", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 15, code: "A015", name: "UV Sticker 24oz A015", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 16, code: "A016", name: "UV Sticker 24oz A016", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 17, code: "A017", name: "UV Sticker 24oz A017", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 18, code: "A018", name: "UV Sticker 24oz A018", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 19, code: "A019", name: "UV Sticker 24oz A019", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 20, code: "A020", name: "UV Sticker 24oz A020", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 21, code: "A021", name: "UV Sticker 24oz A021", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 22, code: "A022", name: "UV Sticker 24oz A022", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 23, code: "A023", name: "UV Sticker 24oz A023", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 24, code: "A024", name: "UV Sticker 24oz A024", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 25, code: "A025", name: "UV Sticker 24oz A025", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 26, code: "A026", name: "UV Sticker 24oz A026", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 27, code: "A027", name: "UV Sticker 24oz A027", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 28, code: "A028", name: "UV Sticker 24oz A028", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 29, code: "A029", name: "UV Sticker 24oz A029", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 30, code: "A030", name: "UV Sticker 24oz A030", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 31, code: "A031", name: "UV Sticker 24oz A031", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 32, code: "A032", name: "UV Sticker 24oz A032", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 33, code: "A033", name: "UV Sticker 24oz A033", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 34, code: "A034", name: "UV Sticker 24oz A034", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 35, code: "A035", name: "UV Sticker 24oz A035", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 36, code: "A036", name: "UV Sticker 24oz A036", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 37, code: "A037", name: "UV Sticker 24oz A037", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 38, code: "A038", name: "UV Sticker 24oz A038", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 39, code: "A039", name: "UV Sticker 24oz A039", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 40, code: "A040", name: "UV Sticker 24oz A040", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 41, code: "A041", name: "UV Sticker 24oz A041", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 42, code: "A042", name: "UV Sticker 24oz A042", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 43, code: "A043", name: "UV Sticker 24oz A043", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 44, code: "A044", name: "UV Sticker 24oz A044", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 45, code: "A045", name: "UV Sticker 24oz A045", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 46, code: "A046", name: "UV Sticker 24oz A046", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 47, code: "A047", name: "UV Sticker 24oz A047", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 48, code: "A048", name: "UV Sticker 24oz A048", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 49, code: "A049", name: "UV Sticker 24oz A049", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 50, code: "A050", name: "UV Sticker 24oz A050", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 51, code: "A051", name: "UV Sticker 24oz A051", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 52, code: "A052", name: "UV Sticker 24oz A052", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 53, code: "A053", name: "UV Sticker 24oz A053", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 54, code: "A054", name: "UV Sticker 24oz A054", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 55, code: "A055", name: "UV Sticker 24oz A055", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 56, code: "A056", name: "UV Sticker 24oz A056", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 57, code: "A057", name: "UV Sticker 24oz A057", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 58, code: "A058", name: "UV Sticker 24oz A058", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 59, code: "A059", name: "UV Sticker 24oz A059", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 60, code: "A060", name: "UV Sticker 24oz A060", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 61, code: "A061", name: "UV Sticker 24oz A061", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 62, code: "A062", name: "UV Sticker 24oz A062", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 63, code: "A063", name: "UV Sticker 24oz A063", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 64, code: "A064", name: "UV Sticker 24oz A064", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 65, code: "A065", name: "UV Sticker 24oz A065", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 66, code: "A066", name: "UV Sticker 24oz A066", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 67, code: "A067", name: "UV Sticker 24oz A067", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 68, code: "A068", name: "UV Sticker 24oz A068", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 69, code: "A069", name: "UV Sticker 24oz A069", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 70, code: "A070", name: "UV Sticker 24oz A070", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 71, code: "A071", name: "UV Sticker 24oz A071", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 72, code: "A072", name: "UV Sticker 24oz A072", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 73, code: "A073", name: "UV Sticker 24oz A073", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 74, code: "A074", name: "UV Sticker 24oz A074", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 75, code: "A075", name: "UV Sticker 24oz A075", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 76, code: "A076", name: "UV Sticker 24oz A076", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 77, code: "A077", name: "UV Sticker 24oz A077", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 78, code: "A078", name: "UV Sticker 24oz A078", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 79, code: "A079", name: "UV Sticker 24oz A079", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 80, code: "A080", name: "UV Sticker 24oz A080", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 81, code: "A081", name: "UV Sticker 24oz A081", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 82, code: "A082", name: "UV Sticker 24oz A082", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 83, code: "A083", name: "UV Sticker 24oz A083", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 84, code: "A084", name: "UV Sticker 24oz A084", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 85, code: "A085", name: "UV Sticker 24oz A085", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 86, code: "A086", name: "UV Sticker 24oz A086", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 87, code: "A087", name: "UV Sticker 24oz A087", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 88, code: "A088", name: "UV Sticker 24oz A088", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 89, code: "A089", name: "UV Sticker 24oz A089", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 90, code: "A090", name: "UV Sticker 24oz A090", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 91, code: "A091", name: "UV Sticker 24oz A091", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 92, code: "A092", name: "UV Sticker 24oz A092", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 93, code: "A093", name: "UV Sticker 24oz A093", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 94, code: "A094", name: "UV Sticker 24oz A094", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 95, code: "A095", name: "UV Sticker 24oz A095", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 96, code: "A096", name: "UV Sticker 24oz A096", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 97, code: "A097", name: "UV Sticker 24oz A097", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 98, code: "A098", name: "UV Sticker 24oz A098", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 99, code: "A099", name: "UV Sticker 24oz A099", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 100, code: "A100", name: "UV Sticker 24oz A100", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 101, code: "A101", name: "UV Sticker 24oz A101", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 102, code: "A102", name: "UV Sticker 24oz A102", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 103, code: "A103", name: "UV Sticker 24oz A103", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 104, code: "A104", name: "UV Sticker 24oz A104", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 105, code: "A105", name: "UV Sticker 24oz A105", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 106, code: "A106", name: "UV Sticker 24oz A106", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 107, code: "A107", name: "UV Sticker 24oz A107", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 108, code: "A108", name: "UV Sticker 24oz A108", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 109, code: "A109", name: "UV Sticker 24oz A109", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 110, code: "A110", name: "UV Sticker 24oz A110", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 111, code: "A111", name: "UV Sticker 24oz A111", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 112, code: "A112", name: "UV Sticker 24oz A112", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 113, code: "A113", name: "UV Sticker 24oz A113", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 114, code: "A114", name: "UV Sticker 24oz A114", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 115, code: "A115", name: "UV Sticker 24oz A115", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 116, code: "A116", name: "UV Sticker 24oz A116", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 117, code: "A117", name: "UV Sticker 24oz A117", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 118, code: "A118", name: "UV Sticker 24oz A118", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 119, code: "A119", name: "UV Sticker 24oz A119", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 120, code: "A120", name: "UV Sticker 24oz A120", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 121, code: "A121", name: "UV Sticker 24oz A121", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 122, code: "A122", name: "UV Sticker 24oz A122", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 123, code: "A123", name: "UV Sticker 24oz A123", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 124, code: "A124", name: "UV Sticker 24oz A124", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 125, code: "A125", name: "UV Sticker 24oz A125", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 126, code: "A126", name: "UV Sticker 24oz A126", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 127, code: "A127", name: "UV Sticker 24oz A127", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 128, code: "A128", name: "UV Sticker 24oz A128", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 129, code: "A129", name: "UV Sticker 24oz A129", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 130, code: "A130", name: "UV Sticker 24oz A130", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 131, code: "A131", name: "UV Sticker 24oz A131", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 132, code: "A132", name: "UV Sticker 24oz A132", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 133, code: "A133", name: "UV Sticker 24oz A133", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 134, code: "A134", name: "UV Sticker 24oz A134", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 135, code: "A135", name: "UV Sticker 24oz A135", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 136, code: "A136", name: "UV Sticker 24oz A136", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 137, code: "A137", name: "UV Sticker 24oz A137", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 138, code: "A138", name: "UV Sticker 24oz A138", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 139, code: "A139", name: "UV Sticker 24oz A139", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 140, code: "A140", name: "UV Sticker 24oz A140", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 141, code: "A141", name: "UV Sticker 24oz A141", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 142, code: "A142", name: "UV Sticker 24oz A142", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 143, code: "A143", name: "UV Sticker 24oz A143", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 144, code: "A144", name: "UV Sticker 24oz A144", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 145, code: "A145", name: "UV Sticker 24oz A145", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 146, code: "A146", name: "UV Sticker 24oz A146", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 147, code: "A147", name: "UV Sticker 24oz A147", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 148, code: "A148", name: "UV Sticker 24oz A148", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 149, code: "A149", name: "UV Sticker 24oz A149", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 150, code: "A150", name: "UV Sticker 24oz A150", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 151, code: "A151", name: "UV Sticker 24oz A151", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 152, code: "A152", name: "UV Sticker 24oz A152", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 153, code: "A153", name: "UV Sticker 24oz A153", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 154, code: "A154", name: "UV Sticker 24oz A154", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 155, code: "A155", name: "UV Sticker 24oz A155", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 156, code: "A156", name: "UV Sticker 24oz A156", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 157, code: "A157", name: "UV Sticker 24oz A157", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 158, code: "A158", name: "UV Sticker 24oz A158", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 159, code: "A159", name: "UV Sticker 24oz A159", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 160, code: "A160", name: "UV Sticker 24oz A160", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 161, code: "A161", name: "UV Sticker 24oz A161", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 162, code: "A162", name: "UV Sticker 24oz A162", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 163, code: "A163", name: "UV Sticker 24oz A163", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 164, code: "A164", name: "UV Sticker 24oz A164", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 165, code: "A165", name: "UV Sticker 24oz A165", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 166, code: "A166", name: "UV Sticker 24oz A166", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 167, code: "A167", name: "UV Sticker 24oz A167", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 168, code: "A168", name: "UV Sticker 24oz A168", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 169, code: "A169", name: "UV Sticker 24oz A169", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 170, code: "A170", name: "UV Sticker 24oz A170", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 171, code: "A171", name: "UV Sticker 24oz A171", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 172, code: "A172", name: "UV Sticker 24oz A172", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 173, code: "A173", name: "UV Sticker 24oz A173", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 174, code: "A174", name: "UV Sticker 24oz A174", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 175, code: "A175", name: "UV Sticker 24oz A175", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 176, code: "A176", name: "UV Sticker 24oz A176", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 177, code: "A177", name: "UV Sticker 24oz A177", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 178, code: "A178", name: "UV Sticker 24oz A178", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 179, code: "A179", name: "UV Sticker 24oz A179", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 180, code: "A180", name: "UV Sticker 24oz A180", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 181, code: "A181", name: "UV Sticker 24oz A181", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 182, code: "A182", name: "UV Sticker 24oz A182", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 183, code: "A183", name: "UV Sticker 24oz A183", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 184, code: "A184", name: "UV Sticker 24oz A184", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 185, code: "A185", name: "UV Sticker 24oz A185", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 186, code: "A186", name: "UV Sticker 24oz A186", finish: "24oz", finishLabel: "24 oz", inventory: 3, price: 85 },
  { position: 187, code: "A187", name: "UV Sticker Holográfico A187", finish: "holografico", finishLabel: "Holográfico 16 oz", inventory: 3, price: 95 },
  { position: 188, code: "A188", name: "UV Sticker Holográfico A188", finish: "holografico", finishLabel: "Holográfico 16 oz", inventory: 3, price: 95 },
  { position: 189, code: "A189", name: "UV Sticker Glitter A189", finish: "glitter", finishLabel: "Glitter 16 oz", inventory: 3, price: 85 },
  { position: 190, code: "A190", name: "UV Sticker Glitter A190", finish: "glitter", finishLabel: "Glitter 16 oz", inventory: 3, price: 85 },
  { position: 191, code: "A191", name: "UV Sticker Glitter A191", finish: "glitter", finishLabel: "Glitter 16 oz", inventory: 3, price: 85 },
  { position: 192, code: "A192", name: "UV Sticker Glitter A192", finish: "glitter", finishLabel: "Glitter 16 oz", inventory: 3, price: 85 },
  { position: 193, code: "A193", name: "UV Sticker Glitter A193", finish: "glitter", finishLabel: "Glitter 16 oz", inventory: 3, price: 85 },
  { position: 194, code: "A194", name: "UV Sticker Glitter A194", finish: "glitter", finishLabel: "Glitter 16 oz", inventory: 3, price: 85 },
  { position: 195, code: "A195", name: "UV Sticker Glitter A195", finish: "glitter", finishLabel: "Glitter 16 oz", inventory: 3, price: 85 },
  { position: 196, code: "A196", name: "UV Sticker Glitter A196", finish: "glitter", finishLabel: "Glitter 16 oz", inventory: 3, price: 85 },
  { position: 197, code: "A197", name: "UV Sticker Mini A197", finish: "mini", finishLabel: "Mini individual", inventory: 3, price: 45 },
  { position: 198, code: "A198", name: "UV Sticker Mini A198", finish: "mini", finishLabel: "Mini individual", inventory: 3, price: 45 },
  { position: 199, code: "A199", name: "UV Sticker Mini A199", finish: "mini", finishLabel: "Mini individual", inventory: 3, price: 45 },
  { position: 200, code: "A200", name: "UV Sticker Mini A200", finish: "mini", finishLabel: "Mini individual", inventory: 3, price: 45 },
  { position: 201, code: "A201", name: "UV Sticker Mini A201", finish: "mini", finishLabel: "Mini individual", inventory: 3, price: 45 },
  { position: 202, code: "A202", name: "UV Sticker Mini A202", finish: "mini", finishLabel: "Mini individual", inventory: 3, price: 45 },
  { position: 203, code: "A203", name: "UV Sticker Mini A203", finish: "mini", finishLabel: "Mini individual", inventory: 3, price: 45 },
  { position: 204, code: "A204", name: "UV Sticker Mini A204", finish: "mini", finishLabel: "Mini individual", inventory: 3, price: 45 },
  { position: 205, code: "A205", name: "UV Sticker Mini A205", finish: "mini", finishLabel: "Mini individual", inventory: 3, price: 45 },
  { position: 206, code: "A206", name: "UV Sticker Mini A206", finish: "mini", finishLabel: "Mini individual", inventory: 3, price: 45 },
  { position: 207, code: "A207", name: "UV Sticker Mini A207", finish: "mini", finishLabel: "Mini individual", inventory: 3, price: 45 },
  { position: 208, code: "A208", name: "UV Sticker Mini A208", finish: "mini", finishLabel: "Mini individual", inventory: 3, price: 45 },
  { position: 209, code: "A209", name: "UV Sticker Mini A209", finish: "mini", finishLabel: "Mini individual", inventory: 3, price: 45 },
  // </generated:stickers>
];

/** Código normalizado para archivos/handles: minúsculas. */
export function stickerCodeSlug(code: string): string {
  return code.toLowerCase();
}

/**
 * Handle estable del producto (columna L). Se deriva del CÓDIGO, nunca del
 * nombre comercial: si el nombre cambia, la URL y la imagen siguen sirviendo.
 */
export function stickerHandle(code: string): string {
  return `sticker-${stickerCodeSlug(code)}`;
}

/** SKU de la variante (columna I). Prefijo STK- definido por el Excel. */
export function stickerSku(code: string): string {
  return `STK-${code.toUpperCase()}`;
}

/**
 * Ruta determinista de la fotografía (columna M), vinculada por código.
 * Publicar una foto es copiar `public/images/tumbler/stickers/<codigo>.webp`:
 * no se toca ni el código ni Supabase.
 */
export function stickerImagePath(code: string): string {
  return `${STICKERS_IMAGE_DIR}/${stickerCodeSlug(code)}.webp`;
}

/** Etiqueta de referencia mostrada de forma discreta en la tarjeta. */
export function stickerRefLabel(code: string): string {
  return `Ref. ${code}`;
}

/** Descripción pública neutra (no inventa datos que el Excel no tiene). */
export function stickerDescription(item: StickerItem): string {
  return `${item.name} — sticker UV de MatrixLab Tumbler. Acabado ${item.finishLabel}. Se vende por pieza. Ref. ${item.code}.`;
}

const BY_HANDLE = new Map(
  TUMBLER_STICKERS.map((item) => [stickerHandle(item.code), item]),
);

/** Sticker a partir del handle del producto; null si no es un UV Sticker. */
export function stickerByHandle(handle: string): StickerItem | null {
  return BY_HANDLE.get(handle) ?? null;
}

const BY_CODE = new Map(
  TUMBLER_STICKERS.map((item) => [item.code.toUpperCase(), item]),
);

/** Sticker a partir de su código interno. */
export function stickerByCode(code: string): StickerItem | null {
  return BY_CODE.get(code.toUpperCase()) ?? null;
}

/** Conteo real por familia, derivado del Excel (para los filtros). */
export function stickerFinishCounts(
  items: readonly StickerItem[] = TUMBLER_STICKERS,
): Record<StickerFinishId, number> {
  const counts: Record<StickerFinishId, number> = {
    "24oz": 0,
    holografico: 0,
    glitter: 0,
    mini: 0,
  };
  for (const item of items) counts[item.finish] += 1;
  return counts;
}

/** ¿El sticker entra en el filtro dado? `null` = "Todos". */
export function matchesStickerFilter(
  item: StickerItem,
  filter: StickerFinishId | null,
): boolean {
  return !filter || item.finish === filter;
}

/**
 * Búsqueda por código, nombre o SKU. Con 209 referencias es la vía principal
 * de navegación: "A050", "STK-A050" y "UV Sticker 24oz A050" dan el mismo
 * producto.
 */
export function matchesStickerQuery(
  item: { name: string; code: string },
  query: string,
): boolean {
  const q = normalizeStickerSearch(query);
  if (!q) return true;
  return (
    normalizeStickerSearch(item.code).includes(q) ||
    normalizeStickerSearch(item.name).includes(q) ||
    normalizeStickerSearch(stickerSku(item.code)).includes(q)
  );
}

/** Normaliza para búsqueda: minúsculas, sin acentos, sin guiones ni espacios. */
export function normalizeStickerSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[\s-]+/g, "")
    .trim();
}

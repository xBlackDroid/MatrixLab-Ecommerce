/**
 * Reparación de "mojibake" para los textos del catálogo público.
 *
 * Algunos registros del catálogo (categorías / productos) pueden venir con la
 * codificación rota — UTF-8 interpretado como Latin-1 / Windows-1252 — y se ven
 * como `DiseÃ±ador`, `ImpresiÃ³n`, `LÃ¡ser`, `acrÃ­lico`, `decoraciÃ³n`, etc.
 *
 * En lugar de tocar la base de datos, reparamos el texto en la capa de lectura
 * (solo presentación). Es idempotente: si el texto ya está bien escrito (sin los
 * marcadores `Ã` / `Â`) se devuelve sin cambios, así que es seguro aplicarlo a
 * todo lo que sale del catálogo.
 *
 * La tabla se construye con CÓDIGOS DE PUNTO en tiempo de ejecución, de modo
 * que el código fuente es 100% ASCII y no depende de su propia codificación ni
 * de pegar caracteres de control invisibles.
 */

// [primer byte, segundo carácter del mojibake, carácter correcto]
// El primer byte UTF-8 es 0xC3 ("Ã") para vocales/eñe y 0xC2 ("Â") para signos.
// El "segundo carácter" es el punto de código que resulta al reinterpretar el
// segundo byte UTF-8 como Windows-1252.
const MOJIBAKE_CODEPOINTS: ReadonlyArray<readonly [number, number, number]> = [
  // minúsculas acentuadas + eñe (rango >= 0xA0: Latin-1 y CP1252 coinciden)
  [0xc3, 0xa1, 0xe1], // á
  [0xc3, 0xa9, 0xe9], // é
  [0xc3, 0xad, 0xed], // í
  [0xc3, 0xb3, 0xf3], // ó
  [0xc3, 0xba, 0xfa], // ú
  [0xc3, 0xbc, 0xfc], // ü
  [0xc3, 0xb1, 0xf1], // ñ
  // MAYÚSCULAS acentuadas + eñe (segundo byte 0x80–0x9F, forma CP1252)
  [0xc3, 0x0081, 0xc1], // Á  (0x81 -> U+0081)
  [0xc3, 0x2030, 0xc9], // É  (0x89 -> U+2030)
  [0xc3, 0x008d, 0xcd], // Í  (0x8D -> U+008D)
  [0xc3, 0x201c, 0xd3], // Ó  (0x93 -> U+201C)
  [0xc3, 0x0161, 0xda], // Ú  (0x9A -> U+0161)
  [0xc3, 0x0153, 0xdc], // Ü  (0x9C -> U+0153)
  [0xc3, 0x2018, 0xd1], // Ñ  (0x91 -> U+2018)
  // signos de puntuación del español
  [0xc2, 0xa1, 0xa1], // ¡
  [0xc2, 0xbf, 0xbf], // ¿
  [0xc2, 0xba, 0xba], // º
  [0xc2, 0xaa, 0xaa], // ª
];

const MOJIBAKE_MAP: ReadonlyMap<string, string> = new Map(
  MOJIBAKE_CODEPOINTS.map(([prefix, second, correct]) => [
    String.fromCodePoint(prefix) + String.fromCodePoint(second),
    String.fromCodePoint(correct),
  ]),
);

// Marcadores de inicio (0xC3 / 0xC2). Si el texto no los tiene, no hay mojibake.
const MOJIBAKE_MARKERS = [
  String.fromCodePoint(0xc3),
  String.fromCodePoint(0xc2),
];

/** Repara mojibake en una cadena. Idempotente si el texto ya está bien. */
export function repairMojibake(input: string): string {
  if (!input || !MOJIBAKE_MARKERS.some((m) => input.includes(m))) {
    return input;
  }
  let out = input;
  for (const [bad, good] of MOJIBAKE_MAP) {
    if (out.includes(bad)) out = out.split(bad).join(good);
  }
  return out;
}

/** Igual que repairMojibake pero tolerante a null/undefined. */
export function repairMojibakeNullable<T extends string | null | undefined>(
  input: T,
): T {
  return typeof input === "string" ? (repairMojibake(input) as T) : input;
}

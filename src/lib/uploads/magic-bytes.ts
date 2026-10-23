/**
 * Filtro de formato ANTES de entregar bytes a `sharp`.
 *
 * `sharp(buffer)` autodetecta el formato y abre el decoder que toque: SVG
 * (librsvg), HEIF/AVIF (libheif), TIFF, GIF... Rechazar el SVG después de leer
 * la metadata llega tarde, porque el decoder vulnerable ya parseó el archivo
 * (CVE-2026-96889 en librsvg: RCE con un SVG manipulado). Aquí solo pasan las
 * firmas de PNG, JPEG y WEBP; cualquier otra cosa se rechaza sin decodificar.
 *
 * Sin directivas: funciones puras, importables desde rutas y desde el QA.
 */

export type RasterFormat = "png" | "jpeg" | "webp";

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function startsWith(bytes: Uint8Array, signature: number[], offset = 0): boolean {
  if (bytes.length < offset + signature.length) return false;
  return signature.every((value, i) => bytes[offset + i] === value);
}

/** Formato raster permitido según la firma del archivo, o null si no es uno. */
export function detectRasterFormat(bytes: Uint8Array): RasterFormat | null {
  if (startsWith(bytes, PNG_SIGNATURE)) return "png";
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "jpeg";
  // RIFF....WEBP
  if (
    startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)
  ) {
    return "webp";
  }
  return null;
}

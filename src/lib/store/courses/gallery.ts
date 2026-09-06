import "server-only";

import { readdirSync } from "node:fs";
import { join } from "node:path";
import type { CourseGallery } from "./types";

/**
 * Galería de fotos de una edición: se DESCUBRE sola leyendo la carpeta.
 *
 * Es el mismo mecanismo que ya usa el catálogo para las fotos de Sparkles,
 * vasos y UV Stickers (publicImageExists en src/lib/store/products.ts):
 * lectura del filesystem público en el servidor, sin caché. Subir el archivo
 * a public/images/tumbler/cursos/edicion-2/ basta para que la foto aparezca
 * en el siguiente render — no hay que tocar código, datos ni base.
 *
 * CONVENCIÓN DE NOMBRES (documentada también en el README de la carpeta):
 *
 *     01.webp, 02.webp, 03.webp, …
 *
 * Dos dígitos y en minúsculas. El número manda el orden, así que se puede
 * reordenar la galería renombrando archivos. Se aceptan además .jpg/.jpeg/.png
 * por si una foto llega sin convertir, pero .webp es lo recomendado (pesa
 * mucho menos y la galería carga varias imágenes).
 *
 * Lo que NO entra: cualquier archivo con otro nombre (README.md, .gitkeep,
 * "foto final v2.webp"). Así un archivo suelto en la carpeta no se cuela a la
 * página pública ni rompe el orden.
 */
const GALLERY_FILE_PATTERN = /^(\d{2})\.(webp|jpg|jpeg|png)$/i;

export interface CourseGalleryImage {
  /** Ruta pública lista para next/image ("/images/…"). */
  src: string;
  /** Texto alternativo, generado por la edición. */
  alt: string;
  /** Número de la foto (1-based) tal como aparece en el nombre del archivo. */
  index: number;
}

/**
 * Fotos reales de la galería, ordenadas por su número de archivo.
 *
 * Devuelve un arreglo vacío si la carpeta no existe o no tiene fotos: la
 * página no falla, sencillamente pinta sus marcadores de posición.
 */
export function listCourseGalleryImages(
  gallery: CourseGallery,
): CourseGalleryImage[] {
  let files: string[];
  try {
    files = readdirSync(join(process.cwd(), "public", gallery.dir));
  } catch {
    return [];
  }

  return files
    .map((file) => {
      const match = GALLERY_FILE_PATTERN.exec(file);
      if (!match) return null;
      const index = Number(match[1]);
      // "00.webp" no es una foto 1-based válida: se descarta en vez de
      // encabezar la galería con un índice que el alt no sabe nombrar.
      if (!Number.isFinite(index) || index < 1) return null;
      return {
        src: `/${gallery.dir}/${file}`,
        // La frase se compone AQUÍ, en el servidor, y no en los datos: un
        // `(i) => string` guardado en la edición no puede cruzar la frontera
        // hacia un componente de cliente (ver el comentario de CourseGallery).
        alt: `Foto ${index} del taller ${gallery.altSubject}`,
        index,
      };
    })
    .filter((image): image is CourseGalleryImage => image !== null)
    .sort((a, b) => a.index - b.index);
}

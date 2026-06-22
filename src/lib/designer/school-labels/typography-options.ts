/**
 * Catálogo de tipografías de Etiquetas Escolares Lab.
 *
 * Códigos 001–054 tomados del PDF de referencia "Cómo Hacer tu Pedido"
 * ("Elige tu tipografía", partes 1 a 6). El PDF agrupa las muestras en 6
 * páginas de 10 códigos (la última con 4). Aquí solo guardamos el código,
 * la página de origen y la ruta del thumbnail real (opcional).
 *
 * Cómo agregar/editar thumbnails reales:
 *   1. Recorta cada muestra del PDF a PNG con fondo transparente.
 *   2. Guárdala como `public/images/school-labels/typography/0NN.png`
 *      (p. ej. 001.png, 002.png … 054.png).
 *   3. No hace falta tocar este archivo: la UI usa `previewImage` y, si la
 *      imagen no existe todavía, muestra un fallback con el nombre escrito.
 */

export type SchoolTypographyOption = {
  code: string;
  label: string;
  /** Página del PDF (1–6) de la que proviene la muestra. */
  page: number;
  /** Thumbnail recortado real (si existe). La UI degrada a fallback. */
  previewImage?: string;
  notes?: string;
};

/** Total de códigos del catálogo (001 … 054). */
export const SCHOOL_TYPOGRAPHY_COUNT = 54;

/** Códigos por página del PDF, para mostrar las 6 partes como en la guía. */
export const SCHOOL_TYPOGRAPHY_PAGES = 6;

function pad3(n: number): string {
  return String(n).padStart(3, "0");
}

/**
 * Genera las 54 opciones de forma determinística. El código es la fuente de
 * verdad; el thumbnail vive en /public y es opcional.
 */
export const SCHOOL_TYPOGRAPHY_OPTIONS: SchoolTypographyOption[] = Array.from(
  { length: SCHOOL_TYPOGRAPHY_COUNT },
  (_, i) => {
    const n = i + 1;
    const code = pad3(n);
    return {
      code,
      label: `Tipografía ${code}`,
      // 001–010 → parte 1, 011–020 → parte 2 … 051–054 → parte 6.
      page: Math.ceil(n / 10),
      previewImage: `/images/school-labels/typography/${code}.png`,
    };
  },
);

const TYPOGRAPHY_BY_CODE = new Map(
  SCHOOL_TYPOGRAPHY_OPTIONS.map((opt) => [opt.code, opt]),
);

/** Lista plana de los códigos válidos (001 … 054). */
export const SCHOOL_TYPOGRAPHY_CODES: string[] =
  SCHOOL_TYPOGRAPHY_OPTIONS.map((opt) => opt.code);

export function isSchoolTypographyCode(value: string): boolean {
  return TYPOGRAPHY_BY_CODE.has(value);
}

export function getSchoolTypography(
  code: string,
): SchoolTypographyOption | null {
  return TYPOGRAPHY_BY_CODE.get(code) ?? null;
}

/** Agrupa las opciones por página del PDF (para render "Parte X de 6"). */
export function groupSchoolTypographyByPage(): Array<{
  page: number;
  options: SchoolTypographyOption[];
}> {
  const groups: Array<{ page: number; options: SchoolTypographyOption[] }> = [];
  for (let page = 1; page <= SCHOOL_TYPOGRAPHY_PAGES; page++) {
    groups.push({
      page,
      options: SCHOOL_TYPOGRAPHY_OPTIONS.filter((opt) => opt.page === page),
    });
  }
  return groups;
}

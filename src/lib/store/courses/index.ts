import { MATRIXLAB_TUMBLER_COURSE } from "./matrixlab-tumbler";
import type { Course, CourseEdition } from "./types";

export * from "./types";
export * from "./matrixlab-tumbler";
export * from "./videos";

/**
 * Registro de cursos publicables. Hoy sólo hay uno; el arreglo existe para que
 * añadir "Cursos MatrixLab Wear" mañana sea una entrada más, y para que el
 * endpoint de registro valide el courseSlug que llega del cliente contra una
 * lista cerrada en vez de confiar en él.
 */
const COURSES: readonly Course[] = [MATRIXLAB_TUMBLER_COURSE];

/**
 * Busca un curso por slug.
 *
 * find sobre un arreglo y NO un índice de objeto: un slug controlado por el
 * cliente que resultara ser "constructor" o "__proto__" heredaría una clave
 * del prototipo y devolvería un valor truthy que no es un curso. Es la misma
 * clase de fallo que ya se corrigió en la página de categorías.
 */
export function getCourseBySlug(slug: string): Course | null {
  return COURSES.find((course) => course.slug === slug) ?? null;
}

/** Edición concreta de un curso, o null si no existe. */
export function getEdition(
  course: Course,
  edition: number,
): CourseEdition | null {
  return course.editions.find((item) => item.edition === edition) ?? null;
}

/** La edición que se publica hoy. */
export function getFeaturedEdition(course: Course): CourseEdition {
  const featured = getEdition(course, course.featuredEdition);
  if (featured) return featured;
  // Respaldo defensivo: si featuredEdition apunta a una edición que ya no
  // existe, se publica la más reciente en vez de romper la página.
  const latest = [...course.editions].sort((a, b) => b.edition - a.edition)[0];
  if (!latest) {
    throw new Error(`El curso ${course.slug} no tiene ediciones publicadas.`);
  }
  return latest;
}

/**
 * Precio en el formato del taller: "$2,500 MXN".
 *
 * No se usa formatPrice (el del carrito) a propósito: ese escribe centavos
 * —"$2,500.00"— porque un total de compra los necesita. Aquí el precio es un
 * titular, y los centavos sólo le quitan fuerza.
 */
const MXN_WHOLE = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});

export function formatCoursePrice(priceMxn: number): string {
  return `${MXN_WHOLE.format(priceMxn)} MXN`;
}

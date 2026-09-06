/**
 * MatrixLab Tumbler — Cursos / Workshops. Tipos del modelo.
 *
 * ARQUITECTURA (por qué está partido así)
 * ---------------------------------------
 * Un curso es una cosa PERMANENTE ("Cursos MatrixLab Tumbler") y cada EDICIÓN
 * es un evento con su fecha, su sede, su precio y sus fotos. Mezclarlos —que
 * es lo natural cuando sólo existe una edición— obliga a duplicar la página
 * entera el día que haya una Edición 3.
 *
 * Por eso:
 *
 *   Course        → identidad estable: slug, nombre, copy de marca, la ruta.
 *   CourseEdition → todo lo que cambia por edición: número, precio, sede,
 *                   fechas en sondeo, galería, videos, FAQ, temario.
 *
 * Publicar la Edición 3 es AÑADIR un objeto a `editions` y mover
 * `featuredEdition`. La página no se toca.
 */

/** Sede de una edición. */
export interface CourseVenue {
  /** Nombre público del lugar. */
  name: string;
  /** Ciudad / zona, para quien no conoce el lugar por su nombre. */
  city: string;
}

/**
 * Una opción de fecha del SONDEO.
 *
 * Mientras la fecha no está cerrada, estas opciones son lo que se pregunta en
 * el formulario. `value` es lo que se guarda en base (estable, en minúsculas
 * y sin acentos) y `label` lo que ve la persona.
 */
export interface CourseDateOption {
  value: string;
  label: string;
  /** Versión corta para chips y espacios estrechos ("Vie 2"). */
  short: string;
}

/** Un punto del "qué vas a vivir": dibujo propio + copy, sin iconos genéricos. */
export interface CourseExperienceItem {
  id: string;
  title: string;
  description: string;
  /** Clave del dibujo en `COURSE_ART` (src/components/icons/CourseDecor.tsx). */
  art: CourseArtKey;
  /** Acento de marca del bloque. */
  accent: CourseAccent;
  /** `true` en el punto que encabeza la composición (ocupa el doble de ancho). */
  featured?: boolean;
}

/** Acentos de marca disponibles (los tokens de `globals.css`). */
export type CourseAccent = "violet" | "cyan" | "coral" | "green";

/** Dibujos propios disponibles para los bloques de experiencia. */
export type CourseArtKey =
  | "tumbler"
  | "snowglobe"
  | "glitter"
  | "pour"
  | "hand"
  | "shine"
  | "community";

/** Una pregunta del FAQ. El copy vive en datos justamente para poder editarlo. */
export interface CourseFaqItem {
  question: string;
  answer: string;
}

/**
 * Un video de la sección "Mira lo que hacemos".
 *
 * NO se incrusta: la CSP del sitio no permite `frame-src` ni scripts de
 * terceros y no se va a debilitar por un embed. Cada entrada se pinta como
 * tarjeta de vista previa que abre el video en una pestaña nueva.
 */
export interface CourseVideo {
  /** URL completa (https). Se valida el host contra una lista blanca. */
  url: string;
  /** Texto visible de la tarjeta. */
  label: string;
}

/**
 * Galería de fotos de una edición.
 *
 * TODO EN ESTE MODELO ES SERIALIZABLE: sólo texto, números, booleanos y
 * arreglos de lo mismo. Ni una función.
 *
 * No es un detalle de estilo. `CourseEdition` viaja del servidor a
 * componentes de cliente (el formulario de registro), y React no puede cruzar
 * una función por esa frontera: la página entera revienta en tiempo de
 * ejecución con "Functions cannot be passed directly to Client Components".
 * El build NO lo detecta —pasa el type-check y compila— así que la única
 * defensa es que el modelo no tenga funciones que meter.
 *
 * Por eso el texto alternativo se declara como SUJETO y la frase la arma
 * `gallery.ts` en el servidor, en vez de guardar aquí un `(i) => string`.
 */
export interface CourseGallery {
  /**
   * Carpeta pública, relativa a `public/`. Las fotos se descubren SOLAS
   * leyendo esta carpeta en el servidor (ver `gallery.ts`): subir el archivo
   * basta para que aparezca, sin tocar código.
   */
  dir: string;
  /**
   * De qué son las fotos. Se usa para componer el texto alternativo:
   * "Foto 3 del taller <altSubject>".
   */
  altSubject: string;
}

/** Una edición concreta del curso: es lo que se publica y lo que se vende. */
export interface CourseEdition {
  /** Número de edición (2, 3, …). Se guarda tal cual en base. */
  edition: number;
  /** Etiqueta corta de la insignia: "WORKSHOP · EDICIÓN 2". */
  badge: string;
  /** ¿Se aceptan registros? Una edición cerrada deja de mostrar formulario. */
  registrationOpen: boolean;
  /** Precio en pesos, sin centavos. */
  priceMxn: number;
  venue: CourseVenue;
  /** Opciones del sondeo de fecha. Vacío = fecha ya cerrada. */
  dateOptions: CourseDateOption[];
  /** Frase del sondeo tal como se lee en pantalla. */
  datePollLabel: string;
  /** Máximo de lugares que se pueden apartar en un registro. */
  maxPartySize: number;
  hero: {
    /** Titular de la landing (H1). */
    title: string;
    /** Segundo renglón del titular: la edición, como etiqueta grande. */
    subtitle: string;
    /** Promesa en una línea. */
    copy: string;
    /** Texto del CTA principal. */
    cta: string;
  };
  /** Copy comercial corto (bloque de la categoría). */
  pitch: string;
  experience: CourseExperienceItem[];
  gallery: CourseGallery;
  videos: CourseVideo[];
  faq: CourseFaqItem[];
}

/**
 * Lo MÍNIMO de una edición que necesita la validación del registro.
 *
 * Existe para que ni el esquema ni el formulario del navegador pidan la
 * `CourseEdition` entera: al componente de cliente le bastan las fechas y el
 * tope de lugares, así que el resto del contenido editorial —temario, FAQ,
 * copy del hero— no tiene por qué viajar al navegador en el payload de
 * hidratación.
 */
export type CourseRegistrationRules = Pick<
  CourseEdition,
  "dateOptions" | "maxPartySize"
>;

/** El curso como producto permanente. */
export interface Course {
  /** Identificador estable. Es lo que se guarda en `course_registrations`. */
  slug: string;
  /** Nombre público. */
  name: string;
  /** Ruta pública de la landing. */
  href: string;
  /** Categoría de la tienda desde la que se entra. */
  categoryHref: string;
  editions: CourseEdition[];
  /** Número de la edición que se publica hoy. */
  featuredEdition: number;
}

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
 *                   fecha (confirmada o en sondeo), galería, videos, FAQ,
 *                   temario.
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
 *
 * La edición publicada hoy NO usa sondeo (tiene `confirmedDate`). El tipo se
 * conserva porque una edición futura puede volver a abrirlo sin recuperar
 * código borrado.
 */
export interface CourseDateOption {
  value: string;
  label: string;
  /** Versión corta para chips y espacios estrechos ("Vie 2"). */
  short: string;
}

/**
 * Fecha y hora CONFIRMADAS de una edición.
 *
 * Cuando esto existe, la edición ya no pregunta nada: el sondeo desaparece del
 * hero, del banner, del FAQ y del formulario, y el registro guarda `value` tal
 * cual en `course_registrations.preferred_date`.
 *
 * TODO ES TEXTO, ni un `Date`. El modelo viaja a componentes de cliente y un
 * `Date` no cruza esa frontera igual que no la cruza una función (ver
 * `CourseGallery` más abajo); además las etiquetas se escriben a mano para que
 * el copy no dependa de la zona horaria del servidor que renderiza.
 */
export interface CourseConfirmedDate {
  /**
   * Valor estable que se guarda en base: minúsculas, sin acentos, kebab-case.
   * Tope de 40 caracteres (el CHECK de `preferred_date` en la migración 0008).
   */
  value: string;
  /** Fecha en ISO 8601 (`YYYY-MM-DD`), para el atributo `dateTime` de `<time>`. */
  iso: string;
  /** Hora de inicio en 24 h (`HH:MM`), para componer el `dateTime` completo. */
  startTime: string;
  /** Fecha tal como se lee: "Viernes 13 de noviembre de 2026". */
  label: string;
  /** Versión corta para chips y espacios estrechos ("Vie 13 nov"). */
  short: string;
  /** Hora tal como se lee: "10:00 a. m.". */
  timeLabel: string;
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
 * Las URLs canónicas de TikTok se muestran en su reproductor oficial dentro
 * de un iframe aislado. Las demás conservan un enlace a la plataforma.
 */
export interface CourseVideo {
  /** URL completa (https). Se valida el host contra una lista blanca. */
  url: string;
  /** Texto visible de la tarjeta. */
  label: string;
}

/**
 * Un video ALOJADO EN EL PROPIO SITIO (no un enlace a una red).
 *
 * Es la otra mitad del problema que `CourseVideo` no resuelve: un archivo
 * servido desde `public/` se puede reproducir en la página sin pedirle a la CSP
 * ni `frame-src` ni un script de terceros, porque no hay terceros.
 *
 * `width`/`height` son las dimensiones INTRÍNSECAS del archivo y existen para
 * reservar el espacio antes de que cargue (sin ellas la página salta al
 * aparecer el video). Son opcionales: si no se saben, no se inventan.
 */
export interface CourseLocalVideo {
  /** Ruta pública del archivo, relativa a la raíz del sitio ("/videos/…"). */
  src: string;
  /** Imagen de portada mientras no se reproduce. Opcional. */
  poster?: string;
  /** Texto visible / accesible del video. */
  label: string;
  /** Ancho intrínseco en px. */
  width?: number;
  /** Alto intrínseco en px. */
  height?: number;
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
  /**
   * Fecha y hora confirmadas. Presente = la edición ya tiene día.
   *
   * EXCLUYENTE con `dateOptions`: una edición con fecha confirmada no pregunta
   * la preferencia, y una en sondeo todavía no tiene qué publicar. El QA de
   * cursos comprueba que no se declaren las dos.
   */
  confirmedDate?: CourseConfirmedDate;
  /** Opciones del sondeo de fecha. Vacío = fecha ya cerrada. */
  dateOptions: CourseDateOption[];
  /** Frase del sondeo tal como se lee en pantalla. Sin sondeo, se omite. */
  datePollLabel?: string;
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
  /** Videos alojados en el sitio. Opcional: una edición puede no tenerlos. */
  localVideos?: CourseLocalVideo[];
  faq: CourseFaqItem[];
}

/**
 * Lo MÍNIMO de una edición que necesita la validación del registro.
 *
 * Existe para que ni el esquema ni el formulario del navegador pidan la
 * `CourseEdition` entera: al componente de cliente le bastan la fecha y el
 * tope de lugares, así que el resto del contenido editorial —temario, FAQ,
 * copy del hero— no tiene por qué viajar al navegador en el payload de
 * hidratación.
 *
 * Lleva `confirmedDate` porque de ella depende QUÉ valida el esquema: con
 * fecha cerrada el único valor aceptable es el de esa fecha, y en sondeo son
 * las opciones más "cualquiera".
 */
export type CourseRegistrationRules = Pick<
  CourseEdition,
  "confirmedDate" | "dateOptions" | "maxPartySize"
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

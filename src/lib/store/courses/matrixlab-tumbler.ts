import type { Course, CourseEdition } from "./types";

/**
 * MatrixLab Tumbler — Cursos. DATOS del curso y de sus ediciones.
 *
 * Este archivo es la ÚNICA fuente de verdad del contenido: la landing, el
 * bloque de la categoría, el formulario y el QA leen de aquí. Nada de copy,
 * precio, sede ni fechas se escribe dentro de un componente.
 *
 * PARA PUBLICAR LA SIGUIENTE EDICIÓN
 *   1. Copiar `EDICION_3` y ajustar sus campos.
 *   2. Añadirla a `editions`.
 *   3. Cambiar `featuredEdition` a su número.
 * No hay que tocar ni la página ni los componentes.
 */

/** Slug del curso. Es lo que se guarda en `course_registrations.course_slug`. */
export const MATRIXLAB_TUMBLER_COURSE_SLUG = "matrixlab-tumbler-workshop";

/** Ruta pública de la landing. */
export const MATRIXLAB_TUMBLER_COURSE_HREF = "/tienda/matrixlab-tumbler/cursos";

/** Ancla del formulario dentro de la landing (CTA "Quiero mi lugar"). */
export const COURSE_REGISTRATION_ANCHOR = "registro";

/**
 * Valor que se guarda cuando a la persona le da igual la fecha. Vive aparte de
 * `dateOptions` porque NO es una fecha del sondeo: es "cualquiera de ellas", y
 * sirve igual en una edición futura con fechas distintas.
 *
 * NO lo usa la edición publicada hoy —su fecha ya está confirmada— pero se
 * conserva porque el sondeo sigue siendo un modo soportado del modelo.
 */
export const COURSE_ANY_DATE_VALUE = "cualquiera";

/**
 * EDICIÓN 3 — Waffleando Metepec.
 *
 * FECHA: CONFIRMADA. Viernes 13 de noviembre de 2026, 10:00 a. m. El sondeo
 * (viernes 2 / sábado 3) quedó resuelto y se retiró del flujo: ni el hero, ni
 * el banner, ni el FAQ, ni el formulario preguntan ya la preferencia de día.
 *
 * DURACIÓN y QUÉ INCLUYE: sin confirmar. No se escriben aquí ni se insinúan en
 * el copy; el FAQ remite a WhatsApp, que es donde se cierran.
 *
 * PAGO: esta página NO cobra. El registro es de INTERÉS / RESERVA y así se
 * dice en la confirmación: nada promete que el lugar quede pagado.
 */
const EDICION_3: CourseEdition = {
  edition: 3,
  badge: "Workshop · Edición 3",
  registrationOpen: true,
  priceMxn: 2500,
  venue: { name: "Waffleando Metepec", city: "Metepec, Estado de México" },
  confirmedDate: {
    // `value` es lo que se guarda en `course_registrations.preferred_date`:
    // kebab-case, sin acentos y dentro del tope de 40 caracteres del CHECK.
    value: "viernes-13-noviembre-2026",
    iso: "2026-11-13",
    startTime: "10:00",
    label: "Viernes 13 de noviembre de 2026",
    short: "Vie 13 nov",
    timeLabel: "10:00 a. m.",
  },
  // Sondeo CERRADO: sin opciones y sin frase de sondeo. Los dos campos siguen
  // existiendo en el modelo para la edición que vuelva a preguntar la fecha.
  dateOptions: [],
  // Tope de lugares por registro. Más de eso se resuelve por WhatsApp, que es
  // donde de todos modos se confirma la disponibilidad real del taller.
  maxPartySize: 6,
  hero: {
    title: "Cursos MatrixLab Tumbler",
    subtitle: "Edición 3",
    copy: "Aprende, crea y llévate la experiencia completa de MatrixLab Tumbler.",
    cta: "Quiero registrarme",
  },
  pitch:
    "Aprende a crear y personalizar tus propios proyectos Tumbler/SnowGlobe en una experiencia práctica, visual y guiada. No necesitas experiencia previa.",
  experience: [
    {
      id: "proyecto",
      title: "Te vas con tu propia pieza",
      description:
        "No es una demostración: creas tu proyecto durante el taller y te lo llevas terminado, hecho por ti.",
      art: "tumbler",
      accent: "violet",
      featured: true,
    },
    {
      id: "practica",
      title: "Práctica guiada",
      description:
        "Trabajas desde el primer minuto, con acompañamiento paso a paso.",
      art: "hand",
      accent: "coral",
    },
    {
      id: "materiales",
      title: "Materiales y herramientas",
      description:
        "Qué se usa, para qué sirve cada cosa y cómo elegir bien la próxima vez.",
      art: "glitter",
      accent: "cyan",
    },
    {
      id: "tecnicas",
      title: "Técnicas Tumbler y SnowGlobe",
      description:
        "Armado, sellado y movimiento: lo que hace que un SnowGlobe se vea vivo.",
      art: "snowglobe",
      accent: "violet",
    },
    {
      id: "acabados",
      title: "Acabados que se notan",
      description:
        "Brillo, textura y detalle final para que tu pieza se vea profesional.",
      art: "shine",
      accent: "green",
    },
    {
      id: "tips",
      title: "Tips del taller",
      description:
        "Los errores que todas cometemos la primera vez, y cómo evitarlos.",
      art: "pour",
      accent: "cyan",
    },
    {
      id: "comunidad",
      title: "Comunidad creativa",
      description:
        "Creas junto a más personas que también empiezan. Se aprende y se disfruta.",
      art: "community",
      accent: "coral",
    },
  ],
  gallery: {
    dir: "images/tumbler/cursos/edicion-3",
    altSubject: "MatrixLab Tumbler en Waffleando Metepec",
  },
  /** Enlaces compartidos por MatrixLab; el reproductor usa su ID canónico. */
  videos: [
    { url: "https://www.tiktok.com/@matrixlab.stickers/video/7677072785704750357", label: "Proyectos MatrixLab Tumbler" },
    { url: "https://www.tiktok.com/@matrixlab.stickers/video/7675186277070720277", label: "SnowGlobe de Halloween" },
    { url: "https://www.tiktok.com/@matrixlab.stickers/video/7671846811132300564", label: "Detalles y movimiento SnowGlobe" },
    { url: "https://www.tiktok.com/@matrixlab.stickers/video/7663922679224765717", label: "SnowGlobe inspirado en Toy Story" },
    { url: "https://www.tiktok.com/@matrixlab.stickers/video/7648396730597199125", label: "Así vivimos el taller en Waffleando" },
  ],
  faq: [
    {
      question: "¿Necesito experiencia?",
      answer:
        "No. El taller está pensado para empezar desde cero: te guiamos paso a paso durante toda la sesión.",
    },
    {
      // COPY EDITABLE A PROPÓSITO. Todavía no está confirmado qué incluye el
      // precio, así que esta respuesta NO afirma que los materiales estén
      // incluidos. Cuando se defina, se cambia esta línea y nada más.
      question: "¿Incluye materiales?",
      answer:
        "Te confirmamos por WhatsApp exactamente qué incluye tu lugar antes de apartarlo.",
    },
    {
      question: "¿Dónde es?",
      answer: "En Waffleando Metepec, Metepec, Estado de México.",
    },
    {
      question: "¿Cuánto cuesta?",
      answer: "$2,500 MXN.",
    },
    {
      // Fecha y hora CONFIRMADAS. No se menciona a qué hora termina: la
      // duración todavía no está cerrada y aquí no se inventa.
      question: "¿Cuándo será?",
      answer:
        "El viernes 13 de noviembre de 2026, a las 10:00 a. m., en Waffleando Metepec.",
    },
    {
      question: "¿Cómo aparto mi lugar?",
      answer:
        "Llena el registro de esta página. Te escribimos por WhatsApp para confirmar tu lugar y la forma de pago.",
    },
  ],
};

/** El curso completo. Añadir ediciones aquí; no duplicar páginas. */
export const MATRIXLAB_TUMBLER_COURSE: Course = {
  slug: MATRIXLAB_TUMBLER_COURSE_SLUG,
  name: "Cursos MatrixLab Tumbler",
  href: MATRIXLAB_TUMBLER_COURSE_HREF,
  categoryHref: "/tienda/categoria/matrixlab-tumbler",
  editions: [EDICION_3],
  featuredEdition: 3,
};

/**
 * El nombre del curso partido en dos para las barras de navegación.
 *
 * Los dos headers (landing y tienda) tienen sitio de sobra para "Cursos" pero
 * no para el nombre entero: se muestra la primera mitad siempre y la segunda
 * sólo cuando la barra ensancha. Vive AQUÍ, junto al nombre, y no dentro de
 * cada header, para que las dos barras no puedan discrepar y para que el QA
 * pueda comprobar que las mitades reconstruyen exactamente `name`. Si mañana
 * el curso se llama de otra forma, esto es lo único que hay que reajustar.
 */
export const MATRIXLAB_TUMBLER_COURSE_NAV = {
  label: "Cursos",
  labelRest: "MatrixLab Tumbler",
} as const;

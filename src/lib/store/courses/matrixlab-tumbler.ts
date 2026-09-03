import type { Course, CourseEdition } from "./types";

/**
 * MatrixLab Tumbler — Cursos. DATOS del curso y de sus ediciones.
 *
 * Este archivo es la ÚNICA fuente de verdad del contenido: la landing, el
 * bloque de la categoría, el formulario y el QA leen de aquí. Nada de copy,
 * precio, sede ni fechas se escribe dentro de un componente.
 *
 * PARA PUBLICAR LA EDICIÓN 3
 *   1. Copiar `EDICION_2` como `EDICION_3` y ajustar sus campos.
 *   2. Añadirla a `editions`.
 *   3. Cambiar `featuredEdition: 3`.
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
 * `dateOptions` porque NO es una fecha del sondeo: es "cualquiera de las dos",
 * y sirve igual en la Edición 3 con fechas distintas.
 */
export const COURSE_ANY_DATE_VALUE = "cualquiera";

/**
 * EDICIÓN 2 — Waffleando Metepec.
 *
 * FECHA: todavía en sondeo. Se pregunta la preferencia (viernes 2 / sábado 3)
 * y con eso se cierra. Ningún copy afirma una fecha definitiva.
 *
 * PAGO: esta página NO cobra. El registro es de INTERÉS / RESERVA y así se
 * dice en la confirmación: nada promete que el lugar quede pagado.
 */
const EDICION_2: CourseEdition = {
  edition: 2,
  badge: "Workshop · Edición 2",
  registrationOpen: true,
  priceMxn: 2500,
  venue: { name: "Waffleando Metepec", city: "Metepec, Estado de México" },
  dateOptions: [
    { value: "viernes-2", label: "Viernes 2", short: "Vie 2" },
    { value: "sabado-3", label: "Sábado 3", short: "Sáb 3" },
  ],
  datePollLabel: "Estamos entre viernes 2 y sábado 3",
  // Tope de lugares por registro. Más de eso se resuelve por WhatsApp, que es
  // donde de todos modos se confirma la disponibilidad real del taller.
  maxPartySize: 6,
  hero: {
    title: "Cursos MatrixLab Tumbler",
    subtitle: "Edición 2",
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
    dir: "images/tumbler/cursos/edicion-2",
    altSubject: "Cursos MatrixLab Tumbler, Edición 2",
  },
  /**
   * Videos de TikTok / redes. VACÍO a propósito: no se inventan enlaces.
   *
   * Para añadir uno, basta con una línea aquí:
   *   { url: "https://www.tiktok.com/@usuario/video/123", label: "Cómo armamos un SnowGlobe" }
   *
   * El host se valida contra `ALLOWED_VIDEO_HOSTS` (videos.ts): un enlace a
   * otro dominio se ignora en silencio en vez de publicarse.
   */
  videos: [],
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
      answer: "En Waffleando Metepec.",
    },
    {
      question: "¿Cuánto cuesta?",
      answer: "$2,500 MXN.",
    },
    {
      question: "¿Cuándo será?",
      answer:
        "Estamos definiendo entre viernes 2 y sábado 3; tu preferencia nos ayuda a elegir.",
    },
    {
      question: "¿Cómo aparto mi lugar?",
      answer:
        "Llena el registro de esta página. Te escribimos por WhatsApp para confirmar fecha, disponibilidad y forma de pago.",
    },
  ],
};

/** El curso completo. Añadir ediciones aquí; no duplicar páginas. */
export const MATRIXLAB_TUMBLER_COURSE: Course = {
  slug: MATRIXLAB_TUMBLER_COURSE_SLUG,
  name: "Cursos MatrixLab Tumbler",
  href: MATRIXLAB_TUMBLER_COURSE_HREF,
  categoryHref: "/tienda/categoria/matrixlab-tumbler",
  editions: [EDICION_2],
  featuredEdition: 2,
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

/**
 * QA de los CURSOS de MatrixLab Tumbler.
 *
 * Cubre las cuatro cosas que, si se rompen, no se notan hasta que alguien
 * intenta registrarse:
 *
 *   1. Los datos del curso son coherentes (la edición publicada existe, su
 *      fecha es un valor estable y lo que se lee coincide con la fecha real, la
 *      ruta declarada es la ruta real del App Router).
 *   2. La validación del servidor acepta lo que debe y RECHAZA lo que debe:
 *      fechas inventadas, más lugares de los permitidos, claves de más. Se
 *      cubren LOS DOS modos de fecha —confirmada y en sondeo— porque el sondeo
 *      sigue soportado para una edición futura aunque hoy no se use.
 *   3. Los enlaces de video se filtran por host y esquema (nada de
 *      `javascript:` ni de dominios ajenos con la marca encima).
 *   4. La galería descubre archivos por convención e IGNORA lo que no lo es.
 *
 * Correr con:
 *   npx tsx --conditions=react-server scripts/qa/courses.test.ts
 *
 * La bandera `--conditions=react-server` hace falta porque este QA importa
 * `courses/gallery.ts`, que declara `import "server-only"`. Ese paquete lanza
 * a propósito cuando se resuelve fuera del entorno de servidor; con esa
 * condición Node resuelve su variante vacía y el módulo se puede probar sin
 * quitarle el guardia (que es justo lo que impide que el lector de disco
 * acabe en el bundle del navegador).
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  COURSE_ANY_DATE_VALUE,
  COURSE_REGISTRATION_ANCHOR,
  formatCoursePrice,
  getCourseBySlug,
  getEdition,
  getFeaturedEdition,
  MATRIXLAB_TUMBLER_COURSE,
  MATRIXLAB_TUMBLER_COURSE_NAV,
  MATRIXLAB_TUMBLER_COURSE_SLUG,
  safeCourseVideos,
} from "../../src/lib/store/courses";
import type { CourseRegistrationRules } from "../../src/lib/store/courses/types";
import { listCourseGalleryImages } from "../../src/lib/store/courses/gallery";
import {
  buildCourseRegistrationSchema,
  COURSE_HONEYPOT_FIELD,
  COURSE_REGISTRATION_INITIAL_STATUS,
  courseDateValues,
  resolveCoursePreferredDate,
} from "../../src/lib/validation/courses";
import { isDynamicRoute, normalizePath } from "../../src/middleware";

const ROOT = join(__dirname, "..", "..");

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? " — " + detail : ""}`);
  if (!ok) failures += 1;
}

const course = MATRIXLAB_TUMBLER_COURSE;
const edition = getFeaturedEdition(course);

// ---------------------------------------------------------------------------
// 1. Datos del curso
// ---------------------------------------------------------------------------
console.log("\n--- 1. Datos del curso y de la edición publicada ---");

check(
  "el slug del curso es un handle válido",
  /^[a-z0-9-]+$/.test(course.slug),
  course.slug,
);
check(
  "getCourseBySlug encuentra el curso",
  getCourseBySlug(MATRIXLAB_TUMBLER_COURSE_SLUG)?.slug === course.slug,
);
/**
 * Regresión fijada: un slug controlado por el cliente que sea una clave del
 * prototipo ("constructor", "__proto__", "toString") NO puede devolver un
 * valor truthy. Es la misma clase de fallo que ya se corrigió en la página de
 * categorías con `Object.hasOwn`.
 */
for (const hostile of ["constructor", "__proto__", "toString", "valueOf"]) {
  check(
    `getCourseBySlug("${hostile}") devuelve null`,
    getCourseBySlug(hostile) === null,
  );
}
check(
  "la edición publicada existe en editions",
  getEdition(course, course.featuredEdition) !== null,
  `featuredEdition=${course.featuredEdition}`,
);
check("hay al menos una edición", course.editions.length > 0);
check(
  "los números de edición no se repiten",
  new Set(course.editions.map((e) => e.edition)).size === course.editions.length,
);

check(
  "la ruta declarada existe como página del App Router",
  existsSync(
    join(ROOT, "src", "app", ...course.href.split("/").filter(Boolean), "page.tsx"),
  ),
  course.href,
);
check(
  "la categoría de entrada existe como ruta de categoría",
  /^\/tienda\/categoria\/[a-z0-9-]+$/.test(course.categoryHref),
  course.categoryHref,
);

// --- Fecha -----------------------------------------------------------------
/**
 * Una edición está en UNO de dos modos y nunca en los dos: fecha CONFIRMADA
 * (`confirmedDate`) o SONDEO (`dateOptions`). Declarar ambos dejaría la página
 * publicando un día y preguntando al mismo tiempo por otro.
 */
check(
  "la edición no tiene fecha confirmada y sondeo a la vez",
  !(edition.confirmedDate && edition.dateOptions.length > 0),
  edition.confirmedDate
    ? `confirmada: ${edition.confirmedDate.label}`
    : `sondeo de ${edition.dateOptions.length} opción(es)`,
);
check(
  "la edición publicada tiene una fecha que mostrar",
  Boolean(edition.confirmedDate) || edition.dateOptions.length > 0,
);

const confirmed = edition.confirmedDate;
if (confirmed) {
  // Nombres en español fijos y NO `Intl`: así el resultado no depende de los
  // datos de locale del Node que corre el QA.
  const WEEKDAYS_ES = [
    "domingo",
    "lunes",
    "martes",
    "miércoles",
    "jueves",
    "viernes",
    "sábado",
  ];
  const MONTHS_ES = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ];

  check(
    "el valor que se guarda es estable (kebab-case, sin acentos)",
    /^[a-z0-9-]+$/.test(confirmed.value),
    confirmed.value,
  );
  /**
   * El CHECK de la migración 0008 limita `preferred_date` a 40 caracteres. Un
   * valor más largo pasaría el type-check y reventaría al INSERTAR, ya con la
   * persona esperando la confirmación.
   */
  check(
    "el valor cabe en la columna preferred_date (1..40)",
    confirmed.value.length >= 1 && confirmed.value.length <= 40,
    `${confirmed.value.length} caracteres`,
  );
  check(
    "el valor no colisiona con 'cualquiera'",
    confirmed.value !== COURSE_ANY_DATE_VALUE,
  );
  check(
    "la fecha ISO está bien formada (YYYY-MM-DD)",
    /^\d{4}-\d{2}-\d{2}$/.test(confirmed.iso),
    confirmed.iso,
  );
  check(
    "la hora de inicio está bien formada (HH:MM, 24 h)",
    /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(confirmed.startTime),
    confirmed.startTime,
  );

  /**
   * LO QUE SE LEE TIENE QUE SER LA FECHA REAL.
   *
   * El `<time dateTime>` sale de `iso` y el texto visible de `label`: si uno
   * dice 13 de noviembre y el otro 12, nada falla en build y la gente llega
   * el día equivocado. Aquí se derivan el día de la semana, el día y el mes
   * DESDE `iso` y se exige que `label` los diga.
   */
  const at = new Date(`${confirmed.iso}T12:00:00Z`);
  const labelLower = confirmed.label.toLowerCase();
  check("la fecha ISO es una fecha válida", !Number.isNaN(at.getTime()));
  check(
    "el día de la semana escrito coincide con la fecha ISO",
    labelLower.includes(WEEKDAYS_ES[at.getUTCDay()]),
    `${confirmed.label} → ${WEEKDAYS_ES[at.getUTCDay()]}`,
  );
  check(
    "el día del mes escrito coincide con la fecha ISO",
    new RegExp(`\\b${at.getUTCDate()}\\b`).test(labelLower),
    String(at.getUTCDate()),
  );
  check(
    "el mes escrito coincide con la fecha ISO",
    labelLower.includes(MONTHS_ES[at.getUTCMonth()]),
    MONTHS_ES[at.getUTCMonth()],
  );
  check(
    "el año escrito coincide con la fecha ISO",
    labelLower.includes(String(at.getUTCFullYear())),
    String(at.getUTCFullYear()),
  );

  // La hora que se lee contra la hora que se declara (12 h vs 24 h).
  const [hh24, mm] = confirmed.startTime.split(":").map(Number);
  const hour12 = hh24 % 12 === 0 ? 12 : hh24 % 12;
  const isMorning = hh24 < 12;
  check(
    "la hora escrita coincide con la hora de inicio",
    confirmed.timeLabel.startsWith(`${hour12}:${String(mm).padStart(2, "0")}`),
    `${confirmed.startTime} → ${confirmed.timeLabel}`,
  );
  check(
    "la hora escrita lleva el meridiano correcto",
    /a\.?\s?m\.?/i.test(confirmed.timeLabel) === isMorning,
    confirmed.timeLabel,
  );
  check(
    "la versión corta de la fecha no está vacía",
    confirmed.short.trim().length > 0 && confirmed.short.length <= 20,
    confirmed.short,
  );

  // Sondeo RETIRADO del flujo activo: ni opciones ni frase de sondeo.
  check("no quedan opciones de sondeo", edition.dateOptions.length === 0);
  check(
    "no queda frase de sondeo",
    edition.datePollLabel === undefined,
    String(edition.datePollLabel),
  );
} else {
  check(
    "los valores de fecha del sondeo son estables (kebab-case, sin acentos)",
    edition.dateOptions.every((option) => /^[a-z0-9-]+$/.test(option.value)),
    edition.dateOptions.map((o) => o.value).join(", "),
  );
  check(
    "ninguna opción de fecha colisiona con el valor 'cualquiera'",
    edition.dateOptions.every(
      (option) => option.value !== COURSE_ANY_DATE_VALUE,
    ),
  );
  check(
    "los valores de fecha no se repiten",
    new Set(edition.dateOptions.map((o) => o.value)).size ===
      edition.dateOptions.length,
  );
  check(
    "el sondeo tiene una frase que mostrar",
    Boolean(edition.datePollLabel?.trim()),
  );
}

check("el precio es un entero positivo", Number.isInteger(edition.priceMxn) && edition.priceMxn > 0);
check(
  "el precio se escribe sin centavos",
  !formatCoursePrice(edition.priceMxn).includes("."),
  formatCoursePrice(edition.priceMxn),
);
check(
  "el tope de lugares es razonable (1..20, el CHECK de la migración)",
  edition.maxPartySize >= 1 && edition.maxPartySize <= 20,
  String(edition.maxPartySize),
);
check(
  "los ids de la composición de experiencia no se repiten",
  new Set(edition.experience.map((i) => i.id)).size ===
    edition.experience.length,
);
check(
  "hay exactamente un bloque protagonista en la composición",
  edition.experience.filter((i) => i.featured).length === 1,
);

/**
 * REGRESIÓN FIJADA: el contenido del curso tiene que ser SERIALIZABLE.
 *
 * `CourseEdition` viaja del servidor a componentes de cliente. React no puede
 * cruzar una función por esa frontera: la página entera revienta en tiempo de
 * ejecución con "Functions cannot be passed directly to Client Components".
 * Ya pasó una vez —la galería guardaba `alt: (i) => string`— y ni el
 * type-check ni el build lo vieron: compiló perfecto y la ruta devolvía 500.
 *
 * Este recorrido es la única red que atrapa esa clase de fallo antes de
 * producción.
 */
function findNonSerializable(value: unknown, path: string): string | null {
  if (value === null) return null;
  const type = typeof value;
  if (type === "function" || type === "symbol" || type === "bigint") {
    return `${path} es ${type}`;
  }
  if (type !== "object") return null;
  if (value instanceof Date || value instanceof RegExp || value instanceof Map) {
    return `${path} es ${value.constructor.name}`;
  }
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) {
      const found = findNonSerializable(value[i], `${path}[${i}]`);
      if (found) return found;
    }
    return null;
  }
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const found = findNonSerializable(child, `${path}.${key}`);
    if (found) return found;
  }
  return null;
}

const nonSerializable = findNonSerializable(course, "course");
check(
  "todo el contenido del curso es serializable (nada de funciones)",
  nonSerializable === null,
  nonSerializable ?? "sólo texto, números, booleanos y arreglos",
);

/**
 * El estado inicial NO puede ser otro que "interested": esta página no cobra y
 * ninguna fila puede nacer diciendo que el lugar está confirmado o pagado.
 */
check(
  "el estado inicial del registro es 'interested'",
  COURSE_REGISTRATION_INITIAL_STATUS === "interested",
);

/**
 * Copy que NO se puede afirmar todavía: nadie ha confirmado que el precio
 * incluya materiales. Si alguien lo escribe sin decidirlo, este QA lo frena.
 * Cuando SÍ se decida, se actualiza esta comprobación junto con el copy.
 */
const materialsFaq = edition.faq.find((item) =>
  item.question.toLowerCase().includes("materiales"),
);
check("existe la pregunta de materiales en el FAQ", Boolean(materialsFaq));

/**
 * Se buscan AFIRMACIONES, no la palabra "incluye" suelta: la respuesta actual
 * dice "te confirmamos qué incluye tu lugar", que es justo lo correcto —
 * remite a la confirmación sin prometer nada. Un `!/incluye/` habría marcado
 * ese copy como error y habría empujado a escribir algo peor.
 */
const AFIRMACIONES_DE_MATERIALES = [
  /\bs[ií]\b\s*[,.]/i, // "Sí, ..."
  /materiales?\s+inclu/i, // "materiales incluidos"
  /inclu\w*\s+(todos?\s+)?(los\s+)?materiales/i, // "incluye los materiales"
  /todo\s+inclu/i, // "todo incluido"
];
check(
  "la respuesta de materiales no afirma que estén incluidos",
  AFIRMACIONES_DE_MATERIALES.every(
    (pattern) => !pattern.test(materialsFaq?.answer ?? ""),
  ),
  materialsFaq?.answer ?? "",
);

/**
 * El FAQ es el sitio donde más fácil se queda un copy viejo: nadie lo lee
 * entero al cambiar una fecha. Estas comprobaciones lo atan a los DATOS.
 */
const whenFaq = edition.faq.find((item) =>
  item.question.toLowerCase().includes("cuándo"),
);
check("existe la pregunta de cuándo en el FAQ", Boolean(whenFaq));
if (confirmed) {
  check(
    "la respuesta de cuándo dice la fecha confirmada",
    (whenFaq?.answer.toLowerCase() ?? "").includes(
      confirmed.label.toLowerCase(),
    ),
    whenFaq?.answer ?? "",
  );
  /**
   * Y NO sigue hablando de un sondeo que ya se cerró. Un "estamos definiendo"
   * olvidado aquí contradice al hero en la misma página.
   */
  const RASTROS_DE_SONDEO = [
    /estamos\s+(definiendo|eligiendo|entre)/i,
    /tu\s+preferencia/i,
    /sondeo/i,
  ];
  check(
    "la respuesta de cuándo no habla ya del sondeo",
    RASTROS_DE_SONDEO.every(
      (pattern) => !pattern.test(whenFaq?.answer ?? ""),
    ),
    whenFaq?.answer ?? "",
  );
}

const whereFaq = edition.faq.find((item) =>
  item.question.toLowerCase().includes("dónde"),
);
check("existe la pregunta de dónde en el FAQ", Boolean(whereFaq));
check(
  "la respuesta de dónde nombra la sede de la edición",
  (whereFaq?.answer ?? "").includes(edition.venue.name),
  `${whereFaq?.answer ?? ""} (sede: ${edition.venue.name})`,
);

/**
 * La DURACIÓN no está confirmada: no se escribe en ningún copy de la edición.
 * Si alguien la inventa ("dura 4 horas", "de 10 a 2"), esto lo frena.
 */
const COPY_DE_LA_EDICION = [
  edition.pitch,
  edition.hero.copy,
  ...edition.faq.map((item) => `${item.question} ${item.answer}`),
  ...edition.experience.map((item) => `${item.title} ${item.description}`),
].join("\n");
const AFIRMACIONES_DE_DURACION = [
  /\bdura\w*\s+\d/i, // "dura 4 horas"
  /\b\d+\s*(h|hrs?|horas?)\b/i, // "4 horas", "4h"
  /\bde\s+\d{1,2}(:\d{2})?\s*(a|hasta)\s+\d{1,2}(:\d{2})?\b/i, // "de 10 a 2"
];
check(
  "ningún copy de la edición inventa una duración",
  AFIRMACIONES_DE_DURACION.every((pattern) => !pattern.test(COPY_DE_LA_EDICION)),
);

// ---------------------------------------------------------------------------
// 2. Validación del registro (la del SERVIDOR)
// ---------------------------------------------------------------------------
console.log("\n--- 2. Validación del registro ---");

const schema = buildCourseRegistrationSchema(edition);
/**
 * Payload mínimo correcto. La fecha se añade SÓLO si la edición la pregunta:
 * con fecha confirmada el formulario no manda `preferredDate` y la pone el
 * servidor, así que el caso bueno es justamente el que no la lleva.
 */
const validPayload = {
  courseSlug: course.slug,
  edition: edition.edition,
  name: "Ana López",
  phone: "5512345678",
  partySize: 2,
  // `?.` para que una edición sin fecha ni sondeo haga FALLAR el check de
  // arriba en vez de reventar el script entero con un TypeError.
  ...(confirmed ? {} : { preferredDate: edition.dateOptions[0]?.value ?? "" }),
};

check("un registro correcto pasa", schema.safeParse(validPayload).success);
check(
  "el correo es opcional",
  schema.safeParse({ ...validPayload, email: "" }).success &&
    schema.safeParse({ ...validPayload, email: "ana@ejemplo.com" }).success,
);

if (confirmed) {
  check(
    "con fecha confirmada, courseDateValues sólo admite esa fecha",
    courseDateValues(edition).length === 1 &&
      courseDateValues(edition)[0] === confirmed.value,
    courseDateValues(edition).join(", "),
  );
  check(
    "se acepta el registro SIN fecha (la pone el servidor)",
    schema.safeParse(validPayload).success,
  );
  check(
    "se acepta la fecha confirmada si llega en el payload",
    schema.safeParse({ ...validPayload, preferredDate: confirmed.value })
      .success,
  );
  /**
   * Una pestaña vieja con el bundle del sondeo mandaría "sabado-3" o
   * "cualquiera". Antes que guardar un día que ya no existe, se rechaza.
   */
  check(
    "se rechaza 'cualquiera' (ya no significa nada)",
    !schema.safeParse({
      ...validPayload,
      preferredDate: COURSE_ANY_DATE_VALUE,
    }).success,
  );
  check(
    "se rechaza una fecha del sondeo viejo",
    !schema.safeParse({ ...validPayload, preferredDate: "sabado-3" }).success,
  );

  /**
   * Y DECIDE EL SERVIDOR: lo que se escribe en `preferred_date` sale del
   * catálogo, no del payload. Da igual qué llegue (o que no llegue nada).
   */
  check(
    "el servidor guarda la fecha confirmada cuando no llega ninguna",
    resolveCoursePreferredDate(edition, undefined) === confirmed.value,
  );
  check(
    "el servidor ignora la fecha del payload y guarda la confirmada",
    resolveCoursePreferredDate(edition, "sabado-3") === confirmed.value,
  );
} else {
  check(
    "en sondeo, courseDateValues incluye las opciones y 'cualquiera'",
    courseDateValues(edition).length === edition.dateOptions.length + 1,
  );
  check(
    "'cualquiera' es una fecha aceptada",
    schema.safeParse({
      ...validPayload,
      preferredDate: COURSE_ANY_DATE_VALUE,
    }).success,
  );
  check(
    "en sondeo, la fecha es obligatoria",
    !schema.safeParse({
      ...validPayload,
      preferredDate: undefined,
    }).success,
  );
}

/**
 * EL SONDEO SIGUE SOPORTADO.
 *
 * Hoy ninguna edición lo usa, así que los `check` de arriba no lo ejercitan.
 * Esta edición de mentira existe para que el modo no se rompa en silencio y
 * reaparezca averiado el día que una Edición 3 vuelva a preguntar la fecha.
 */
const SONDEO_DE_PRUEBA: CourseRegistrationRules = {
  dateOptions: [
    { value: "viernes-20", label: "Viernes 20", short: "Vie 20" },
    { value: "sabado-21", label: "Sábado 21", short: "Sáb 21" },
  ],
  maxPartySize: 4,
};
const pollSchema = buildCourseRegistrationSchema(SONDEO_DE_PRUEBA);
const pollPayload = {
  courseSlug: course.slug,
  edition: 99,
  name: "Ana López",
  phone: "5512345678",
  partySize: 2,
  preferredDate: "viernes-20",
};
check(
  "una edición en sondeo acepta una de sus opciones",
  pollSchema.safeParse(pollPayload).success,
);
check(
  "una edición en sondeo acepta 'cualquiera'",
  pollSchema.safeParse({
    ...pollPayload,
    preferredDate: COURSE_ANY_DATE_VALUE,
  }).success,
);
check(
  "una edición en sondeo exige la fecha",
  !pollSchema.safeParse({ ...pollPayload, preferredDate: undefined }).success,
);
check(
  "una edición en sondeo rechaza una fecha ajena",
  !pollSchema.safeParse({ ...pollPayload, preferredDate: "lunes-9" }).success,
);
check(
  "una edición en sondeo guarda la fecha elegida",
  resolveCoursePreferredDate(SONDEO_DE_PRUEBA, "sabado-21") === "sabado-21",
);
check(
  "una edición en sondeo sin fecha no resuelve ningún valor",
  resolveCoursePreferredDate(SONDEO_DE_PRUEBA, undefined) === null,
);
check(
  "una edición en sondeo respeta su propio tope de lugares",
  !pollSchema.safeParse({
    ...pollPayload,
    partySize: SONDEO_DE_PRUEBA.maxPartySize + 1,
  }).success,
);

// Teléfonos que la gente escribe de verdad: todos deben normalizar a 10 dígitos.
for (const raw of [
  "55 1234 5678",
  "+52 55 1234 5678",
  "5215512345678",
  "04455 1234 5678",
  "(55) 1234-5678",
]) {
  const parsed = schema.safeParse({ ...validPayload, phone: raw });
  check(
    `el teléfono "${raw}" se acepta y se normaliza`,
    parsed.success && parsed.data.phone === "5512345678",
    parsed.success ? parsed.data.phone : "rechazado",
  );
}

for (const [label, payload] of [
  [
    "una fecha que la edición no acepta",
    { ...validPayload, preferredDate: "lunes-9" },
  ],
  [
    "más lugares que el tope de la edición",
    { ...validPayload, partySize: edition.maxPartySize + 1 },
  ],
  ["cero lugares", { ...validPayload, partySize: 0 }],
  ["un nombre vacío", { ...validPayload, name: "  " }],
  ["un teléfono corto", { ...validPayload, phone: "551234" }],
  ["un correo inválido", { ...validPayload, email: "no-es-correo" }],
  [
    "un status colado por el cliente",
    { ...validPayload, status: "confirmed" },
  ],
  ["un id colado por el cliente", { ...validPayload, id: "x" }],
  [
    "el campo trampa dentro del payload",
    { ...validPayload, [COURSE_HONEYPOT_FIELD]: "http://spam" },
  ],
] as const) {
  check(
    `se rechaza ${label}`,
    !schema.safeParse(payload as unknown).success,
  );
}

/**
 * El nombre se limpia pero NO se vacía: quitar `<...>` entero convertía
 * "Ana <3" en "Ana" y podía dejar campos obligatorios en blanco DESPUÉS de
 * validar. Aquí se comprueba que el texto sobrevive y las etiquetas no.
 */
const xss = schema.safeParse({
  ...validPayload,
  name: "<script>alert(1)</script>Ana",
});
check(
  "el nombre se limpia sin perder el texto legítimo",
  xss.success && !xss.data.name.includes("<") && xss.data.name.includes("Ana"),
  xss.success ? xss.data.name : "rechazado",
);

// ---------------------------------------------------------------------------
// 3. Videos: lista blanca de hosts
// ---------------------------------------------------------------------------
console.log("\n--- 3. Enlaces de video ---");

const videoCases: Array<[string, boolean]> = [
  ["https://www.tiktok.com/@matrixlab/video/123", true],
  ["https://vm.tiktok.com/ABC123/", true],
  ["https://www.instagram.com/reel/ABC/", true],
  ["https://youtu.be/abc123", true],
  ["http://www.tiktok.com/@matrixlab/video/123", false], // sin TLS
  ["javascript:alert(1)", false],
  ["https://tiktok.com.evil.example/video/1", false], // host parecido
  ["https://ejemplo.com/video", false],
  ["no-es-una-url", false],
];
for (const [url, shouldPass] of videoCases) {
  const result = safeCourseVideos([{ url, label: "prueba" }]);
  check(
    `${shouldPass ? "se publica" : "se descarta"} ${url}`,
    (result.length === 1) === shouldPass,
  );
}
check(
  "los videos declarados hoy en la edición son todos publicables",
  safeCourseVideos(edition.videos).length === edition.videos.length,
);

// ---------------------------------------------------------------------------
// 4. Galería por convención de archivos
// ---------------------------------------------------------------------------
console.log("\n--- 4. Galería ---");

const galleryDir = join(ROOT, "public", edition.gallery.dir);
check("la carpeta de fotos existe", existsSync(galleryDir), edition.gallery.dir);
check(
  "la carpeta está documentada con su README",
  existsSync(join(galleryDir, "README.md")),
);

const images = listCourseGalleryImages(edition.gallery);
check(
  "el README no se cuela en la galería",
  images.every((image) => !image.src.toLowerCase().endsWith(".md")),
);
check(
  "toda foto detectada respeta la convención NN.ext",
  images.every((image) =>
    /\/\d{2}\.(webp|jpg|jpeg|png)$/i.test(image.src),
  ),
);
check(
  "las fotos salen ordenadas por su número",
  images.every((image, i) => i === 0 || images[i - 1].index <= image.index),
);
check(
  "cada foto lleva texto alternativo",
  images.every((image) => image.alt.trim().length > 0),
);
console.log(
  `  (fotos detectadas ahora mismo: ${images.length}${
    images.length === 0 ? " — la galería muestra marcadores de posición" : ""
  })`,
);

// Una carpeta inexistente no puede tirar la página.
check(
  "una carpeta inexistente devuelve una galería vacía, no un error",
  listCourseGalleryImages({
    dir: "images/tumbler/cursos/edicion-inexistente",
    altSubject: "edición inexistente",
  }).length === 0,
);

// ---------------------------------------------------------------------------
// 5. Seguridad de la ruta: CSP estricta
// ---------------------------------------------------------------------------
console.log("\n--- 5. CSP de la landing del curso ---");

check(
  "la landing del curso recibe la CSP estricta con nonce",
  isDynamicRoute(normalizePath(course.href)),
  course.href,
);
/**
 * El padre `/tienda/matrixlab-tumbler` NO tiene página: se sirve con la 404
 * PRERENDERIZADA, cuyos scripts en línea no llevan nonce. Si cayera en la
 * política estricta, `strict-dynamic` los bloquearía todos.
 */
check(
  "el padre sin página cae en la CSP compatible",
  !isDynamicRoute(normalizePath("/tienda/matrixlab-tumbler")),
);
check(
  "una subruta inexistente del curso cae en la CSP compatible",
  !isDynamicRoute(normalizePath("/tienda/matrixlab-tumbler/cursos/edicion-9")),
);

const pageSource = readFileSync(
  join(ROOT, "src", "app", ...course.href.split("/").filter(Boolean), "page.tsx"),
  "utf8",
);
check(
  "la página declara force-dynamic (sin él, sus scripts saldrían sin nonce)",
  /export const dynamic\s*=\s*"force-dynamic"/.test(pageSource),
);
check(
  "el ancla del formulario existe en la página",
  pageSource.includes("COURSE_REGISTRATION_ANCHOR"),
  `#${COURSE_REGISTRATION_ANCHOR}`,
);

// ---------------------------------------------------------------------------
// 6. Migración
// ---------------------------------------------------------------------------
console.log("\n--- 6. Migración 0008 ---");

const migrationPath = join(
  ROOT,
  "supabase",
  "migrations",
  "0008_course_registrations.sql",
);
check("la migración existe", existsSync(migrationPath));
const migration = existsSync(migrationPath)
  ? readFileSync(migrationPath, "utf8")
  : "";
/**
 * Se revisa el SQL EJECUTABLE, no los comentarios: la cabecera de la migración
 * dice literalmente "Sin DROP, sin DELETE, sin TRUNCATE" para documentar la
 * garantía, y buscar esas palabras en el archivo entero marcaba como
 * destructiva a una migración que precisamente promete no serlo.
 */
const migrationSql = migration
  .split("\n")
  .filter((line) => !line.trimStart().startsWith("--"))
  .join("\n");
check(
  "la migración es aditiva (sin drop/delete/truncate en el SQL ejecutable)",
  !/\b(drop\s+table|drop\s+column|delete\s+from|truncate)\b/i.test(migrationSql),
);
check(
  "la tabla queda con RLS habilitada",
  /enable row level security/i.test(migration),
);
check(
  "no hay policies para anon/authenticated (deny-by-default)",
  !/create policy/i.test(migration),
);
check(
  "se revocan privilegios a anon/authenticated",
  /revoke all on public\.course_registrations from anon, authenticated/i.test(
    migration,
  ),
);
check(
  "el estado por defecto en base es 'interested'",
  /default 'interested'/i.test(migration),
);

// ---------------------------------------------------------------------------
console.log("\n--- 7. Accesos en los headers ---");

/**
 * Los dos headers muestran "Cursos" siempre y "MatrixLab Tumbler" sólo cuando
 * la barra ensancha. Si alguien renombra el curso y no reajusta el par, la
 * barra ancha diría un nombre y el menú móvil otro. Esto lo impide.
 */
check(
  "las dos mitades del rótulo reconstruyen el nombre del curso",
  `${MATRIXLAB_TUMBLER_COURSE_NAV.label} ${MATRIXLAB_TUMBLER_COURSE_NAV.labelRest}` ===
    MATRIXLAB_TUMBLER_COURSE.name,
  MATRIXLAB_TUMBLER_COURSE.name,
);
check(
  "la primera mitad se ve sola sin quedar ambigua",
  MATRIXLAB_TUMBLER_COURSE_NAV.label.trim().length > 0 &&
    !MATRIXLAB_TUMBLER_COURSE_NAV.label.endsWith(" "),
);

/**
 * El acceso tiene que estar en los DOS headers: el de la landing y el de la
 * tienda, en escritorio y en móvil. Es exactamente lo que se pidió al publicar
 * el curso, y es invisible en type-check y en build: si alguien borra el
 * enlace, todo sigue compilando y la página simplemente deja de tener entrada.
 */
const HEADERS: readonly { file: string; label: string }[] = [
  { file: "src/components/landing/LandingNav.tsx", label: "header de la Home" },
  { file: "src/components/store/StoreLayout.tsx", label: "header de la tienda" },
  {
    file: "src/components/store/StoreMobileMenu.tsx",
    label: "menú móvil de la tienda",
  },
];
for (const header of HEADERS) {
  const source = readFileSync(join(process.cwd(), header.file), "utf8");
  check(
    `${header.label} enlaza al curso`,
    // Enlaza por la constante, no por una URL escrita a mano: así mover la
    // ruta sigue siendo cambiar una sola línea del módulo de datos.
    source.includes("MATRIXLAB_TUMBLER_COURSE"),
    header.file,
  );
  check(
    `${header.label} no escribe la ruta del curso a mano`,
    !source.includes(`"${MATRIXLAB_TUMBLER_COURSE.href}"`),
    header.file,
  );
}

// ---------------------------------------------------------------------------
console.log("\n--- 8. La fecha se lee de los datos, no del JSX ---");

/**
 * Las tres vistas que anuncian la fecha tienen que SACARLA de la edición.
 *
 * Es invisible en type-check y en build: una fecha escrita a mano en el JSX
 * compila igual de bien y se queda vieja en silencio en cuanto cambie el día —
 * y entonces el hero, el banner y el formulario pueden decir tres cosas
 * distintas en la misma visita.
 */
const VISTAS_CON_FECHA: readonly string[] = [
  "src/components/courses/CourseHero.tsx",
  "src/components/courses/TumblerCoursesBanner.tsx",
  "src/components/courses/CourseRegistrationForm.tsx",
];
for (const file of VISTAS_CON_FECHA) {
  const source = readFileSync(join(ROOT, file), "utf8");
  check(`${file} lee la fecha de la edición`, source.includes("confirmedDate"));
  if (confirmed) {
    check(
      `${file} no escribe la fecha a mano`,
      !source.includes(confirmed.label) && !source.includes(confirmed.iso),
    );
  }
}

// ---------------------------------------------------------------------------
console.log(
  `\n${failures === 0 ? "TODO OK" : `${failures} comprobación(es) fallida(s)`}`,
);
process.exit(failures === 0 ? 0 : 1);

/**
 * QA de los CURSOS de MatrixLab Tumbler.
 *
 * Cubre las cuatro cosas que, si se rompen, no se notan hasta que alguien
 * intenta registrarse:
 *
 *   1. Los datos del curso son coherentes (la edición publicada existe, las
 *      fechas del sondeo son valores estables, la ruta declarada es la ruta
 *      real del App Router).
 *   2. La validación del servidor acepta lo que debe y RECHAZA lo que debe:
 *      fechas inventadas, más lugares de los permitidos, claves de más.
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
  MATRIXLAB_TUMBLER_COURSE_SLUG,
  safeCourseVideos,
} from "../../src/lib/store/courses";
import { listCourseGalleryImages } from "../../src/lib/store/courses/gallery";
import {
  buildCourseRegistrationSchema,
  COURSE_HONEYPOT_FIELD,
  COURSE_REGISTRATION_INITIAL_STATUS,
  courseDateValues,
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

check(
  "los valores de fecha del sondeo son estables (kebab-case, sin acentos)",
  edition.dateOptions.every((option) => /^[a-z0-9-]+$/.test(option.value)),
  edition.dateOptions.map((o) => o.value).join(", "),
);
check(
  "ninguna opción de fecha colisiona con el valor 'cualquiera'",
  edition.dateOptions.every((option) => option.value !== COURSE_ANY_DATE_VALUE),
);
check(
  "los valores de fecha no se repiten",
  new Set(edition.dateOptions.map((o) => o.value)).size ===
    edition.dateOptions.length,
);
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

// ---------------------------------------------------------------------------
// 2. Validación del registro (la del SERVIDOR)
// ---------------------------------------------------------------------------
console.log("\n--- 2. Validación del registro ---");

const schema = buildCourseRegistrationSchema(edition);
const validPayload = {
  courseSlug: course.slug,
  edition: edition.edition,
  name: "Ana López",
  phone: "5512345678",
  preferredDate: edition.dateOptions[0].value,
  partySize: 2,
};

check("un registro correcto pasa", schema.safeParse(validPayload).success);
check(
  "el correo es opcional",
  schema.safeParse({ ...validPayload, email: "" }).success &&
    schema.safeParse({ ...validPayload, email: "ana@ejemplo.com" }).success,
);
check(
  "'cualquiera' es una fecha aceptada",
  schema.safeParse({
    ...validPayload,
    preferredDate: COURSE_ANY_DATE_VALUE,
  }).success,
);
check(
  "courseDateValues incluye el sondeo y 'cualquiera'",
  courseDateValues(edition).length === edition.dateOptions.length + 1,
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
  ["una fecha fuera del sondeo", { ...validPayload, preferredDate: "lunes-9" }],
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
console.log(
  `\n${failures === 0 ? "TODO OK" : `${failures} comprobación(es) fallida(s)`}`,
);
process.exit(failures === 0 ? 0 : 1);

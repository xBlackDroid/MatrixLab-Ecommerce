import { type NextRequest } from "next/server";
import { jsonError, jsonOk, readJsonBody, tooManyRequests } from "@/lib/api";
import { logAudit, requireServiceClient } from "@/lib/db/admin";
import { isSupabaseConfigured } from "@/lib/security/env";
import {
  checkRateLimit,
  getClientIp,
  RATE_LIMITS,
} from "@/lib/security/rate-limit";
import { getCourseBySlug, getEdition } from "@/lib/store/courses";
import {
  buildCourseRegistrationSchema,
  COURSE_HONEYPOT_FIELD,
  COURSE_REGISTRATION_INITIAL_STATUS,
  CourseRegistrationTargetSchema,
} from "@/lib/validation/courses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Registro de INTERÉS a una edición de un curso.
 *
 * Es un endpoint público (sin sesión, sin cookie, sin carrito) que escribe
 * datos personales de contacto. Las decisiones que lo sostienen:
 *
 * PRIVACIDAD
 *   - Nunca se imprime PII: ni nombre, ni teléfono, ni correo, ni el
 *     comentario libre. Ni en logs de error ni en la auditoría. Lo único que
 *     se registra es a qué curso/edición fue el registro y su id.
 *   - La respuesta NO devuelve los datos guardados: sólo `{ ok: true }`. Así
 *     el navegador no tiene una copia que pueda acabar en un cache, en una
 *     extensión o en una captura de pantalla.
 *   - Nada viaja por query params (van en el log del servidor, en el Referer
 *     y en el historial): el payload es POST + JSON.
 *
 * VALIDACIÓN
 *   El esquema se CONSTRUYE con los datos de la edición que se resolvió en el
 *   servidor, no con lo que dice el cliente: las fechas aceptadas y el tope de
 *   lugares salen del catálogo de cursos. Un payload con una fecha inventada o
 *   con 500 lugares se rechaza aquí aunque el formulario diga otra cosa.
 *
 * ANTI-SPAM
 *   1. Rate limit por IP (`RATE_LIMITS.courseRegistration`).
 *   2. Campo trampa (honeypot). Ver abajo por qué responde éxito.
 *   3. `.strict()` en el esquema: un payload con claves de más se rechaza.
 *
 * CSRF
 *   No aplica: el endpoint no tiene autoridad ambiental que robar (no lee
 *   cookie de sesión ni actúa en nombre de nadie). Un POST cross-site sólo
 *   consigue lo mismo que un POST directo, y contra eso está el rate limit.
 *   Es el mismo criterio que el resto de endpoints públicos de la tienda; el
 *   token CSRF vive donde sí hay sesión, que es el panel admin.
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = checkRateLimit(
    `course-registration:${ip}`,
    RATE_LIMITS.courseRegistration,
  );
  if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds);

  const body = await readJsonBody(request);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return jsonError("Datos inválidos.", 400);
  }

  const payload: Record<string, unknown> = { ...(body as Record<string, unknown>) };

  /**
   * Campo trampa. Va oculto en el formulario y siempre vacío para una
   * persona; un bot que rellena todos los inputs lo llena.
   *
   * Se quita del payload ANTES de validar —el esquema es `.strict()` y lo
   * rechazaría con un error que le enseñaría al bot qué campo sobra— y la
   * respuesta es un ÉXITO NORMAL sin guardar nada. Un 400 le diría al bot que
   * lo detectamos y bastaría con reintentar sin ese campo.
   */
  const honeypot = payload[COURSE_HONEYPOT_FIELD];
  delete payload[COURSE_HONEYPOT_FIELD];
  if (typeof honeypot === "string" && honeypot.trim() !== "") {
    // Se deja rastro SIN PII para que un falso positivo (un gestor de
    // contraseñas rellenando el campo) sea diagnosticable y no un registro
    // que se perdió en silencio para siempre.
    console.warn("[cursos] registro descartado por honeypot");
    return jsonOk({});
  }

  // Primera pasada: a qué curso/edición apunta. Hace falta para poder
  // construir el esquema real, que depende de los datos de esa edición.
  const target = CourseRegistrationTargetSchema.safeParse(payload);
  if (!target.success) return jsonError("Datos inválidos.", 400);

  const course = getCourseBySlug(target.data.courseSlug);
  const edition = course ? getEdition(course, target.data.edition) : null;
  if (!course || !edition) {
    return jsonError("Este curso no está disponible.", 404, "COURSE_NOT_FOUND");
  }
  if (!edition.registrationOpen) {
    return jsonError(
      "El registro de esta edición ya está cerrado. Escríbenos por WhatsApp y te avisamos de la siguiente.",
      409,
      "REGISTRATION_CLOSED",
    );
  }

  const parsed = buildCourseRegistrationSchema(edition).safeParse(payload);
  if (!parsed.success) {
    // El detalle del error NO se devuelve: los mensajes por campo los da el
    // formulario, que valida con el mismo esquema. Aquí sólo importa que el
    // servidor no guarde algo inválido.
    return jsonError("Revisa los datos del formulario.", 400);
  }

  if (!isSupabaseConfigured()) {
    // Degradación amable: el formulario muestra la salida por WhatsApp en vez
    // de un error técnico. Pasa en previews sin credenciales de base.
    return jsonError(
      "No pudimos guardar tu registro ahora mismo. Escríbenos por WhatsApp y te apartamos tu lugar.",
      503,
      "NOT_CONFIGURED",
    );
  }

  const client = requireServiceClient();
  const { data, error } = await client
    .from("course_registrations")
    .insert({
      course_slug: course.slug,
      edition: edition.edition,
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email ?? null,
      preferred_date: parsed.data.preferredDate,
      party_size: parsed.data.partySize,
      comment: parsed.data.comment ?? null,
      // El estado inicial lo pone SIEMPRE el servidor. No se acepta del
      // cliente (el esquema `.strict()` ni siquiera lo admite): un registro
      // no puede nacer diciendo que ya está confirmado.
      status: COURSE_REGISTRATION_INITIAL_STATUS,
    })
    .select("id")
    .single();

  if (error || !data) {
    /**
     * La tabla puede no existir todavía: la migración 0008 es aditiva y se
     * aplica a mano. Postgres devuelve 42P01 y PostgREST PGRST205 cuando no
     * la encuentra en su caché de esquema. En ese caso el fallo no es del
     * cliente, así que se responde lo mismo que si faltara configuración y el
     * formulario ofrece la salida por WhatsApp.
     */
    const code = (error as { code?: string } | null)?.code;
    if (code === "42P01" || code === "PGRST205") {
      console.error(
        "[cursos] la tabla course_registrations no existe: aplica supabase/migrations/0008_course_registrations.sql",
      );
      return jsonError(
        "No pudimos guardar tu registro ahora mismo. Escríbenos por WhatsApp y te apartamos tu lugar.",
        503,
        "NOT_CONFIGURED",
      );
    }
    // Sólo el código del error, nunca el payload (que lleva PII).
    console.error(`[cursos] no se pudo guardar el registro (code=${code ?? "desconocido"})`);
    return jsonError(
      "No pudimos guardar tu registro. Intenta de nuevo en un momento.",
      500,
    );
  }

  // Auditoría SIN datos personales: sirve para contar y para rastrear un
  // registro por id, no para reconstruir quién se apuntó.
  await logAudit({
    actor: "public",
    action: "course_registration.create",
    entityType: "course_registration",
    entityId: data.id as string,
    metadata: {
      course_slug: course.slug,
      edition: edition.edition,
      preferred_date: parsed.data.preferredDate,
      party_size: parsed.data.partySize,
    },
  });

  // Respuesta mínima: ni el id se devuelve. El cliente sólo necesita saber
  // que llegó para pintar la confirmación.
  return jsonOk({});
}

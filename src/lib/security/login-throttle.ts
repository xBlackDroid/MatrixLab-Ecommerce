import "server-only";

import { createHash } from "node:crypto";
import { getServiceClient } from "@/lib/db/admin";

/**
 * Freno DURABLE de fuerza bruta para el login del panel admin.
 *
 * Por qué existe además de `checkRateLimit`: el rate limit de
 * `security/rate-limit.ts` guarda sus contadores en un `Map` del proceso. En
 * Vercel cada invocación puede caer en una instancia serverless distinta —y
 * las instancias se reciclan constantemente—, así que ese contador se reinicia
 * solo y no es un control real contra un atacante que envía peticiones en
 * paralelo. El panel se abre con UNA contraseña compartida, sin segundo
 * factor: es el único secreto entre Internet y todos los pedidos y datos de
 * clientes, así que su freno tiene que ser compartido por todas las
 * instancias. Aquí el contador vive en Postgres.
 *
 * El rate limit en memoria se conserva: absorbe ráfagas sin tocar la base.
 * Este módulo es la segunda barrera, la que sí persiste.
 *
 * Si la base no está configurada, las funciones son no-op: el login sigue
 * protegido por el límite en memoria y el panel no queda inutilizable por un
 * fallo de infraestructura.
 */

/** Intentos fallidos permitidos por IP dentro de la ventana. */
export const ADMIN_LOGIN_MAX_ATTEMPTS = 5;
/** Ventana de acumulación de fallos (segundos). */
export const ADMIN_LOGIN_WINDOW_SECONDS = 15 * 60;
/** Duración del bloqueo una vez agotada la cuota (segundos). */
export const ADMIN_LOGIN_LOCK_SECONDS = 30 * 60;

/**
 * Clave de conteo: hash de la IP, nunca la IP.
 *
 * Sirve igual para agrupar intentos y evita almacenar un dato personal
 * identificable en una tabla que además es de seguridad (LFPDPPP:
 * minimización). El sufijo fija el dominio del hash a este uso.
 */
export function hashClientIp(ip: string): string {
  return createHash("sha256").update(`admin-login:${ip}`).digest("hex");
}

export interface LoginLockState {
  locked: boolean;
  retryAfterSeconds: number;
}

const UNLOCKED: LoginLockState = { locked: false, retryAfterSeconds: 0 };

function toLockState(lockedUntil: unknown): LoginLockState {
  if (typeof lockedUntil !== "string") return UNLOCKED;
  const until = new Date(lockedUntil).getTime();
  if (!Number.isFinite(until) || until <= Date.now()) return UNLOCKED;
  return {
    locked: true,
    retryAfterSeconds: Math.max(1, Math.ceil((until - Date.now()) / 1000)),
  };
}

/** ¿Esta IP está bloqueada ahora mismo? */
export async function getAdminLoginLock(ip: string): Promise<LoginLockState> {
  const client = getServiceClient();
  if (!client) return UNLOCKED;
  try {
    const { data, error } = await client.rpc("admin_login_lock_state", {
      p_ip_hash: hashClientIp(ip),
    });
    if (error) return UNLOCKED;
    return toLockState(data);
  } catch {
    // Un fallo de la base nunca debe cerrar el panel a su dueño.
    return UNLOCKED;
  }
}

/**
 * Registra un intento fallido. Devuelve el estado de bloqueo resultante para
 * que el handler pueda responder 429 con Retry-After en el mismo intento que
 * agotó la cuota.
 */
export async function registerAdminLoginFailure(
  ip: string,
): Promise<LoginLockState> {
  const client = getServiceClient();
  if (!client) return UNLOCKED;
  try {
    const { data, error } = await client.rpc("register_admin_login_failure", {
      p_ip_hash: hashClientIp(ip),
      p_max_attempts: ADMIN_LOGIN_MAX_ATTEMPTS,
      p_window_seconds: ADMIN_LOGIN_WINDOW_SECONDS,
      p_lock_seconds: ADMIN_LOGIN_LOCK_SECONDS,
    });
    if (error) return UNLOCKED;
    return toLockState(data);
  } catch {
    return UNLOCKED;
  }
}

/** Limpia el contador tras un acceso correcto. */
export async function clearAdminLoginFailures(ip: string): Promise<void> {
  const client = getServiceClient();
  if (!client) return;
  try {
    await client.rpc("clear_admin_login_attempts", {
      p_ip_hash: hashClientIp(ip),
    });
  } catch {
    // Best-effort: la ventana expira sola.
  }
}

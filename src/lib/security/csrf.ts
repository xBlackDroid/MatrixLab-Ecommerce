import "server-only";

import { timingSafeEqual } from "node:crypto";

/**
 * Protección CSRF para mutaciones del panel admin.
 *
 * El token CSRF vive dentro del payload firmado de la sesión admin
 * (ver security/session.ts). Las páginas server lo pasan como prop a los
 * componentes cliente, que deben enviarlo en el header `x-ml-csrf` en cada
 * POST/PATCH/DELETE. Al estar ligado a la sesión firmada, un atacante no
 * puede forjarlo desde otro origen.
 */

export const CSRF_HEADER = "x-ml-csrf";

export function verifyCsrf(request: Request, expectedToken: string): boolean {
  const received = request.headers.get(CSRF_HEADER) ?? "";
  if (!received || !expectedToken) return false;
  const a = Buffer.from(received);
  const b = Buffer.from(expectedToken);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

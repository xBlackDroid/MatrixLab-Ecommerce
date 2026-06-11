import "server-only";

/**
 * Rate limiting con ventana deslizante.
 *
 * Implementación actual: in-memory (Map). Es segura y suficiente para
 * desarrollo y para despliegues de una sola instancia.
 *
 * PRODUCCIÓN MULTI-INSTANCIA: sustituir el backend in-memory por
 * Redis/Upstash (@upstash/ratelimit + @upstash/redis) manteniendo la misma
 * firma de `checkRateLimit`. El resto del código no necesita cambios.
 */

type Bucket = { timestamps: number[] };

const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();

const MAX_KEYS = 50_000;

function sweep(windowMs: number) {
  const now = Date.now();
  // Limpieza periódica para que el Map no crezca sin límite.
  if (now - lastSweep < 60_000 && buckets.size < MAX_KEYS) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);
    if (bucket.timestamps.length === 0) buckets.delete(key);
  }
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function checkRateLimit(
  key: string,
  options: { limit: number; windowMs: number },
): RateLimitResult {
  const { limit, windowMs } = options;
  const now = Date.now();
  sweep(windowMs);

  const bucket = buckets.get(key) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);

  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0];
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
    };
  }

  bucket.timestamps.push(now);
  buckets.set(key, bucket);
  return {
    ok: true,
    remaining: limit - bucket.timestamps.length,
    retryAfterSeconds: 0,
  };
}

/** IP del cliente detrás de proxy/CDN. Solo para rate limiting, no para auth. */
export function getClientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim().slice(0, 64);
  return request.headers.get("x-real-ip")?.slice(0, 64) ?? "unknown";
}

/** Límites estándar por endpoint (solicitudes por ventana). */
export const RATE_LIMITS = {
  checkout: { limit: 5, windowMs: 60_000 },
  cart: { limit: 40, windowMs: 60_000 },
  designs: { limit: 20, windowMs: 60_000 },
  uploads: { limit: 10, windowMs: 5 * 60_000 },
  adminLogin: { limit: 5, windowMs: 5 * 60_000 },
  adminApi: { limit: 120, windowMs: 60_000 },
  webhook: { limit: 120, windowMs: 60_000 },
} as const;

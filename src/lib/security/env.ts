import "server-only";

/**
 * Acceso centralizado y seguro a variables de entorno del servidor.
 *
 * Reglas:
 * - Los secretos (MERCADOPAGO_ACCESS_TOKEN, SUPABASE_SERVICE_ROLE_KEY,
 *   ADMIN_*) solo se leen aquí y nunca se reexportan hacia el cliente.
 * - Nada se imprime en consola ni se incluye en mensajes de error.
 * - Cada funcionalidad valida su propia disponibilidad (feature gates) en
 *   lugar de tronar el build cuando falta una variable.
 */

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

export function getServerEnv() {
  return {
    siteUrl: clean(process.env.NEXT_PUBLIC_SITE_URL),
    mpAccessToken: clean(process.env.MERCADOPAGO_ACCESS_TOKEN),
    mpWebhookSecret: clean(process.env.MERCADOPAGO_WEBHOOK_SECRET),
    databaseUrl: clean(process.env.DATABASE_URL),
    supabaseUrl: clean(process.env.SUPABASE_URL),
    supabaseAnonKey: clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    supabaseServiceRoleKey: clean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    adminAccessPassword: clean(process.env.ADMIN_ACCESS_PASSWORD),
    adminSessionSecret: clean(process.env.ADMIN_SESSION_SECRET),
    paymentProvider: clean(process.env.PAYMENT_PROVIDER) ?? "mercadopago",
    uploadMaxMb: Math.min(
      Math.max(Number(clean(process.env.UPLOAD_MAX_MB) ?? "10") || 10, 1),
      50,
    ),
  };
}

/** Supabase listo para operaciones de servidor (service role). */
export function isSupabaseConfigured(): boolean {
  const env = getServerEnv();
  return Boolean(env.supabaseUrl && env.supabaseServiceRoleKey);
}

/** Catálogo público legible (anon key + RLS o service role). */
export function isCatalogConfigured(): boolean {
  const env = getServerEnv();
  return Boolean(
    env.supabaseUrl && (env.supabaseAnonKey || env.supabaseServiceRoleKey),
  );
}

export function isMercadoPagoConfigured(): boolean {
  return Boolean(getServerEnv().mpAccessToken);
}

export function isAdminConfigured(): boolean {
  const env = getServerEnv();
  return Boolean(env.adminAccessPassword && env.adminSessionSecret);
}

/**
 * Checkout requiere: token de Mercado Pago, base de datos para registrar el
 * pedido y NEXT_PUBLIC_SITE_URL para construir back_urls y notification_url.
 */
export function isCheckoutConfigured(): boolean {
  const env = getServerEnv();
  return Boolean(
    env.mpAccessToken &&
      env.siteUrl &&
      env.supabaseUrl &&
      env.supabaseServiceRoleKey,
  );
}

export function getSiteUrl(): string | undefined {
  const url = getServerEnv().siteUrl;
  return url?.replace(/\/+$/, "");
}

/**
 * Guardia anti-fuga: detecta secretos publicados con prefijo NEXT_PUBLIC.
 * Si alguien define NEXT_PUBLIC_MERCADOPAGO_ACCESS_TOKEN o similar,
 * el servidor lo reporta (sin imprimir el valor) y bloquea en producción.
 */
export function assertNoLeakedSecrets(): void {
  const leaked = Object.keys(process.env).filter(
    (key) =>
      key.startsWith("NEXT_PUBLIC_") &&
      /(SERVICE_ROLE|ACCESS_TOKEN|SESSION_SECRET|WEBHOOK_SECRET|PASSWORD|DATABASE_URL)/i.test(
        key,
      ),
  );
  if (leaked.length > 0) {
    const message = `Variables sensibles expuestas con prefijo NEXT_PUBLIC: ${leaked.join(", ")}. Quita el prefijo NEXT_PUBLIC de inmediato.`;
    if (isProduction()) {
      throw new Error(message);
    }
    console.error(`[seguridad] ${message}`);
  }
}

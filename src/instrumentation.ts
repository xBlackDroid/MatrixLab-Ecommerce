/**
 * Arranque del servidor (Next.js llama a `register()` una vez por instancia).
 *
 * La guardia anti-fuga de secretos vivía sólo en `/api/checkout`, así que un
 * `NEXT_PUBLIC_` mal puesto pasaba desapercibido hasta el primer cobro (ML-12).
 * Aquí corre al arrancar cada instancia: en producción tumba el arranque
 * (fail-safe, el secreto nunca llega a servirse) y en desarrollo lo avisa.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { assertNoLeakedSecrets } = await import("@/lib/security/env");
  assertNoLeakedSecrets();
}

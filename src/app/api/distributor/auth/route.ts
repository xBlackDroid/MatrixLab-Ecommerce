import { type NextRequest } from "next/server";
import { z } from "zod";
import { readJsonBody } from "@/lib/api";
import { requireServiceClient } from "@/lib/db/admin";
import { getServerEnv } from "@/lib/security/env";
import { getClientIp } from "@/lib/security/rate-limit";
import { DISTRIBUTOR_COOKIE, cookieOptions, getDistributor } from "@/lib/consignments/server";
import { gate, fail, response } from "@/lib/consignments/http";
import { signToken, sessionHash } from "@/lib/consignments/tokens";
import { usernameSchema } from "@/lib/consignments/access";
import { verifyPassword } from "@/lib/consignments/passwords";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const Login = z.object({ action: z.literal("login"), username: usernameSchema, password: z.string().min(1).max(128) }).strict();
export async function POST(req: NextRequest) {
  try {
    const blocked = gate(req); if (blocked) return blocked;
    const env = getServerEnv();
    if (!env.consignmentSiteUrl || !env.consignmentSessionSecret || env.consignmentSessionSecret.length < 32)
      return fail("SERVICE", 503, "El acceso no está configurado.");
    if (req.headers.get("origin") !== new URL(env.consignmentSiteUrl).origin) return fail("ORIGIN", 403, "Origen inválido.");
    const db = requireServiceClient();
    const parsed = z.union([Login, z.object({ action: z.literal("logout") }).strict()]).safeParse(await readJsonBody(req));
    if (!parsed.success) return fail("INVALID", 400, "Revisa los datos.");
    if (parsed.data.action === "logout") {
      const s = await getDistributor(req, true); if (!s) return fail("UNAUTHORIZED", 401, "Sesión inválida.");
      const { error } = await db.from("consignment_sessions").update({ revoked_at: new Date().toISOString() }).eq("token_hash", sessionHash(s.sid));
      if (error) throw error;
      const r = response({ ok: true }); r.cookies.set(DISTRIBUTOR_COOKIE, "", { ...cookieOptions(), maxAge: 0 }); return r;
    }
    // Límite durable antes de derivar contraseñas; permanece tras reiniciar Next.
    const ipHash = sessionHash(`distributor-login:${getClientIp(req)}`);
    const existingLock = await db.rpc("admin_login_lock_state", { p_ip_hash: ipHash });
    if (existingLock.error) throw existingLock.error;
    if (typeof existingLock.data === "string" && new Date(existingLock.data).getTime() > Date.now()) return fail("RATE_LIMIT", 429, "Espera antes de intentar de nuevo.");
    const lock = await db.rpc("register_admin_login_failure", { p_ip_hash: ipHash, p_max_attempts: 10, p_window_seconds: 900, p_lock_seconds: 900 });
    if (lock.error) throw lock.error;
    if (typeof lock.data === "string" && new Date(lock.data).getTime() > Date.now()) return fail("RATE_LIMIT", 429, "Espera antes de intentar de nuevo.");
    const { data: credential, error: ce } = await db.from("distributor_credentials")
      .select("membership_id,password_digest,is_active").eq("username", parsed.data.username).maybeSingle();
    if (ce) throw ce;
    const valid = await verifyPassword(parsed.data.password, credential?.password_digest);
    if (!valid || !credential?.is_active) return fail("UNAUTHORIZED", 401, "Credenciales inválidas.");
    const signed = signToken(env.consignmentSessionSecret);
    // Revalidación atómica contra reset/suspensión concurrente, antes de crear sesión.
    const opened = await db.rpc("consignment_open_session", { p_membership: credential.membership_id,
      p_password_digest: credential.password_digest, p_token_hash: sessionHash(signed.payload.sid),
      p_expires_at: new Date(signed.payload.exp * 1000).toISOString() });
    if (opened.error) throw opened.error;
    if (opened.data !== true) return fail("UNAUTHORIZED", 401, "Credenciales inválidas.");
    const cleared = await db.rpc("clear_admin_login_attempts", { p_ip_hash: ipHash }); if (cleared.error) throw cleared.error;
    const r = response({ ok: true }); r.cookies.set(DISTRIBUTOR_COOKIE, signed.token, cookieOptions()); return r;
  } catch { return fail("SERVICE", 503, "El acceso no está disponible. Intenta más tarde."); }
}

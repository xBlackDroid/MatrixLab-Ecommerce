import { type NextRequest } from "next/server";
import { readJsonBody } from "@/lib/api";
import { requireServiceClient } from "@/lib/db/admin";
import { requireAdminMutation, getAdminFromRequest } from "@/lib/security/admin-auth";
import { hashAdminSid } from "@/lib/security/session";
import { getServerEnv } from "@/lib/security/env";
import { AccessSchema } from "@/lib/consignments/access";
import { accessFingerprint, hashPassword } from "@/lib/consignments/passwords";
import { gate, fail, response, dbFailure } from "@/lib/consignments/http";
import { z } from "zod";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const blocked = gate(req); if (blocked) return blocked;
    if (!await getAdminFromRequest(req)) return fail("UNAUTHORIZED", 401, "Inicia sesión.");
    const id = z.uuid().safeParse(req.nextUrl.searchParams.get("id"));
    if (!id.success) return fail("INVALID", 400, "Distribuidor inválido.");
    const { data, error } = await requireServiceClient().from("distributor_credentials")
      .select("username,membership_id,is_active,updated_at").eq("distributor_id", id.data).order("username");
    if (error) throw error;
    return response({ ok: true, accounts: data });
  } catch { return fail("SERVICE", 503, "No pudimos consultar los accesos."); }
}
export async function POST(req: NextRequest) {
  try {
    const blocked = gate(req); if (blocked) return blocked;
    const admin = await requireAdminMutation(req);
    if (!admin) return fail("UNAUTHORIZED", 401, "Sesión o confirmación inválida.");
    const parsed = AccessSchema.safeParse(await readJsonBody(req));
    if (!parsed.success) return fail("INVALID", 400, "Usa un usuario de 3 a 64 caracteres y contraseña de 8 a 128.");
    const key = req.headers.get("idempotency-key") ?? "";
    if (!/^[A-Za-z0-9_-]{8,120}$/.test(key)) return fail("INVALID_KEY", 400, "Falta la clave de confirmación.");
    const command = parsed.data;
    const fingerprint = accessFingerprint(command, getServerEnv().consignmentSessionSecret ?? "");
    const digest = "password" in command ? await hashPassword(command.password) : null;
    const { data, error } = await requireServiceClient().rpc("consignment_access_command", {
      p_distributor: command.distributorId, p_actor: `admin:${hashAdminSid(admin.sid)}`, p_key: key,
      p_action: command.action, p_username: command.username, p_password_digest: digest, p_fingerprint: fingerprint,
    });
    return error ? dbFailure(error) : response({ ok: true, result: data });
  } catch { return fail("SERVICE", 503, "No pudimos guardar. Reintenta la misma confirmación."); }
}

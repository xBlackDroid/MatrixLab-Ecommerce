import { type NextRequest } from "next/server";
import { z } from "zod";
import { getAdminFromRequest, requireAdminMutation } from "@/lib/security/admin-auth";
import { hashAdminSid } from "@/lib/security/session";
import { requireServiceClient } from "@/lib/db/admin";
import { readJsonBody } from "@/lib/api";
import { EnvelopeSchema } from "@/lib/consignments/domain";
import { gate, fail, response, readAccount, runCommand } from "@/lib/consignments/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  try {
    const blocked = gate(req); if (blocked) return blocked;
    if (!await getAdminFromRequest(req)) return fail("UNAUTHORIZED", 401, "Inicia sesión.");
    const db = requireServiceClient(); const id = req.nextUrl.searchParams.get("id");
    if (id) return z.uuid().safeParse(id).success ? await readAccount(req, id, true) : fail("INVALID", 400, "ID inválido.");
    const catalog = req.nextUrl.searchParams.get("catalog");
    if (catalog !== null) {
      const { data, error } = await db.from("product_variants").select("id,title,sku,products(title,images)").limit(100);
      if (error) throw error;
      return response({ ok: true, catalog: data });
    }
    const { data, error } = await db.from("distributors").select("id,name,slug,is_active").order("name").limit(100);
    if (error) throw error;
    return response({ ok: true, distributors: data });
  } catch { return fail("SERVICE", 503, "No pudimos consultar la base de datos."); }
}
export async function POST(req: NextRequest) {
  try {
    const blocked = gate(req); if (blocked) return blocked;
    const admin = await requireAdminMutation(req); if (!admin) return fail("UNAUTHORIZED", 401, "Sesión o confirmación inválida.");
    const parsed = EnvelopeSchema.safeParse(await readJsonBody(req));
    if (!parsed.success) return fail("INVALID", 400, "Revisa los datos capturados.");
    return await runCommand(req, parsed.data.distributorId, `admin:${hashAdminSid(admin.sid)}`, "matrixlab_admin", null, parsed.data.command);
  } catch { return fail("SERVICE", 503, "No pudimos guardar. Conserva la confirmación."); }
}

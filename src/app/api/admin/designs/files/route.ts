import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminMutation } from "@/lib/security/admin-auth";
import { requireServiceClient, logAudit } from "@/lib/db/admin";
import { jsonError, readJsonBody } from "@/lib/api";
import { deleteDesignFiles, type DesignDeletionJob } from "@/lib/designer/delete-files";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/security/rate-limit";
import { tooManyRequests } from "@/lib/api";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
const Schema = z.object({ designId: z.uuid(), assetIds: z.array(z.uuid()).min(1).max(50).optional(), deleteProject: z.boolean().default(false), resume: z.boolean().default(false) }).strict()
  .refine(v => v.resume || v.deleteProject || !!v.assetIds?.length);

export async function DELETE(request: NextRequest) {
  const limit = checkRateLimit(`admin-api:${getClientIp(request)}`, RATE_LIMITS.adminApi);
  if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds);
  if (!await requireAdminMutation(request)) return jsonError("No autorizado.", 401);
  const parsed = Schema.safeParse(await readJsonBody(request));
  if (!parsed.success) return jsonError("Selecciona los archivos o previews que quieres borrar.", 400);
  const { designId, deleteProject, resume } = parsed.data;
  try {
    const client = requireServiceClient();
    const { data, error } = await client.rpc("design_delete_begin", {
      p_design: designId, p_assets: parsed.data.assetIds ? [...new Set(parsed.data.assetIds)].sort() : null,
      p_project: deleteProject, p_resume: resume,
    });
    if (error) {
      if (error.message.includes("DESIGN_LINKED")) return jsonError("Este diseño está vinculado a un carrito o pedido. Retira primero el vínculo para conservar sus archivos de producción.", 409);
      if (error.message.includes("DESIGN_WRITING")) return jsonError("Hay una subida o guardado en curso. Espera a que termine y vuelve a intentar.", 409);
      if (error.message.includes("ASSET_NOT_FOUND")) return jsonError("Los archivos no pertenecen a este diseño o ya no existen.", 404);
      if (error.message.includes("DESIGN_DELETING")) return jsonError("Hay un borrado pendiente. Usa Reintentar borrado.", 409);
      throw error;
    }
    if (!data?.alreadyDeleted) {
      await deleteDesignFiles(client, data as DesignDeletionJob);
      const finished = await client.rpc("design_delete_finish", { p_job: data.id });
      if (finished.error) throw finished.error;
      await logAudit({ actor: "admin", action: "design.files_deleted", entityType: "design_project", entityId: designId, metadata: { deleteProject: data.delete_project, assetCount: data.asset_ids.length } });
    }
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return jsonError("No se completó el borrado. Actualiza y reintenta el trabajo pendiente; los registros se conservan hasta limpiar Storage.", 503);
  }
}

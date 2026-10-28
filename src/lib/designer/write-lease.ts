import "server-only";
import type { NextRequest } from "next/server";
import { requireServiceClient } from "@/lib/db/admin";
import { jsonError } from "@/lib/api";
import { readSessionId } from "@/lib/security/session";
import { isSupabaseConfigured } from "@/lib/security/env";
import { UuidSchema } from "@/lib/validation/store";

/** Evita borrar archivos mientras una subida o guardado sigue escribiendo. */
export async function withDesignWriteLease(request: NextRequest, id: string, write: () => Promise<Response>): Promise<Response> {
  const session = readSessionId(request);
  if (!session || !UuidSchema.safeParse(id).success || !isSupabaseConfigured()) return write();
  const client = requireServiceClient();
  const { data, error } = await client.rpc("design_write_begin", { p_design: id, p_session: session });
  if (error || typeof data !== "string") {
    if (error?.message.includes("DESIGN_NOT_FOUND")) return jsonError("Diseño no encontrado.", 404);
    if (error?.message.includes("DESIGN_DELETING")) return jsonError("Este diseño se está eliminando.", 409);
    return jsonError("No pudimos preparar el guardado. Intenta de nuevo.", 503);
  }
  try { return await write(); }
  finally { await client.from("design_write_leases").delete().eq("id", data); }
}

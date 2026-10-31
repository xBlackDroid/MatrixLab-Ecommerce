import { type NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest, requireAdminMutation } from "@/lib/security/admin-auth";
import { requireServiceClient } from "@/lib/db/admin";
import { readJsonBody } from "@/lib/api";
import { applyCommand, dateSchema, emptyBazar, envelopeSchema, type Bazar } from "@/lib/bazar/domain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
export async function GET(req: NextRequest) {
  try {
    if (!await getAdminFromRequest(req)) return reply({ error: "Inicia sesión como administrador." }, 401);
    const date = dateSchema.safeParse(req.nextUrl.searchParams.get("date"));
    if (!date.success) return reply({ error: "Fecha inválida." }, 400);
    const { data, error } = await requireServiceClient().from("bazar_days").select("document,version").eq("date", date.data).maybeSingle();
    if (error) throw error;
    return reply({ state: data?.document ?? emptyBazar(), version: data?.version ?? 0 });
  } catch { return reply({ error: "No pudimos consultar el bazar. Reintenta." }, 503); }
}
export async function POST(req: NextRequest) {
  try {
    if (!await requireAdminMutation(req)) return reply({ error: "Tu sesión venció. Vuelve a iniciar sesión." }, 401);
    const parsed = envelopeSchema.safeParse(await readJsonBody(req));
    if (!parsed.success) return reply({ error: "Revisa nombre, cantidades, precios y forma de pago." }, 400);
    const { date, requestId, command } = parsed.data;
    const db = requireServiceClient();
    const { error: createError } = await db.from("bazar_days").upsert({ date, document: emptyBazar(), version: 0 }, { onConflict: "date", ignoreDuplicates: true });
    if (createError) throw createError;
    for (let attempt = 0; attempt < 6; attempt++) {
      const { data, error } = await db.from("bazar_days").select("document,version").eq("date", date).single();
      if (error) throw error;
      let next: Bazar;
      try { next = applyCommand(data.document as Bazar, requestId, command, new Date().toISOString()); }
      catch (e) { return reply({ error: e instanceof Error ? e.message : "Revisa la operación." }, 409); }
      if (next === data.document) return reply({ state: next, version: data.version });
      const { data: saved, error: writeError } = await db.from("bazar_days").update({ document: next, version: data.version + 1, updated_at: new Date().toISOString() }).eq("date", date).eq("version", data.version).select("version").maybeSingle();
      if (writeError) throw writeError;
      if (saved) return reply({ state: next, version: saved.version });
    }
    return reply({ error: "Otra persona está registrando. Reintenta esta misma operación." }, 503);
  } catch { return reply({ error: "No pudimos confirmar el guardado. Reintenta la misma operación para evitar duplicados." }, 503); }
}

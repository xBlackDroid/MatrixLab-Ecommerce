import { type NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { jsonError, readJsonBody, tooManyRequests } from "@/lib/api";
import { requireServiceClient } from "@/lib/db/admin";
import { BUCKETS, createSignedUrl, uploadToBucket } from "@/lib/db/storage";
import { UPLOAD_ERRORS } from "@/lib/uploads/errors";
import type { DesignProjectRow } from "@/lib/db/types";
import { isSupabaseConfigured } from "@/lib/security/env";
import {
  checkRateLimit,
  getClientIp,
  RATE_LIMITS,
} from "@/lib/security/rate-limit";
import { hashSessionId, readSessionId } from "@/lib/security/session";
import { sanitizeMultiline, sanitizeText } from "@/lib/security/sanitize";
import {
  DESIGN_JSON_MAX_BYTES,
  DESIGN_JSON_MAX_BYTES_V2,
  DesignerSaveSchema,
  DesignSaveV2Schema,
  PREVIEW_MAX_BYTES,
} from "@/lib/validation/designer";
import { UuidSchema } from "@/lib/validation/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/** Estados en los que el cliente todavía puede editar su diseño. */
const EDITABLE_STATUSES = ["draft", "added_to_cart"];

async function findOwnedDesign(
  designId: string,
  sessionId: string,
): Promise<DesignProjectRow | null> {
  const client = requireServiceClient();
  const { data } = await client
    .from("design_projects")
    .select("*")
    .eq("id", designId)
    .eq("session_id", sessionId)
    .maybeSingle();
  return (data as DesignProjectRow | null) ?? null;
}

export async function GET(request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return jsonError(
      UPLOAD_ERRORS.STORAGE_NOT_CONFIGURED,
      503,
      "STORAGE_NOT_CONFIGURED",
    );
  }
  const sessionId = readSessionId(request);
  if (!sessionId) return jsonError("Sesión inválida.", 401);

  const { id } = await context.params;
  const idParsed = UuidSchema.safeParse(id);
  if (!idParsed.success) return jsonError("Datos inválidos.", 400);

  const design = await findOwnedDesign(idParsed.data, sessionId);
  if (!design) return jsonError("Diseño no encontrado.", 404);

  const [assetUrl, previewUrl] = await Promise.all([
    createSignedUrl(BUCKETS.designAssets, design.uploaded_asset_url, 3600),
    createSignedUrl(BUCKETS.designPreviews, design.preview_url, 3600),
  ]);

  return NextResponse.json({
    ok: true,
    design: {
      id: design.id,
      productType: design.product_type,
      productId: design.product_id,
      variantId: design.variant_id,
      baseColor: design.base_color,
      selectedSize: design.selected_size,
      printZone: design.print_zone,
      positionX: Number(design.position_x),
      positionY: Number(design.position_y),
      scale: Number(design.scale),
      rotation: Number(design.rotation),
      customerNotes: design.customer_notes,
      status: design.status,
      designJson: design.design_json,
      assetSignedUrl: assetUrl,
      previewSignedUrl: previewUrl,
    },
  });
}

/**
 * Genera y sube una preview compuesta (dataURL del canvas) a storage privado.
 * Re-encodea con sharp a webp para neutralizar payloads. Devuelve la ruta o
 * undefined (la preview es opcional y nunca tira el guardado).
 */
async function buildPreviewPath(
  sessionId: string,
  designId: string,
  dataUrl: string,
): Promise<string | undefined> {
  const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(
    dataUrl,
  );
  if (!match || dataUrl.length > PREVIEW_MAX_BYTES) return undefined;
  try {
    const sharp = (await import("sharp")).default;
    const inputBuffer = Buffer.from(match[2]!, "base64");
    const safePreview = await sharp(inputBuffer)
      .resize({ width: 1000, height: 1200, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    const path = `${hashSessionId(sessionId)}/${designId}/preview-${nanoid(8)}.webp`;
    const uploaded = await uploadToBucket({
      bucket: BUCKETS.designPreviews,
      path,
      body: safePreview,
      contentType: "image/webp",
    });
    if (uploaded.ok) return path;
  } catch {
    // Preview inválida: se ignora.
  }
  return undefined;
}

/**
 * Guarda un diseño. Acepta el formato v1 (single-asset) por compatibilidad o
 * el formato v2 (prenda multi-imagen / planilla / láser). El backend revalida
 * todos los límites: nunca confía en el cliente.
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const ip = getClientIp(request);
  const limit = checkRateLimit(`designs:${ip}`, RATE_LIMITS.designs);
  if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds);

  if (!isSupabaseConfigured()) {
    return jsonError(
      UPLOAD_ERRORS.STORAGE_NOT_CONFIGURED,
      503,
      "STORAGE_NOT_CONFIGURED",
    );
  }
  const sessionId = readSessionId(request);
  if (!sessionId) return jsonError("Sesión inválida.", 401);

  const { id } = await context.params;
  const idParsed = UuidSchema.safeParse(id);
  const body = await readJsonBody(request);
  if (!idParsed.success) return jsonError("Datos inválidos.", 400);

  const design = await findOwnedDesign(idParsed.data, sessionId);
  if (!design) return jsonError("Diseño no encontrado.", 404);
  if (!EDITABLE_STATUSES.includes(design.status)) {
    return jsonError("Este diseño ya está ligado a un pedido.", 409);
  }

  const client = requireServiceClient();

  // DIAGNÓSTICO TEMPORAL (sin secretos): solo para el laboratorio escolar.
  const bodyForLog = body as {
    designerType?: unknown;
    designJson?: Record<string, unknown>;
  } | null;
  if (bodyForLog?.designerType === "school-labels") {
    const dj = bodyForLog.designJson;
    console.info("[api/designs PATCH school-labels] incoming", {
      id: idParsed.data,
      hasDesignJson: Boolean(dj),
      designerType: dj?.designerType,
      productType: dj?.productType,
      productHandle: dj?.productHandle,
      package: dj?.package,
      designCount: dj?.designCount,
      typographyCode: dj?.typographyCode,
      colorCode: dj?.colorCode,
      addons: dj?.addons,
      studentKeys:
        dj?.student && typeof dj.student === "object"
          ? Object.keys(dj.student as Record<string, unknown>)
          : null,
      previewDataUrlLen:
        typeof (body as { previewDataUrl?: unknown })?.previewDataUrl === "string"
          ? ((body as { previewDataUrl: string }).previewDataUrl.length)
          : 0,
    });
  }

  // ---- v1: single-asset (compatibilidad con diseños existentes) ----------
  const v1 = DesignerSaveSchema.safeParse(body);
  if (v1.success) {
    if (
      v1.data.designJson &&
      JSON.stringify(v1.data.designJson).length > DESIGN_JSON_MAX_BYTES
    ) {
      return jsonError("El diseño es demasiado complejo.", 400);
    }
    const previewPath = v1.data.previewDataUrl
      ? await buildPreviewPath(sessionId, design.id, v1.data.previewDataUrl)
      : undefined;
    const { error } = await client
      .from("design_projects")
      .update({
        product_type: v1.data.productType,
        product_id: v1.data.productId,
        variant_id: v1.data.variantId ?? null,
        base_color: v1.data.baseColor ?? null,
        selected_size: v1.data.selectedSize ?? null,
        print_zone: v1.data.printZone,
        position_x: v1.data.positionX,
        position_y: v1.data.positionY,
        scale: v1.data.scale,
        rotation: v1.data.rotation,
        customer_notes: v1.data.customerNotes
          ? sanitizeMultiline(v1.data.customerNotes, 500)
          : null,
        design_json: v1.data.designJson ?? null,
        ...(previewPath ? { preview_url: previewPath } : {}),
      })
      .eq("id", design.id)
      .eq("session_id", sessionId);
    if (error) {
      return jsonError("No pudimos guardar tu diseño. Intenta de nuevo.", 500);
    }
    return NextResponse.json({ ok: true, designId: design.id });
  }

  // ---- v2: prendas multi-imagen, planillas, láser y etiquetas escolares --
  const v2 = DesignSaveV2Schema.safeParse(body);
  if (!v2.success) {
    // DIAGNÓSTICO TEMPORAL (sin secretos): errores legibles de Zod.
    if (bodyForLog?.designerType === "school-labels") {
      console.info("[api/designs PATCH school-labels] validation error", {
        issues: v2.error.flatten(),
      });
    }
    return jsonError("Datos inválidos.", 400);
  }
  const payload = v2.data;

  if (JSON.stringify(payload.designJson).length > DESIGN_JSON_MAX_BYTES_V2) {
    return jsonError("El diseño es demasiado complejo.", 400);
  }

  // Sanitiza el texto del láser antes de persistir (defensa en profundidad).
  let designJson: Record<string, unknown> = payload.designJson as Record<
    string,
    unknown
  >;
  if (payload.designerType === "laser") {
    designJson = {
      ...payload.designJson,
      // El láser es solo texto: sanitiza cada cadena antes de persistir.
      elements: payload.designJson.elements.map((el) => ({
        ...el,
        text: sanitizeText(el.text, 40),
      })),
    };
  } else if (payload.designerType === "school-labels") {
    // Etiquetas escolares: texto libre del cliente. Sanitiza cada campo antes
    // de persistir (no HTML, no scripts, sin datos de control).
    const j = payload.designJson;
    const clean = (v: string | undefined, max: number) =>
      v ? sanitizeText(v, max) : undefined;
    designJson = {
      ...j,
      student: {
        firstName: sanitizeText(j.student.firstName, 60),
        lastName1: sanitizeText(j.student.lastName1, 60),
        lastName2: clean(j.student.lastName2, 60),
        nickname: clean(j.student.nickname, 40),
        school: clean(j.student.school, 80),
        grade: clean(j.student.grade, 20),
        group: clean(j.student.group, 20),
      },
      theme: clean(j.theme, 200),
      decorativeIcons: clean(j.decorativeIcons, 200),
      characterInspiration: clean(j.characterInspiration, 120),
      specialColors: clean(j.specialColors, 120),
      designComments: clean(j.designComments, 300),
      notes: clean(j.notes, 500),
    };
  }

  const previewPath = payload.previewDataUrl
    ? await buildPreviewPath(sessionId, design.id, payload.previewDataUrl)
    : undefined;

  const updates: Record<string, unknown> = {
    product_type: payload.productType,
    product_id: payload.productId,
    variant_id: payload.variantId ?? null,
    designer_type: payload.designerType,
    customer_notes: payload.customerNotes
      ? sanitizeMultiline(payload.customerNotes, 500)
      : null,
    design_json: designJson,
    ...(previewPath ? { preview_url: previewPath } : {}),
  };
  if (payload.designerType === "garment") {
    updates.base_color = payload.colorId;
    updates.selected_size = payload.size;
    updates.profile = payload.profile;
  }

  const { error } = await client
    .from("design_projects")
    .update(updates)
    .eq("id", design.id)
    .eq("session_id", sessionId);
  if (error) {
    return jsonError("No pudimos guardar tu diseño. Intenta de nuevo.", 500);
  }
  return NextResponse.json({ ok: true, designId: design.id });
}

import { type NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import {
  jsonError,
  readJsonBody,
  serviceUnavailable,
  tooManyRequests,
} from "@/lib/api";
import { requireServiceClient } from "@/lib/db/admin";
import { BUCKETS, createSignedUrl, uploadToBucket } from "@/lib/db/storage";
import type { DesignProjectRow } from "@/lib/db/types";
import { isSupabaseConfigured } from "@/lib/security/env";
import {
  checkRateLimit,
  getClientIp,
  RATE_LIMITS,
} from "@/lib/security/rate-limit";
import { hashSessionId, readSessionId } from "@/lib/security/session";
import { sanitizeMultiline } from "@/lib/security/sanitize";
import {
  DESIGN_JSON_MAX_BYTES,
  DesignerSaveSchema,
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
    return serviceUnavailable("El diseñador está en configuración.");
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

/** Guarda coordenadas, notas y preview compuesta del diseño. */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const ip = getClientIp(request);
  const limit = checkRateLimit(`designs:${ip}`, RATE_LIMITS.designs);
  if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds);

  if (!isSupabaseConfigured()) {
    return serviceUnavailable("El diseñador está en configuración.");
  }
  const sessionId = readSessionId(request);
  if (!sessionId) return jsonError("Sesión inválida.", 401);

  const { id } = await context.params;
  const idParsed = UuidSchema.safeParse(id);
  const body = await readJsonBody(request);
  const parsed = DesignerSaveSchema.safeParse(body);
  if (!idParsed.success || !parsed.success) {
    return jsonError("Datos inválidos.", 400);
  }

  const design = await findOwnedDesign(idParsed.data, sessionId);
  if (!design) return jsonError("Diseño no encontrado.", 404);
  if (!EDITABLE_STATUSES.includes(design.status)) {
    return jsonError("Este diseño ya está ligado a un pedido.", 409);
  }

  // El JSON de diseño tiene tamaño máximo estricto.
  if (
    parsed.data.designJson &&
    JSON.stringify(parsed.data.designJson).length > DESIGN_JSON_MAX_BYTES
  ) {
    return jsonError("El diseño es demasiado complejo.", 400);
  }

  const client = requireServiceClient();

  // Preview compuesta opcional (dataURL del canvas) → re-encode seguro webp.
  let previewPath: string | undefined;
  const dataUrl = parsed.data.previewDataUrl;
  if (dataUrl) {
    const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(
      dataUrl,
    );
    if (!match || dataUrl.length > PREVIEW_MAX_BYTES) {
      return jsonError("La preview no es válida.", 400);
    }
    try {
      const sharp = (await import("sharp")).default;
      const inputBuffer = Buffer.from(match[2]!, "base64");
      const safePreview = await sharp(inputBuffer)
        .resize({ width: 900, height: 900, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
      const path = `${hashSessionId(sessionId)}/${design.id}/preview-${nanoid(8)}.webp`;
      const uploaded = await uploadToBucket({
        bucket: BUCKETS.designPreviews,
        path,
        body: safePreview,
        contentType: "image/webp",
      });
      if (uploaded.ok) previewPath = path;
    } catch {
      // Preview inválida: se ignora, el diseño se guarda sin ella.
    }
  }

  const { error } = await client
    .from("design_projects")
    .update({
      product_type: parsed.data.productType,
      product_id: parsed.data.productId,
      variant_id: parsed.data.variantId ?? null,
      base_color: parsed.data.baseColor ?? null,
      selected_size: parsed.data.selectedSize ?? null,
      print_zone: parsed.data.printZone,
      position_x: parsed.data.positionX,
      position_y: parsed.data.positionY,
      scale: parsed.data.scale,
      rotation: parsed.data.rotation,
      customer_notes: parsed.data.customerNotes
        ? sanitizeMultiline(parsed.data.customerNotes, 500)
        : null,
      design_json: parsed.data.designJson ?? null,
      ...(previewPath ? { preview_url: previewPath } : {}),
    })
    .eq("id", design.id)
    .eq("session_id", sessionId);

  if (error) {
    return jsonError("No pudimos guardar tu diseño. Intenta de nuevo.", 500);
  }

  return NextResponse.json({ ok: true, designId: design.id });
}

import { type NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { jsonError, serviceUnavailable, tooManyRequests } from "@/lib/api";
import { logAudit } from "@/lib/db/admin";
import { BUCKETS, getPublicUrl, uploadToBucket } from "@/lib/db/storage";
import { requireAdminMutation } from "@/lib/security/admin-auth";
import { isSupabaseConfigured } from "@/lib/security/env";
import {
  checkRateLimit,
  getClientIp,
  RATE_LIMITS,
} from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024;

/**
 * Subida de imágenes de catálogo (bucket público product-images).
 * Solo admin. La imagen se re-encodea con sharp (webp) para neutralizar
 * payloads y normalizar peso.
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = checkRateLimit(`admin-uploads:${ip}`, RATE_LIMITS.uploads);
  if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds);
  if (!isSupabaseConfigured()) {
    return serviceUnavailable("Base de datos no configurada.");
  }
  const admin = await requireAdminMutation(request);
  if (!admin) return jsonError("No autorizado.", 401);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError("Formato de subida inválido.", 400);
  }
  const file = formData.get("file");
  if (!(file instanceof File)) return jsonError("Falta el archivo.", 400);
  if (file.size <= 0 || file.size > MAX_PRODUCT_IMAGE_BYTES) {
    return jsonError("La imagen debe pesar máximo 5 MB.", 413);
  }

  try {
    const sharp = (await import("sharp")).default;
    const buffer = Buffer.from(await file.arrayBuffer());
    const metadata = await sharp(buffer).metadata();
    if (!metadata.format || !["png", "jpeg", "webp"].includes(metadata.format)) {
      return jsonError("Formato no permitido. Usa PNG, JPG o WEBP.", 415);
    }
    const optimized = await sharp(buffer)
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 84 })
      .toBuffer();

    const path = `products/${nanoid(16)}.webp`;
    const uploaded = await uploadToBucket({
      bucket: BUCKETS.productImages,
      path,
      body: optimized,
      contentType: "image/webp",
    });
    if (!uploaded.ok) {
      return jsonError("No pudimos guardar la imagen.", 500);
    }

    const url = getPublicUrl(path);
    if (!url) return jsonError("No pudimos publicar la imagen.", 500);

    await logAudit({
      actor: "admin",
      action: "product_image.upload",
      entityType: "storage_object",
      metadata: { path },
    });
    return NextResponse.json({ ok: true, url });
  } catch {
    return jsonError("El archivo no es una imagen válida.", 415);
  }
}

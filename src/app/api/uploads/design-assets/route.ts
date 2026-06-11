import { type NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import {
  jsonError,
  serviceUnavailable,
  tooManyRequests,
} from "@/lib/api";
import { requireServiceClient } from "@/lib/db/admin";
import { BUCKETS, createSignedUrl, uploadToBucket } from "@/lib/db/storage";
import type { DesignProjectRow } from "@/lib/db/types";
import { getServerEnv, isSupabaseConfigured } from "@/lib/security/env";
import {
  checkRateLimit,
  getClientIp,
  RATE_LIMITS,
} from "@/lib/security/rate-limit";
import { hashSessionId, readSessionId } from "@/lib/security/session";
import { safeFileName } from "@/lib/security/sanitize";
import {
  UPLOAD_MAX_DIMENSION,
  UPLOAD_MIN_DIMENSION,
  UploadMetaSchema,
} from "@/lib/validation/designer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Subida de archivos del diseñador a storage PRIVADO.
 *
 * - MIME real verificado con sharp (no se confía en headers ni extensión).
 * - Solo PNG/JPG/WEBP. SVG y ejecutables quedan rechazados de raíz.
 * - El archivo se renombra en servidor; el nombre original solo queda como
 *   metadata. La ruta incluye hash de sesión: nadie puede adivinar/listar.
 * - Se genera preview optimizada (webp) en bucket privado aparte.
 */

const FORMAT_TO_MIME: Record<string, { mime: string; ext: string }> = {
  png: { mime: "image/png", ext: "png" },
  jpeg: { mime: "image/jpeg", ext: "jpg" },
  webp: { mime: "image/webp", ext: "webp" },
};

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = checkRateLimit(`uploads:${ip}`, RATE_LIMITS.uploads);
  if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds);

  if (!isSupabaseConfigured()) {
    return serviceUnavailable(
      "Las subidas de archivos están en configuración. Intenta más tarde.",
    );
  }

  const sessionId = readSessionId(request);
  if (!sessionId) {
    return jsonError("Tu sesión expiró. Recarga la página.", 401);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError("Formato de subida inválido.", 400);
  }

  const metaParsed = UploadMetaSchema.safeParse({
    designProjectId: formData.get("designProjectId"),
  });
  if (!metaParsed.success) return jsonError("Datos inválidos.", 400);

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return jsonError("Falta el archivo.", 400);
  }

  const maxBytes = getServerEnv().uploadMaxMb * 1024 * 1024;
  if (file.size <= 0 || file.size > maxBytes) {
    return jsonError(
      `El archivo debe pesar entre 1 byte y ${getServerEnv().uploadMaxMb} MB.`,
      413,
    );
  }

  const client = requireServiceClient();

  // El diseño debe pertenecer a la sesión y seguir editable.
  const { data: designData } = await client
    .from("design_projects")
    .select("*")
    .eq("id", metaParsed.data.designProjectId)
    .eq("session_id", sessionId)
    .maybeSingle();
  const design = designData as DesignProjectRow | null;
  if (!design) return jsonError("Diseño no encontrado.", 404);
  if (!["draft", "added_to_cart"].includes(design.status)) {
    return jsonError("Este diseño ya está ligado a un pedido.", 409);
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(await file.arrayBuffer());
  } catch {
    return jsonError("No pudimos leer el archivo.", 400);
  }

  // Validación del contenido REAL (magic bytes) con sharp.
  let width = 0;
  let height = 0;
  let detected: { mime: string; ext: string } | undefined;
  let previewBuffer: Buffer;
  try {
    const sharp = (await import("sharp")).default;
    const metadata = await sharp(buffer).metadata();
    detected = metadata.format ? FORMAT_TO_MIME[metadata.format] : undefined;
    width = metadata.width ?? 0;
    height = metadata.height ?? 0;
    if (!detected) {
      return jsonError(
        "Formato no permitido. Usa PNG, JPG o WEBP (recomendamos PNG).",
        415,
      );
    }
    if (
      width < UPLOAD_MIN_DIMENSION ||
      height < UPLOAD_MIN_DIMENSION ||
      width > UPLOAD_MAX_DIMENSION ||
      height > UPLOAD_MAX_DIMENSION
    ) {
      return jsonError(
        `La imagen debe medir entre ${UPLOAD_MIN_DIMENSION} y ${UPLOAD_MAX_DIMENSION}px por lado.`,
        422,
      );
    }
    previewBuffer = await sharp(buffer)
      .resize({ width: 800, height: 800, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
  } catch {
    return jsonError("El archivo no es una imagen válida.", 415);
  }

  // Renombrado en servidor: el nombre original jamás forma parte de la ruta.
  const sessionHash = hashSessionId(sessionId);
  const fileId = nanoid(14);
  const originalPath = `${sessionHash}/${design.id}/${fileId}.${detected.ext}`;
  const previewPath = `${sessionHash}/${design.id}/${fileId}-preview.webp`;

  const originalUpload = await uploadToBucket({
    bucket: BUCKETS.designAssets,
    path: originalPath,
    body: buffer,
    contentType: detected.mime,
  });
  if (!originalUpload.ok) {
    return jsonError("No pudimos guardar tu archivo. Intenta de nuevo.", 500);
  }
  await uploadToBucket({
    bucket: BUCKETS.designPreviews,
    path: previewPath,
    body: previewBuffer,
    contentType: "image/webp",
  });

  const { data: assetData, error: assetError } = await client
    .from("uploaded_assets")
    .insert({
      design_project_id: design.id,
      original_file_url: originalPath,
      preview_url: previewPath,
      file_name_safe: `${fileId}.${detected.ext}`,
      original_file_name: safeFileName(file.name),
      mime_type: detected.mime,
      width,
      height,
      size_bytes: file.size,
    })
    .select("id")
    .single();
  if (assetError || !assetData) {
    return jsonError("No pudimos registrar tu archivo.", 500);
  }

  await client
    .from("design_projects")
    .update({
      uploaded_asset_url: originalPath,
      preview_url: previewPath,
    })
    .eq("id", design.id)
    .eq("session_id", sessionId);

  // URL firmada de corta duración solo para previsualizar en el editor.
  const signedUrl = await createSignedUrl(
    BUCKETS.designAssets,
    originalPath,
    3600,
  );

  return NextResponse.json({
    ok: true,
    assetId: assetData.id,
    designProjectId: design.id,
    signedUrl,
    width,
    height,
    fileName: safeFileName(file.name),
  });
}

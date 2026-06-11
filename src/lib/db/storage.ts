import "server-only";

import { getServiceClient } from "@/lib/db/admin";

/**
 * Storage privado para archivos del diseñador.
 *
 * - design-assets: archivo ORIGINAL subido por el cliente (privado).
 * - design-previews: previews optimizadas (privado).
 * - product-images: imágenes de catálogo subidas por admin (lectura pública).
 *
 * Los buckets privados solo se leen mediante URLs firmadas generadas aquí,
 * en el servidor. Nunca se listan públicamente.
 */

export const BUCKETS = {
  designAssets: "design-assets",
  designPreviews: "design-previews",
  productImages: "product-images",
} as const;

type BucketName = (typeof BUCKETS)[keyof typeof BUCKETS];

export async function uploadToBucket(params: {
  bucket: BucketName;
  path: string;
  body: Buffer | Uint8Array;
  contentType: string;
}): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  const client = getServiceClient();
  if (!client) return { ok: false, error: "STORAGE_NOT_CONFIGURED" };
  const { error } = await client.storage
    .from(params.bucket)
    .upload(params.path, params.body, {
      contentType: params.contentType,
      upsert: false,
    });
  if (error) {
    return { ok: false, error: "UPLOAD_FAILED" };
  }
  return { ok: true, path: params.path };
}

/** URL firmada de corta duración para buckets privados. */
export async function createSignedUrl(
  bucket: BucketName,
  path: string | null | undefined,
  expiresInSeconds = 3600,
): Promise<string | null> {
  if (!path) return null;
  const client = getServiceClient();
  if (!client) return null;
  const { data, error } = await client.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds);
  if (error) return null;
  return data?.signedUrl ?? null;
}

/** URL pública (solo bucket product-images). */
export function getPublicUrl(path: string): string | null {
  const client = getServiceClient();
  if (!client) return null;
  const { data } = client.storage
    .from(BUCKETS.productImages)
    .getPublicUrl(path);
  return data?.publicUrl ?? null;
}

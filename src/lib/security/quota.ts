import "server-only";

import { requireServiceClient } from "@/lib/db/admin";

/**
 * Cuotas por sesión del Laboratorio.
 *
 * Crear una sesión es gratis: basta pedir una cookie. Sin un techo por sesión,
 * cualquiera puede abrir diseños y subir imágenes en bucle hasta llenar el
 * storage de Supabase y disparar la factura — sin explotar ninguna
 * vulnerabilidad clásica, sólo usando el flujo normal. El rate limit por IP no
 * lo evita: se reinicia con cada instancia serverless y se diluye con IPs
 * rotativas.
 *
 * Los topes son MUY holgados respecto al uso real (un cliente arma una o dos
 * piezas por visita), así que ningún flujo legítimo los toca. Son un techo
 * contra el abuso, no una regla de producto.
 */

/** Diseños que una sesión puede tener abiertos en total. */
export const MAX_DESIGNS_PER_SESSION = 60;
/** Archivos originales por diseño (el diseñador de prendas usa 3 como máximo). */
export const MAX_ASSETS_PER_DESIGN = 15;
/** Archivos originales acumulados por sesión. */
export const MAX_ASSETS_PER_SESSION = 150;

export type QuotaCode =
  | "TOO_MANY_DESIGNS"
  | "TOO_MANY_ASSETS_IN_DESIGN"
  | "TOO_MANY_ASSETS_IN_SESSION";

export const QUOTA_MESSAGES: Record<QuotaCode, string> = {
  TOO_MANY_DESIGNS:
    "Alcanzaste el máximo de diseños abiertos. Termina o elimina alguno para crear otro.",
  TOO_MANY_ASSETS_IN_DESIGN:
    "Este diseño ya tiene el máximo de imágenes permitidas.",
  TOO_MANY_ASSETS_IN_SESSION:
    "Alcanzaste el máximo de imágenes por sesión. Escríbenos por WhatsApp si necesitas subir más.",
};

/**
 * ¿La sesión puede crear otro diseño?
 *
 * Un fallo al contar NO bloquea al cliente: la cuota es una barrera contra
 * abuso, no un control de seguridad del que dependa la integridad de nada.
 */
export async function canCreateDesign(
  sessionId: string,
): Promise<QuotaCode | null> {
  try {
    const client = requireServiceClient();
    const { count, error } = await client
      .from("design_projects")
      .select("id", { count: "exact", head: true })
      .eq("session_id", sessionId);
    if (error) return null;
    return (count ?? 0) >= MAX_DESIGNS_PER_SESSION ? "TOO_MANY_DESIGNS" : null;
  } catch {
    return null;
  }
}

/** ¿La sesión puede subir otro archivo a este diseño? */
export async function canUploadAsset(params: {
  sessionId: string;
  designProjectId: string;
}): Promise<QuotaCode | null> {
  try {
    const client = requireServiceClient();

    const { count: designAssets, error: designError } = await client
      .from("uploaded_assets")
      .select("id", { count: "exact", head: true })
      .eq("design_project_id", params.designProjectId);
    if (designError) return null;
    if ((designAssets ?? 0) >= MAX_ASSETS_PER_DESIGN) {
      return "TOO_MANY_ASSETS_IN_DESIGN";
    }

    // Total por sesión: los diseños de la sesión y sus archivos. Se cuenta con
    // un `in` sobre los ids de la sesión para no depender de un join anidado.
    const { data: designs, error: listError } = await client
      .from("design_projects")
      .select("id")
      .eq("session_id", params.sessionId)
      .limit(MAX_DESIGNS_PER_SESSION);
    if (listError || !designs || designs.length === 0) return null;

    const { count: sessionAssets, error: countError } = await client
      .from("uploaded_assets")
      .select("id", { count: "exact", head: true })
      .in(
        "design_project_id",
        designs.map((row) => (row as { id: string }).id),
      );
    if (countError) return null;
    return (sessionAssets ?? 0) >= MAX_ASSETS_PER_SESSION
      ? "TOO_MANY_ASSETS_IN_SESSION"
      : null;
  } catch {
    return null;
  }
}

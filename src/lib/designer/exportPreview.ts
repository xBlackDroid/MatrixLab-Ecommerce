import type Konva from "konva";

/**
 * Exporta la preview compuesta (mockup + arte) del stage de Konva.
 * IMPORTANTE: la preview NO sustituye al archivo original; es solo una
 * referencia visual. El original + JSON de coordenadas viajan aparte.
 *
 * La preview viaja DENTRO del body JSON del guardado (PATCH /api/designs/[id]),
 * cuyo lector (readJsonBody) corta cualquier cuerpo de más de 256 KB. Por eso
 * se exporta como JPEG ligero (no PNG, que con fotos supera fácil ese límite) y,
 * como último seguro, se descarta si el dataURL aún excede el presupuesto: el
 * diseño se guarda igual, solo sin la miniatura compuesta.
 */

/** Ancho máximo de salida (px). Nunca amplía por encima del lienzo nativo. */
const PREVIEW_MAX_WIDTH = 720;
/** Calidad JPEG: una miniatura nítida cabe en pocas decenas de KB. */
const PREVIEW_QUALITY = 0.72;
/**
 * Presupuesto del dataURL (caracteres ≈ bytes en base64 ASCII). Holgado bajo el
 * límite de 256 KB del body, dejando margen para el resto del payload.
 */
const PREVIEW_BUDGET_CHARS = 180_000;

export function exportStagePreview(stage: Konva.Stage): string | null {
  try {
    const pixelRatio = Math.min(1, PREVIEW_MAX_WIDTH / stage.width());
    const dataUrl = stage.toDataURL({
      mimeType: "image/jpeg",
      quality: PREVIEW_QUALITY,
      pixelRatio: Math.max(pixelRatio, 0.4),
    });
    // La preview es opcional: si aún excede el presupuesto del body, se descarta
    // para que nunca rompa el guardado.
    if (!dataUrl || dataUrl.length > PREVIEW_BUDGET_CHARS) return null;
    return dataUrl;
  } catch {
    // Canvas "tainted" u otro fallo: la preview es opcional.
    return null;
  }
}

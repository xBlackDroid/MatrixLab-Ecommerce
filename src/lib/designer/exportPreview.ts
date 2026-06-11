import type Konva from "konva";

/**
 * Exporta la preview compuesta (mockup + arte) del stage de Konva.
 * IMPORTANTE: la preview NO sustituye al archivo original; es solo una
 * referencia visual. El original + JSON de coordenadas viajan aparte.
 */

const PREVIEW_MAX_WIDTH = 800;

export function exportStagePreview(stage: Konva.Stage): string | null {
  try {
    const pixelRatio = Math.min(1, PREVIEW_MAX_WIDTH / stage.width());
    return stage.toDataURL({
      mimeType: "image/png",
      pixelRatio: Math.max(pixelRatio, 0.4),
    });
  } catch {
    // Canvas "tainted" u otro fallo: la preview es opcional.
    return null;
  }
}

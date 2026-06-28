import { typographyCanvasFont } from "@/lib/designer/school-labels/typography-styles";

/**
 * Genera una preview (dataURL PNG) de la etiqueta escolar usando el Canvas 2D
 * del navegador. Self-contained: sin librerías externas ni CDNs. La preview es
 * opcional y best-effort; si algo falla devuelve null y el guardado sigue.
 *
 * El fondo es automático (el usuario ya no elige color), así que se usa un
 * degradado por defecto agradable.
 */

export interface SchoolPreviewInput {
  firstName: string;
  lastNames: string;
  typographyCode: string;
}

// Degradado por defecto del fondo automático (no depende de paleta del cliente).
const DEFAULT_PREVIEW_SWATCHES = [
  "#f9a8d4",
  "#fcd34d",
  "#86efac",
  "#7dd3fc",
  "#c4b5fd",
];

export function renderSchoolLabelPreview(
  input: SchoolPreviewInput,
): string | null {
  if (typeof document === "undefined") return null;
  try {
    // Lienzo compacto + JPEG: el data URL debe ir MUY por debajo del límite de
    // tamaño del body de la API (256 KB en readJsonBody). Un degradado en JPEG
    // pesa pocas decenas de KB; en PNG pesaría cientos y rompería el guardado.
    const width = 640;
    const height = 360;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const swatches = DEFAULT_PREVIEW_SWATCHES;

    // Fondo degradado automático (por defecto, sin elección de color).
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    swatches.forEach((hex, i) => {
      gradient.addColorStop(i / Math.max(swatches.length - 1, 1), hex);
    });
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Velo sutil para legibilidad.
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.fillRect(0, 0, width, height);

    const nameFont = typographyCanvasFont(input.typographyCode, 84);
    const rawName = (input.firstName.trim() || "Tu nombre").slice(0, 24);
    const displayName = nameFont.uppercase ? rawName.toUpperCase() : rawName;
    const lastNames = input.lastNames.trim().slice(0, 40);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Nombre principal con la tipografía elegida (familia/peso/estilo).
    ctx.fillStyle = "#FFFFFF";
    ctx.font = nameFont.font;
    ctx.shadowColor = "rgba(0,0,0,0.45)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 3;
    ctx.fillText(displayName, width / 2, height / 2 - 30);

    // Apellidos.
    if (lastNames) {
      ctx.font =
        "600 30px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
      ctx.fillText(lastNames.toUpperCase(), width / 2, height / 2 + 40);
    }

    // Código de tipografía (el mismo que el cliente ve en la guía).
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.font =
      "700 22px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.fillText(
      `Tipografía ${input.typographyCode}`,
      width / 2,
      height - 46,
    );

    // JPEG (no PNG): comprime el degradado en pocas decenas de KB.
    return canvas.toDataURL("image/jpeg", 0.82);
  } catch {
    return null;
  }
}

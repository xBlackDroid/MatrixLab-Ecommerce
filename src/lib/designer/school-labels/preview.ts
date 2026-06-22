import { getSchoolColorPalette } from "@/lib/designer/school-labels/color-palettes";

/**
 * Genera una preview (dataURL PNG) de la etiqueta escolar usando el Canvas 2D
 * del navegador. Self-contained: sin librerías externas ni CDNs. La preview es
 * opcional y best-effort; si algo falla devuelve null y el guardado sigue.
 */

export interface SchoolPreviewInput {
  firstName: string;
  lastName1: string;
  lastName2?: string;
  nickname?: string;
  typographyCode: string;
  colorCode: string;
}

export function renderSchoolLabelPreview(
  input: SchoolPreviewInput,
): string | null {
  if (typeof document === "undefined") return null;
  try {
    const width = 800;
    const height = 450;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const palette = getSchoolColorPalette(input.colorCode);
    const swatches =
      palette && palette.swatches.length > 0
        ? palette.swatches
        : ["#6C2BD9", "#22D3EE"];

    // Fondo degradado a partir de la paleta seleccionada.
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    swatches.forEach((hex, i) => {
      gradient.addColorStop(i / Math.max(swatches.length - 1, 1), hex);
    });
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Velo sutil para legibilidad.
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.fillRect(0, 0, width, height);

    const displayName =
      (input.nickname?.trim() || input.firstName.trim() || "Tu nombre").slice(
        0,
        24,
      );
    const lastNames = [input.lastName1, input.lastName2]
      .map((v) => v?.trim())
      .filter(Boolean)
      .join(" ")
      .slice(0, 40);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Nombre principal.
    ctx.fillStyle = "#FFFFFF";
    ctx.font =
      "700 84px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
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

    // Código de tipografía.
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.font =
      "700 22px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillText(
      `Tipografía ${input.typographyCode}`,
      width / 2,
      height - 50,
    );

    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

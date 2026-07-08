import { getTypographyTemplate } from "@/lib/designer/school-labels/templates";

/**
 * Genera una preview (dataURL JPEG) de la etiqueta escolar usando el Canvas 2D
 * del navegador. Self-contained: sin librerías externas ni CDNs. La preview es
 * opcional y best-effort; si algo falla devuelve null y el guardado sigue.
 *
 * Refleja la PLANTILLA de la tipografía elegida (transform del nombre, color
 * por letra / sólido, color de apellidos) sobre una superficie clara, igual que
 * la preview en pantalla. Las fuentes web pueden no estar disponibles en canvas
 * en el primer render: en ese caso cae a una familia segura del sistema, pero
 * el color/transform/composición sí se reflejan.
 */

export interface SchoolPreviewInput {
  firstName: string;
  lastNames: string;
  typographyCode: string;
}

function applyTransform(text: string, transform?: string): string {
  if (transform === "uppercase") return text.toLocaleUpperCase("es");
  if (transform === "capitalize") {
    return text
      .toLocaleLowerCase("es")
      .replace(/(^|\s)\p{L}/gu, (m) => m.toLocaleUpperCase("es"));
  }
  return text;
}

export function renderSchoolLabelPreview(
  input: SchoolPreviewInput,
): string | null {
  if (typeof document === "undefined") return null;
  try {
    // Lienzo compacto + JPEG: el data URL debe ir MUY por debajo del límite de
    // tamaño del body de la API (256 KB en readJsonBody).
    const width = 640;
    const height = 360;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const template = getTypographyTemplate(input.typographyCode);
    const nameStyle = template.nameStyle;
    const lastStyle = template.lastNameStyle;

    // Superficie clara (como las muestras del PDF), con un velo de color suave.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    const veil = ctx.createLinearGradient(0, 0, width, height);
    veil.addColorStop(0, "rgba(248,250,252,1)");
    veil.addColorStop(1, "rgba(243,244,251,1)");
    ctx.fillStyle = veil;
    ctx.fillRect(0, 0, width, height);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const rawName = (input.firstName.trim() || "Tu nombre").slice(0, 24);
    const name = applyTransform(rawName, nameStyle.textTransform);
    const rawLast = input.lastNames.trim().slice(0, 40);
    const last = applyTransform(rawLast, lastStyle.textTransform);

    const weight = nameStyle.fontWeight ?? 800;
    const fontStyle = nameStyle.fontStyle === "italic" ? "italic " : "";
    const nameSize = Math.min(96, name.length > 9 ? 760 / name.length : 88);
    ctx.font = `${fontStyle}${weight} ${nameSize}px ${nameStyle.fontFamily}`;

    ctx.shadowColor = "rgba(0,0,0,0.18)";
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;

    const nameY = last ? height / 2 - 34 : height / 2 - 12;
    const mode = nameStyle.colorMode ?? "solid";

    if (
      (mode === "rainbowLetters" || mode === "pastelLetters") &&
      nameStyle.palette?.length
    ) {
      drawMultiColorText(ctx, name, width / 2, nameY, nameStyle.palette);
    } else {
      ctx.fillStyle = nameStyle.color ?? "#1f2937";
      ctx.fillText(name, width / 2, nameY);
    }

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    if (last) {
      const lastWeight = lastStyle.fontWeight ?? 700;
      ctx.font = `${lastWeight} 34px ${lastStyle.fontFamily}`;
      ctx.fillStyle = lastStyle.color ?? "#1f2937";
      ctx.fillText(last, width / 2, height / 2 + 44);
    }

    // Código de tipografía (el mismo que el cliente ve en la guía).
    ctx.font =
      "700 22px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    ctx.fillStyle = "rgba(100,116,139,0.95)";
    ctx.fillText(`Tipografía ${input.typographyCode}`, width / 2, height - 40);

    // JPEG: comprime la superficie en pocas decenas de KB.
    return canvas.toDataURL("image/jpeg", 0.82);
  } catch {
    return null;
  }
}

/** Dibuja un texto con cada letra de un color de la paleta, centrado. */
function drawMultiColorText(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  y: number,
  palette: readonly string[],
): void {
  const widths = Array.from(text).map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0);
  let x = centerX - total / 2;
  const prevAlign = ctx.textAlign;
  ctx.textAlign = "left";
  Array.from(text).forEach((ch, i) => {
    ctx.fillStyle = palette[i % palette.length]!;
    ctx.fillText(ch, x, y);
    x += widths[i]!;
  });
  ctx.textAlign = prevAlign;
}

import type { CSSProperties } from "react";
import {
  getSchoolColorPalette,
  type SchoolColorPalette,
} from "@/lib/designer/school-labels/color-palettes";

// Variaciones de estilo para reflejar la tipografía seleccionada en la preview
// (mientras no existan los thumbnails reales recortados del PDF).
const TYPO_STYLES: Array<CSSProperties> = [
  { fontFamily: "Georgia, serif", fontWeight: 700 },
  { fontFamily: "'Brush Script MT', cursive", fontStyle: "italic" },
  { fontFamily: "'Trebuchet MS', sans-serif", fontWeight: 700, letterSpacing: "0.04em" },
  { fontFamily: "'Courier New', monospace", fontWeight: 700, textTransform: "uppercase" },
  { fontFamily: "Palatino, 'Palatino Linotype', serif", fontStyle: "italic", fontWeight: 600 },
  { fontFamily: "'Comic Sans MS', 'Comic Sans', cursive", fontWeight: 700 },
  { fontFamily: "Verdana, sans-serif", fontWeight: 700, letterSpacing: "0.06em" },
];

function typographyStyle(code: string): CSSProperties {
  const n = parseInt(code, 10) || 0;
  return TYPO_STYLES[n % TYPO_STYLES.length]!;
}

/**
 * Vista previa estilo sticker escolar. No genera todavía todas las etiquetas;
 * muestra una tarjeta bonita con el nombre, apellidos, código de tipografía y
 * la paleta de color seleccionada, manteniendo la estética MatrixLab.
 */

export interface SchoolLabelPreviewProps {
  firstName: string;
  lastName1: string;
  lastName2?: string;
  nickname?: string;
  typographyCode: string;
  colorCode: string;
  theme?: string;
}

function paletteGradient(palette: SchoolColorPalette | null): string {
  if (!palette || palette.swatches.length === 0) {
    return "linear-gradient(135deg, #6C2BD9 0%, #22D3EE 100%)";
  }
  const stops = palette.swatches;
  return `linear-gradient(135deg, ${stops
    .map(
      (hex, i) =>
        `${hex} ${Math.round((i / Math.max(stops.length - 1, 1)) * 100)}%`,
    )
    .join(", ")})`;
}

export default function SchoolLabelPreview({
  firstName,
  lastName1,
  lastName2,
  nickname,
  typographyCode,
  colorCode,
  theme,
}: SchoolLabelPreviewProps) {
  const palette = getSchoolColorPalette(colorCode);
  const displayName = nickname?.trim() || firstName.trim() || "Tu nombre";
  const lastNames = [lastName1, lastName2]
    .map((v) => v?.trim())
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex flex-col gap-3">
      <div
        className="relative overflow-hidden rounded-3xl p-1 shadow-glow-violet"
        style={{ background: paletteGradient(palette) }}
      >
        <div className="rounded-[1.35rem] bg-ml-bg/85 p-6 backdrop-blur">
          {/* Etiqueta principal estilo sticker */}
          <div
            className="relative mx-auto flex aspect-[16/9] w-full max-w-md flex-col items-center justify-center overflow-hidden rounded-2xl px-6 text-center"
            style={{ background: paletteGradient(palette) }}
          >
            <div className="absolute inset-0 bg-black/10" />
            {/* Decoración de fondo estilo sticker (puntos suaves). */}
            <div
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  "radial-gradient(rgba(255,255,255,0.55) 1.5px, transparent 1.5px)",
                backgroundSize: "16px 16px",
              }}
              aria-hidden
            />
            <p
              className="relative text-3xl tracking-tight text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)] sm:text-4xl"
              style={typographyStyle(typographyCode)}
            >
              {displayName}
            </p>
            {lastNames && (
              <p className="relative mt-1 text-sm font-semibold uppercase tracking-[0.2em] text-white/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]">
                {lastNames}
              </p>
            )}
            <div className="relative mt-3 flex flex-wrap items-center justify-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/85 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-ml-bg">
                Tipografía {typographyCode}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-black/35 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                Color {colorCode}
              </span>
            </div>
          </div>

          {/* Mini stickers de muestra para dar sensación de planilla */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            {["Útiles", "Lonchera", "Cuaderno"].map((tagLabel) => (
              <div
                key={tagLabel}
                className="flex flex-col items-center justify-center rounded-xl px-2 py-2 text-center"
                style={{ background: paletteGradient(palette) }}
              >
                <span
                  className="text-sm text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)]"
                  style={typographyStyle(typographyCode)}
                >
                  {displayName}
                </span>
                <span className="text-[9px] font-semibold uppercase tracking-wide text-white/85">
                  {tagLabel}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pie con paleta + temática */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-ml-white/45">Paleta</span>
          <span className="font-semibold text-ml-white/85">
            {palette ? `${palette.code} · ${palette.name}` : colorCode}
          </span>
          {palette && (
            <span className="flex overflow-hidden rounded-full border border-white/20">
              {palette.swatches.map((hex) => (
                <span
                  key={hex}
                  className="h-4 w-4"
                  style={{ backgroundColor: hex }}
                  aria-hidden
                />
              ))}
            </span>
          )}
        </div>
        {theme?.trim() && (
          <div className="flex items-center gap-2">
            <span className="text-ml-white/45">Temática</span>
            <span className="font-semibold text-ml-white/85">{theme}</span>
          </div>
        )}
      </div>
    </div>
  );
}

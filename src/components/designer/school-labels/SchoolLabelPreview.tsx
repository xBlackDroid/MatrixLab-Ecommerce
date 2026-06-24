"use client";

import type { CSSProperties } from "react";
import { getSchoolColorPalette } from "@/lib/designer/school-labels/color-palettes";
import { getBackgroundForPalette } from "@/lib/designer/school-labels/background-presets";

/**
 * Vista previa de la etiqueta escolar. Compone el fondo automático (según la
 * paleta), el nombre con un estilo que evoca la tipografía elegida, los
 * apellidos, los códigos visibles (tipografía + color), la imagen subida (si
 * existe) y una planilla de mini-etiquetas (útiles / lonchera / cuaderno).
 */

const TYPO_STYLES: Array<CSSProperties> = [
  { fontFamily: "Georgia, serif", fontWeight: 800 },
  { fontFamily: "'Brush Script MT', cursive", fontStyle: "italic" },
  { fontFamily: "'Trebuchet MS', sans-serif", fontWeight: 800, letterSpacing: "0.03em" },
  { fontFamily: "'Courier New', monospace", fontWeight: 800, textTransform: "uppercase" },
  { fontFamily: "Palatino, 'Palatino Linotype', serif", fontStyle: "italic", fontWeight: 700 },
  { fontFamily: "'Comic Sans MS', 'Comic Sans', cursive", fontWeight: 700 },
  { fontFamily: "Verdana, sans-serif", fontWeight: 800, letterSpacing: "0.05em" },
];

function typographyStyle(code: string): CSSProperties {
  const n = parseInt(code, 10) || 0;
  return TYPO_STYLES[n % TYPO_STYLES.length]!;
}

export interface SchoolLabelPreviewProps {
  firstName: string;
  lastNames: string;
  typographyCode: string;
  colorCode: string;
  theme?: string;
  /** Imagen subida por el cliente (object URL o URL firmada). */
  imageUrl?: string | null;
}

export default function SchoolLabelPreview({
  firstName,
  lastNames: lastNamesProp,
  typographyCode,
  colorCode,
  theme,
  imageUrl,
}: SchoolLabelPreviewProps) {
  const palette = getSchoolColorPalette(colorCode);
  const bg = getBackgroundForPalette(colorCode);
  const displayName = firstName.trim() || "Tu nombre";
  const lastNames = lastNamesProp.trim();

  return (
    <div className="flex flex-col gap-3">
      <div
        className="relative overflow-hidden rounded-3xl p-1.5"
        style={{ background: bg.gradient }}
      >
        <div className="rounded-[1.3rem] bg-white p-4 sm:p-5">
          {/* Etiqueta principal estilo sticker con el fondo automático. */}
          <div
            className="relative flex min-h-[150px] w-full flex-col items-center justify-center overflow-hidden rounded-2xl px-5 py-6 text-center"
            style={{ background: bg.gradient }}
          >
            <div className="absolute inset-0 bg-black/15" aria-hidden />
            <div
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  "radial-gradient(rgba(255,255,255,0.55) 1.5px, transparent 1.5px)",
                backgroundSize: "16px 16px",
              }}
              aria-hidden
            />

            {imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt="Tu imagen"
                className="relative mb-2 h-16 w-16 rounded-full border-2 border-white/80 object-cover shadow-lg"
              />
            )}

            <p
              className="relative text-3xl tracking-tight text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)] sm:text-4xl"
              style={typographyStyle(typographyCode)}
            >
              {displayName}
            </p>
            {lastNames && (
              <p className="relative mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">
                {lastNames}
              </p>
            )}

            <div className="relative mt-3 flex flex-wrap items-center justify-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-800">
                Tipografía {typographyCode}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                Color {colorCode}
              </span>
            </div>
          </div>

          {/* Mini etiquetas tipo planilla (útiles / lonchera / cuaderno). */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            {["Útiles", "Lonchera", "Cuaderno"].map((tagLabel) => (
              <div
                key={tagLabel}
                className="relative flex flex-col items-center justify-center overflow-hidden rounded-xl px-2 py-2 text-center"
                style={{ background: bg.gradient }}
              >
                <span className="absolute inset-0 bg-black/10" aria-hidden />
                <span
                  className="relative truncate text-sm text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]"
                  style={typographyStyle(typographyCode)}
                >
                  {displayName}
                </span>
                <span className="relative text-[9px] font-semibold uppercase tracking-wide text-white/85">
                  {tagLabel}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pie: paleta + fondo + temática. */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Paleta</span>
          <span className="font-semibold text-slate-700">
            {palette ? `${palette.code} · ${palette.name}` : colorCode}
          </span>
          {palette && (
            <span className="flex overflow-hidden rounded-full border border-slate-200">
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
        <span className="flex items-center gap-1.5 text-slate-400">
          <span
            className="h-3 w-3 rounded-full"
            style={{ background: bg.gradient }}
            aria-hidden
          />
          {bg.label}
        </span>
        {theme?.trim() && (
          <div className="flex w-full items-center gap-2 border-t border-slate-100 pt-2">
            <span className="text-slate-400">Temática</span>
            <span className="font-semibold text-slate-700">{theme}</span>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { getBackgroundForPalette } from "@/lib/designer/school-labels/background-presets";
import { getSchoolTypography } from "@/lib/designer/school-labels/typography-options";
import { typographyFallbackStyle } from "@/lib/designer/school-labels/typography-styles";

/**
 * Vista previa de la etiqueta escolar.
 *
 * Las tipografías del catálogo son MUESTRAS RASTER del PDF (no fuentes
 * instaladas), así que la preview NO finge una fuente: muestra la imagen real
 * de la muestra seleccionada como "Estilo elegido" (`/images/school-labels/
 * typography/0NN.webp`) y, aparte, el nombre/apellidos del cliente en una
 * composición limpia sobre un fondo automático. El código elegido se ve claro
 * (TIPOGRAFÍA 0NN). Si la imagen no carga, cae a un texto estilizado de
 * respaldo (nunca se rompe).
 */

export interface SchoolLabelPreviewProps {
  firstName: string;
  lastNames: string;
  typographyCode: string;
  theme?: string;
  /** Imagen subida por el cliente (object URL o URL firmada). */
  imageUrl?: string | null;
}

export default function SchoolLabelPreview({
  firstName,
  lastNames: lastNamesProp,
  typographyCode,
  theme,
  imageUrl,
}: SchoolLabelPreviewProps) {
  // Fondo automático por defecto (el usuario ya no elige color).
  const bg = getBackgroundForPalette(null);
  const displayName = firstName.trim() || "Tu nombre";
  const lastNames = lastNamesProp.trim();

  return (
    <div className="flex flex-col gap-3">
      <div
        className="relative overflow-hidden rounded-3xl p-1.5"
        style={{ background: bg.gradient }}
      >
        <div className="flex flex-col gap-3 rounded-[1.3rem] bg-white p-4 sm:p-5">
          {/* Estilo elegido: la MUESTRA REAL del catálogo (imagen del PDF). */}
          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wide text-violet-400">
                Estilo elegido
              </span>
              <span className="inline-flex items-center rounded-full bg-violet-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                Tipografía {typographyCode}
              </span>
            </div>

            {/* key={typographyCode}: remonta al cambiar de muestra y reinicia
                el estado de carga (para que cada código intente su imagen). */}
            <TypographySample
              key={typographyCode}
              code={typographyCode}
              fallbackName={displayName}
            />
          </div>

          {/* Composición limpia con el nombre del cliente sobre el fondo
              automático. No finge ser la fuente de la muestra. */}
          <div
            className="relative flex min-h-[140px] w-full flex-col items-center justify-center overflow-hidden rounded-2xl px-5 py-6 text-center"
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

            <p className="relative text-3xl font-extrabold tracking-tight text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)] sm:text-4xl">
              {displayName}
            </p>
            {lastNames && (
              <p className="relative mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">
                {lastNames}
              </p>
            )}
          </div>

          {/* Mini etiquetas tipo planilla (útiles / lonchera / cuaderno). */}
          <div className="grid grid-cols-3 gap-2">
            {["Útiles", "Lonchera", "Cuaderno"].map((tagLabel) => (
              <div
                key={tagLabel}
                className="relative flex flex-col items-center justify-center overflow-hidden rounded-xl px-2 py-2 text-center"
                style={{ background: bg.gradient }}
              >
                <span className="absolute inset-0 bg-black/10" aria-hidden />
                <span className="relative truncate text-sm font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
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

      {/* Pie: solo temática opcional (sin paleta ni códigos de color). */}
      {theme?.trim() && (
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs">
          <span className="text-slate-400">Temática</span>
          <span className="font-semibold text-slate-700">{theme}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Muestra real de la tipografía elegida. Se monta con `key={code}` para que al
 * cambiar de código vuelva a intentar cargar su imagen. Si la imagen falla, cae
 * a un texto estilizado de respaldo.
 */
function TypographySample({
  code,
  fallbackName,
}: {
  code: string;
  fallbackName: string;
}) {
  const sampleImage = getSchoolTypography(code)?.previewImage ?? null;
  const [imgOk, setImgOk] = useState(true);

  return (
    <div className="flex min-h-[88px] items-center justify-center rounded-xl bg-slate-50 px-3 py-2">
      {sampleImage && imgOk ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={sampleImage}
          alt={`Muestra de la tipografía ${code}`}
          loading="lazy"
          onError={() => setImgOk(false)}
          className="max-h-24 w-full object-contain"
        />
      ) : (
        // Respaldo si la muestra no carga: nombre estilizado.
        <span
          className="px-1 text-center text-2xl leading-tight"
          style={typographyFallbackStyle(code)}
        >
          {fallbackName}
        </span>
      )}
    </div>
  );
}

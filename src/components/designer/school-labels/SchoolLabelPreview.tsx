"use client";

import { useState } from "react";
import { getBackgroundForPalette } from "@/lib/designer/school-labels/background-presets";
import { getSchoolTypography } from "@/lib/designer/school-labels/typography-options";
import SchoolLabelTemplate from "@/components/designer/school-labels/SchoolLabelTemplate";

/**
 * Vista previa de la etiqueta escolar.
 *
 * La PREVIEW PRINCIPAL es una etiqueta REAL construida con la plantilla de la
 * tipografía elegida (nombre + apellidos reales con su estilo, color, layout y
 * decoración) — ver SchoolLabelTemplate. La imagen de muestra del PDF NO es la
 * etiqueta final: solo se muestra pequeña, abajo, como "Referencia de estilo".
 *
 * También se muestran mini etiquetas (útiles/lonchera/cuaderno) con el mismo
 * estilo, el chip TIPOGRAFÍA 0NN, la imagen subida (si existe) y un fondo
 * automático (el usuario ya no elige color).
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
  lastNames,
  typographyCode,
  theme,
  imageUrl,
}: SchoolLabelPreviewProps) {
  // Fondo automático por defecto (el usuario ya no elige color).
  const bg = getBackgroundForPalette(null);

  return (
    <div className="flex flex-col gap-3">
      <div
        className="relative overflow-hidden rounded-3xl p-1.5"
        style={{ background: bg.gradient }}
      >
        <div className="flex flex-col gap-3 rounded-[1.3rem] bg-white p-4 sm:p-5">
          {/* Encabezado: chip con el código elegido. */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wide text-violet-400">
              Tu etiqueta
            </span>
            <span className="inline-flex items-center rounded-full bg-violet-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
              Tipografía {typographyCode}
            </span>
          </div>

          {/* PREVIEW PRINCIPAL: etiqueta real con el nombre del cliente en el
              estilo de la tipografía elegida. key={code} remonta al cambiar. */}
          <div className="rounded-2xl border border-slate-200 p-1.5 shadow-sm">
            <SchoolLabelTemplate
              key={typographyCode}
              firstName={firstName}
              lastNames={lastNames}
              typographyCode={typographyCode}
              imageUrl={imageUrl}
              variant="hero"
            />
          </div>

          {/* Mini etiquetas tipo planilla, con el mismo estilo. */}
          <div className="grid grid-cols-3 gap-2">
            {["Útiles", "Lonchera", "Cuaderno"].map((tagLabel) => (
              <div key={tagLabel} className="flex flex-col gap-1">
                <SchoolLabelTemplate
                  firstName={firstName}
                  lastNames=""
                  typographyCode={typographyCode}
                  variant="mini"
                  className="border border-slate-200"
                />
                <span className="text-center text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                  {tagLabel}
                </span>
              </div>
            ))}
          </div>

          {/* Referencia secundaria: la muestra real del PDF, pequeña. NO es la
              etiqueta final, solo una guía visual del estilo. */}
          <TypographyReference code={typographyCode} />
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
 * Muestra real del PDF como REFERENCIA secundaria (pequeña). Si la imagen no
 * carga, simplemente se oculta: la etiqueta real de arriba ya es la preview.
 */
function TypographyReference({ code }: { code: string }) {
  const sampleImage = getSchoolTypography(code)?.previewImage ?? null;
  const [imgOk, setImgOk] = useState(true);

  if (!sampleImage || !imgOk) return null;

  return (
    <details className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-3 py-2">
      <summary className="cursor-pointer list-none text-[10px] font-bold uppercase tracking-wide text-slate-400">
        Referencia de estilo (muestra original) ▾
      </summary>
      <div className="mt-2 flex items-center justify-center rounded-xl bg-white p-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={code}
          src={sampleImage}
          alt={`Muestra original de la tipografía ${code}`}
          loading="lazy"
          onError={() => setImgOk(false)}
          className="max-h-16 w-full object-contain opacity-90"
        />
      </div>
    </details>
  );
}

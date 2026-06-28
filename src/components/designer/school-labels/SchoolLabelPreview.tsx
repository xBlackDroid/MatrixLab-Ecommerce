"use client";

import { useState } from "react";
import { Info, Minus, Move, Plus, RotateCcw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { getBackgroundForPalette } from "@/lib/designer/school-labels/background-presets";
import { getSchoolTypography } from "@/lib/designer/school-labels/typography-options";
import SchoolLabelTemplate, {
  DEFAULT_IMAGE_TRANSFORM,
  IMAGE_SCALE_MAX,
  IMAGE_SCALE_MIN,
  type ImageTransform,
} from "@/components/designer/school-labels/SchoolLabelTemplate";

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
  /** Posición/escala de la imagen dentro de la etiqueta (editable). */
  imageTransform?: ImageTransform;
  onImageTransformChange?: (next: ImageTransform) => void;
  /** Velo claro de legibilidad (auto). ON por defecto cuando hay imagen. */
  readabilityOverlay?: boolean;
  onReadabilityOverlayChange?: (next: boolean) => void;
}

export default function SchoolLabelPreview({
  firstName,
  lastNames,
  typographyCode,
  theme,
  imageUrl,
  imageTransform,
  onImageTransformChange,
  readabilityOverlay = true,
  onReadabilityOverlayChange,
}: SchoolLabelPreviewProps) {
  // Fondo automático por defecto (el usuario ya no elige color).
  const bg = getBackgroundForPalette(null);
  const transform = imageTransform ?? DEFAULT_IMAGE_TRANSFORM;

  function bumpScale(delta: number) {
    if (!onImageTransformChange) return;
    const scale = Math.min(
      IMAGE_SCALE_MAX,
      Math.max(IMAGE_SCALE_MIN, Number((transform.scale + delta).toFixed(2))),
    );
    onImageTransformChange({ ...transform, scale });
  }

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
              imageTransform={transform}
              onImageTransformChange={onImageTransformChange}
              readabilityOverlay={readabilityOverlay}
              variant="hero"
            />
          </div>

          {/* Controles de la imagen subida (mover / escalar / restablecer +
              velo de legibilidad automático). */}
          {imageUrl && onImageTransformChange && (
            <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                  <Move className="h-3.5 w-3.5 text-violet-500" aria-hidden />
                  Mover imagen (arrástrala)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => bumpScale(-0.1)}
                    aria-label="Reducir tamaño de la imagen"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 transition hover:border-violet-300 hover:text-violet-600"
                  >
                    <Minus className="h-3.5 w-3.5" aria-hidden />
                  </button>
                  <span className="w-9 text-center text-[11px] font-semibold tabular-nums text-slate-500">
                    {Math.round(transform.scale * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => bumpScale(0.1)}
                    aria-label="Aumentar tamaño de la imagen"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 transition hover:border-violet-300 hover:text-violet-600"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => onImageTransformChange(DEFAULT_IMAGE_TRANSFORM)}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-violet-300 hover:text-violet-600"
                  >
                    <RotateCcw className="h-3 w-3" aria-hidden />
                    Restablecer
                  </button>
                </div>
              </div>

              {/* Toggle discreto: velo de legibilidad (ON por defecto). */}
              {onReadabilityOverlayChange && (
                <button
                  type="button"
                  role="switch"
                  aria-checked={readabilityOverlay}
                  onClick={() => onReadabilityOverlayChange(!readabilityOverlay)}
                  className="inline-flex items-center gap-2 self-start text-[11px] font-semibold text-slate-500"
                >
                  <Sparkles className="h-3.5 w-3.5 text-violet-500" aria-hidden />
                  Contraste automático
                  <span
                    className={cn(
                      "relative inline-flex h-4 w-7 items-center rounded-full transition",
                      readabilityOverlay ? "bg-violet-500" : "bg-slate-300",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-3 w-3 rounded-full bg-white shadow transition",
                        readabilityOverlay ? "translate-x-3.5" : "translate-x-0.5",
                      )}
                    />
                  </span>
                </button>
              )}
            </div>
          )}

          {/* Nota de referencia: la preview es orientativa; el diseño final se
              ajusta al estilo de la tipografía elegida. Estilo suave (lavanda). */}
          <p className="flex items-start gap-2 rounded-xl bg-violet-50 px-3 py-2 text-[11px] leading-relaxed text-violet-700/90">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-400" aria-hidden />
            Vista previa de referencia. El diseño final se ajustará al estilo
            elegido en Tipografía.
          </p>

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

"use client";

import { Sparkles } from "lucide-react";
import { getBackgroundForPalette } from "@/lib/designer/school-labels/background-presets";
import { getSchoolColorPalette } from "@/lib/designer/school-labels/color-palettes";
import { cn } from "@/lib/utils";

/**
 * Muestra el fondo automático elegido a partir de la paleta. El cliente NO
 * diseña el fondo: lo sugerimos por él (regla de la guía). Solo informa y
 * tranquiliza ("generado automáticamente según tu paleta").
 */

interface AutoBackgroundPreviewProps {
  colorCode: string | null;
  className?: string;
  compact?: boolean;
}

export default function AutoBackgroundPreview({
  colorCode,
  className,
  compact = false,
}: AutoBackgroundPreviewProps) {
  const bg = getBackgroundForPalette(colorCode);
  const palette = colorCode ? getSchoolColorPalette(colorCode) : null;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm",
        className,
      )}
    >
      <div
        className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl"
        style={{ background: bg.gradient }}
        aria-hidden
      >
        <span className="absolute inset-0 grid place-items-center text-white/90">
          <Sparkles className="h-5 w-5 drop-shadow" aria-hidden />
        </span>
      </div>
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
          Fondo {bg.label}
        </p>
        {!compact && (
          <p className="mt-0.5 text-xs text-slate-500">{bg.description}</p>
        )}
        <p className="mt-0.5 text-[11px] font-medium text-violet-500">
          Generado automáticamente{palette ? ` según ${palette.name}` : ""}
        </p>
      </div>
    </div>
  );
}

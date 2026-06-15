"use client";

import { AlertTriangle, Ruler } from "lucide-react";
import type { PrintAreaCm } from "@/lib/designer/print-sizes";
import { formatCm } from "@/lib/designer/print-sizes";

/**
 * Muestra el área máxima de impresión (cm) de la zona activa y el tamaño
 * real del diseño seleccionado, con aviso si excede el área.
 */
export default function PrintSizeHelper({
  areaCm,
  selectedCm,
  withinBounds,
}: {
  areaCm: PrintAreaCm;
  selectedCm: { width: number; height: number } | null;
  withinBounds: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 text-sm">
      <p className="flex items-center gap-2 text-ml-white/70">
        <Ruler className="h-4 w-4 text-ml-cyan" aria-hidden />
        Área máxima: {formatCm(areaCm.width)} × {formatCm(areaCm.height)}
      </p>
      {selectedCm && (
        <p className="mt-1.5 text-xs text-ml-white/55">
          Diseño seleccionado: {formatCm(selectedCm.width)} ×{" "}
          {formatCm(selectedCm.height)}
        </p>
      )}
      {!withinBounds && (
        <p className="mt-2 flex items-start gap-1.5 text-xs text-ml-coral">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          Tu diseño se sale del área imprimible. Ajusta tamaño o posición; si
          continúas, lo revisaremos antes de producir.
        </p>
      )}
    </div>
  );
}

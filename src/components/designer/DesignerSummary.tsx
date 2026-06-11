"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { ProductTypeConfig } from "@/lib/designer/types";
import { formatPrice } from "@/lib/utils";

interface DesignerSummaryProps {
  config: ProductTypeConfig;
  colorLabel: string;
  selectedSize: string | null;
  zoneLabel: string;
  unitPrice: number | null;
  hasImage: boolean;
  withinBounds: boolean;
  notes: string;
  onNotesChange: (notes: string) => void;
}

/** Resumen del diseño + notas del cliente. */
export default function DesignerSummary({
  config,
  colorLabel,
  selectedSize,
  zoneLabel,
  unitPrice,
  hasImage,
  withinBounds,
  notes,
  onNotesChange,
}: DesignerSummaryProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="text-ml-white/60">Producto</span>
          <span className="font-semibold">{config.publicName}</span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-ml-white/60">Color</span>
          <span>{colorLabel}</span>
        </div>
        {selectedSize && (
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-ml-white/60">Talla</span>
            <span>{selectedSize}</span>
          </div>
        )}
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-ml-white/60">Zona</span>
          <span>{zoneLabel}</span>
        </div>
        {unitPrice !== null && (
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/10 pt-3">
            <span className="text-ml-white/60">Precio</span>
            <span className="text-lg font-bold">{formatPrice(unitPrice)}</span>
          </div>
        )}
      </div>

      {hasImage && (
        <p
          className={
            withinBounds
              ? "flex items-start gap-2 rounded-xl border border-ml-cyan/30 bg-ml-cyan/10 px-3.5 py-2.5 text-xs text-ml-cyan"
              : "flex items-start gap-2 rounded-xl border border-ml-coral/30 bg-ml-coral/10 px-3.5 py-2.5 text-xs text-ml-coral"
          }
        >
          {withinBounds ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          ) : (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          )}
          {withinBounds
            ? "Tu diseño está dentro del área imprimible."
            : "Tu diseño se sale del área imprimible. Ajusta tamaño o posición para continuar."}
        </p>
      )}

      <div>
        <label
          htmlFor="designer-notes"
          className="mb-1.5 block text-sm font-medium text-ml-white/70"
        >
          Notas para el laboratorio (opcional)
        </label>
        <textarea
          id="designer-notes"
          rows={3}
          maxLength={500}
          value={notes}
          onChange={(event) => onNotesChange(event.target.value)}
          placeholder="Ej. quiero el diseño un poco más arriba, o en tono más vivo…"
          className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-ml-white outline-none transition placeholder:text-ml-white/35 focus:border-ml-cyan"
        />
      </div>
    </div>
  );
}

"use client";

import { Crosshair, RotateCcw, Trash2 } from "lucide-react";
import type { ProductTypeConfig } from "@/lib/designer/types";
import type { PrintZone } from "@/lib/db/types";
import { cn } from "@/lib/utils";

interface DesignToolbarProps {
  config: ProductTypeConfig;
  zoneId: PrintZone;
  scale: number;
  rotation: number;
  hasImage: boolean;
  onZoneChange: (zone: PrintZone) => void;
  onScaleChange: (scale: number) => void;
  onRotationChange: (rotation: number) => void;
  onCenter: () => void;
  onReset: () => void;
  onRemoveImage: () => void;
}

/** Herramientas: zona, tamaño, rotación, centrar, restablecer. */
export default function DesignToolbar({
  config,
  zoneId,
  scale,
  rotation,
  hasImage,
  onZoneChange,
  onScaleChange,
  onRotationChange,
  onCenter,
  onReset,
  onRemoveImage,
}: DesignToolbarProps) {
  return (
    <div className="flex flex-col gap-5">
      {config.zones.length > 1 && (
        <div>
          <p className="mb-2 text-sm font-medium text-ml-white/70">Zona</p>
          <div className="flex gap-2">
            {config.zones.map((zone) => (
              <button
                key={zone.id}
                type="button"
                onClick={() => onZoneChange(zone.id)}
                className={cn(
                  "flex-1 rounded-full border px-3 py-2 text-sm transition",
                  zoneId === zone.id
                    ? "border-ml-cyan bg-ml-cyan/10 text-ml-cyan"
                    : "border-white/15 bg-white/5 text-ml-white/70 hover:border-white/30",
                )}
              >
                {zone.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={cn(!hasImage && "pointer-events-none opacity-40")}>
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="designer-scale" className="text-sm font-medium text-ml-white/70">
            Tamaño
          </label>
          <span className="text-xs text-ml-white/50">
            {Math.round(scale * 100)}%
          </span>
        </div>
        <input
          id="designer-scale"
          type="range"
          min={0.1}
          max={3}
          step={0.01}
          value={scale}
          onChange={(event) => onScaleChange(Number(event.target.value))}
          className="w-full accent-ml-violet"
        />
      </div>

      <div className={cn(!hasImage && "pointer-events-none opacity-40")}>
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="designer-rotation" className="text-sm font-medium text-ml-white/70">
            Rotación
          </label>
          <span className="text-xs text-ml-white/50">{Math.round(rotation)}°</span>
        </div>
        <input
          id="designer-rotation"
          type="range"
          min={-180}
          max={180}
          step={1}
          value={rotation}
          onChange={(event) => onRotationChange(Number(event.target.value))}
          className="w-full accent-ml-violet"
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={onCenter}
          disabled={!hasImage}
          className="flex flex-col items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2 py-3 text-xs text-ml-white/75 transition hover:border-ml-violet/50 disabled:opacity-40"
        >
          <Crosshair className="h-4.5 w-4.5" aria-hidden />
          Centrar
        </button>
        <button
          type="button"
          onClick={onReset}
          disabled={!hasImage}
          className="flex flex-col items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2 py-3 text-xs text-ml-white/75 transition hover:border-ml-violet/50 disabled:opacity-40"
        >
          <RotateCcw className="h-4.5 w-4.5" aria-hidden />
          Restablecer
        </button>
        <button
          type="button"
          onClick={onRemoveImage}
          disabled={!hasImage}
          className="flex flex-col items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2 py-3 text-xs text-ml-white/75 transition hover:border-ml-coral/50 hover:text-ml-coral disabled:opacity-40"
        >
          <Trash2 className="h-4.5 w-4.5" aria-hidden />
          Quitar
        </button>
      </div>
    </div>
  );
}

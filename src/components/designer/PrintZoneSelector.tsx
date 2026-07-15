"use client";

import type { StageZone } from "@/lib/designer/product-views";
import { cn } from "@/lib/utils";

/** Selector de zona imprimible (Frente / Espalda). */
export default function PrintZoneSelector({
  zones,
  activeZone,
  onChange,
  counts,
}: {
  zones: StageZone[];
  activeZone: "front" | "back";
  onChange: (zone: "front" | "back") => void;
  counts?: Record<string, number>;
}) {
  if (zones.length <= 1) return null;
  return (
    <div data-testid="zone-selector">
      <p className="mb-2 text-sm font-medium text-ml-white/70">Zona</p>
      <div className="flex gap-2">
        {zones.map((zone) => {
          const count = counts?.[zone.id] ?? 0;
          return (
            <button
              key={zone.id}
              type="button"
              onClick={() => onChange(zone.id)}
              className={cn(
                "min-h-11 flex-1 rounded-full border px-3 py-2 text-sm transition",
                activeZone === zone.id
                  ? "border-ml-cyan bg-ml-cyan/10 text-ml-cyan"
                  : "border-white/15 bg-white/5 text-ml-white/70 hover:border-white/30",
              )}
            >
              {zone.label}
              {count > 0 && (
                <span className="ml-1.5 text-xs text-ml-white/50">({count})</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { LASER_TEMPLATES } from "@/lib/designer/laser-config";
import { cn } from "@/lib/utils";

/** Selector de plantilla base del laboratorio láser. */
export default function LaserTemplateSelector({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-ml-white/70">Plantilla base</p>
      <div className="grid grid-cols-2 gap-2">
        {LASER_TEMPLATES.map((tpl) => (
          <button
            key={tpl.id}
            type="button"
            onClick={() => onSelect(tpl.id)}
            className={cn(
              "rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition",
              selectedId === tpl.id
                ? "border-ml-cyan bg-ml-cyan/10 text-ml-cyan"
                : "border-white/10 bg-white/5 text-ml-white/70 hover:border-white/25",
            )}
          >
            {tpl.label}
          </button>
        ))}
      </div>
    </div>
  );
}

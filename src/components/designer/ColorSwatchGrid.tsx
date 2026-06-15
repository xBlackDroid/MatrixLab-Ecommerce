"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import type { ProductColor } from "@/lib/designer/color-palettes";
import { groupColors } from "@/lib/designer/color-palettes";
import { cn } from "@/lib/utils";

/**
 * Selector de color agrupado (Etapa 2). Mantiene el branding oscuro/premium
 * de MatrixLab: NO usa el layout blanco de las imágenes de referencia.
 * Soporta hex o textura (textureUrl) y marca el color seleccionado.
 */
export default function ColorSwatchGrid({
  colors,
  selectedId,
  onSelect,
}: {
  colors: ProductColor[];
  selectedId: string | null;
  onSelect: (color: ProductColor) => void;
}) {
  const sections = groupColors(colors);
  // Por defecto todas las secciones abiertas (mejor descubribilidad).
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  return (
    <div className="flex flex-col gap-4">
      {sections.map((section) => {
        const isCollapsed = collapsed[section.group] ?? false;
        return (
          <div key={section.group}>
            <button
              type="button"
              onClick={() =>
                setCollapsed((c) => ({
                  ...c,
                  [section.group]: !isCollapsed,
                }))
              }
              className="flex w-full items-center justify-between text-left text-xs font-semibold uppercase tracking-wide text-ml-white/55"
            >
              {section.label}
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition",
                  isCollapsed && "-rotate-90",
                )}
                aria-hidden
              />
            </button>
            {!isCollapsed && (
              <div className="mt-2.5 flex flex-wrap gap-2.5">
                {section.colors.map((color) => {
                  const active = color.id === selectedId;
                  return (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => onSelect(color)}
                      title={color.label}
                      aria-label={color.label}
                      aria-pressed={active}
                      className={cn(
                        "relative h-9 w-9 rounded-full border-2 transition",
                        active
                          ? "border-ml-cyan ring-2 ring-ml-cyan/30"
                          : "border-white/20 hover:border-white/50",
                      )}
                      style={
                        color.textureUrl
                          ? {
                              backgroundImage: `url(${color.textureUrl})`,
                              backgroundSize: "cover",
                            }
                          : { backgroundColor: color.hex }
                      }
                    >
                      {active && (
                        <Check
                          className="absolute inset-0 m-auto h-4 w-4 drop-shadow"
                          style={{
                            color: isLight(color.hex) ? "#0B0F19" : "#F8F9FA",
                          }}
                          aria-hidden
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
      {selectedId && (
        <p className="text-xs text-ml-white/50">
          {colors.find((c) => c.id === selectedId)?.label}
        </p>
      )}
    </div>
  );
}

/** Heurística simple de luminancia para elegir el color del check. */
function isLight(hex?: string): boolean {
  if (!hex) return false;
  const n = hex.replace("#", "");
  if (n.length < 6) return false;
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
}

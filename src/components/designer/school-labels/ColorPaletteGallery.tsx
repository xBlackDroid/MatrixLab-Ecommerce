"use client";

import { Check } from "lucide-react";
import {
  groupSchoolColorPalettes,
  type SchoolColorPalette,
} from "@/lib/designer/school-labels/color-palettes";
import { cn } from "@/lib/utils";

/**
 * Galería de combinaciones de color — fiel a las páginas "Elige tu combinación
 * de colores" de la guía: tarjetas blancas con código de 3 letras en morado,
 * nombre y los swatches redondeados. El fondo automático sigue funcionando
 * internamente (se sugiere al elegir la paleta), pero no se explica en la
 * tarjeta para mantenerla simple.
 */

interface ColorPaletteGalleryProps {
  selected: string | null;
  onSelect: (code: string) => void;
}

export default function ColorPaletteGallery({
  selected,
  onSelect,
}: ColorPaletteGalleryProps) {
  const groups = groupSchoolColorPalettes();

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <div key={group.group}>
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-violet-700">
            {group.label}
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-2">
            {group.palettes.map((p) => (
              <PaletteCard
                key={p.code}
                palette={p}
                active={selected === p.code}
                onSelect={() => onSelect(p.code)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PaletteCard({
  palette,
  active,
  onSelect,
}: {
  palette: SchoolColorPalette;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      aria-label={`Elegir paleta ${palette.code} ${palette.name}`}
      className={cn(
        "flex flex-col gap-2.5 rounded-2xl border bg-white p-4 text-left shadow-sm transition",
        active
          ? "border-cyan-400 ring-2 ring-cyan-300"
          : "border-slate-200 hover:border-violet-300 hover:shadow-md",
      )}
    >
      <div className="flex items-center gap-2.5">
        <span className="text-xl font-extrabold tracking-wide text-violet-500">
          {palette.code}
        </span>
        <span className="text-sm font-semibold text-slate-600">
          {palette.name}
        </span>
        {active && (
          <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-cyan-400 text-white">
            <Check className="h-3 w-3" aria-hidden />
          </span>
        )}
      </div>

      {/* Swatches redondeados como en la guía. */}
      <div className="flex gap-1.5">
        {palette.swatches.map((hex) => (
          <span
            key={hex}
            className="h-9 flex-1 rounded-lg shadow-inner"
            style={{ backgroundColor: hex }}
            aria-hidden
          />
        ))}
      </div>
    </button>
  );
}

"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { Check } from "lucide-react";
import {
  groupSchoolTypographyByPage,
  type SchoolTypographyOption,
} from "@/lib/designer/school-labels/typography-options";
import { cn } from "@/lib/utils";

/**
 * Galería de tipografías — fiel a las páginas "Elige tu tipografía" de la guía.
 * Cada tarjeta muestra la muestra real recortada de la guía (`.webp`) y, si la
 * imagen no carga, un fallback con el nombre escrito por el cliente en una
 * fuente y color alegres. Nunca se rompe.
 */

interface TypographyGalleryProps {
  firstName: string;
  selected: string | null;
  onSelect: (code: string) => void;
}

// Fuente + color alegres para el fallback (mientras imita las muestras del PDF).
const FALLBACK_STYLES: Array<CSSProperties> = [
  { fontFamily: "Georgia, serif", fontWeight: 800, color: "#ef476f" },
  { fontFamily: "'Brush Script MT', cursive", fontStyle: "italic", color: "#118ab2" },
  { fontFamily: "'Trebuchet MS', sans-serif", fontWeight: 800, letterSpacing: "0.03em", color: "#06a77d" },
  { fontFamily: "'Courier New', monospace", fontWeight: 800, textTransform: "uppercase", color: "#8338ec" },
  { fontFamily: "Palatino, 'Palatino Linotype', serif", fontStyle: "italic", fontWeight: 700, color: "#f4711e" },
  { fontFamily: "'Comic Sans MS', 'Comic Sans', cursive", fontWeight: 700, color: "#ff5da2" },
  { fontFamily: "Verdana, sans-serif", fontWeight: 800, letterSpacing: "0.06em", color: "#3a86ff" },
];

function fallbackStyle(code: string): CSSProperties {
  const n = parseInt(code, 10) || 0;
  return FALLBACK_STYLES[n % FALLBACK_STYLES.length]!;
}

export default function TypographyGallery({
  firstName,
  selected,
  onSelect,
}: TypographyGalleryProps) {
  const groups = groupSchoolTypographyByPage();
  const previewName = firstName.trim() || "Nombre";

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <div key={group.page}>
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-violet-700">
            Parte {group.page} de 6
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {group.options.map((opt) => (
              <TypographyCard
                key={opt.code}
                option={opt}
                previewName={previewName}
                active={selected === opt.code}
                onSelect={() => onSelect(opt.code)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TypographyCard({
  option,
  previewName,
  active,
  onSelect,
}: {
  option: SchoolTypographyOption;
  previewName: string;
  active: boolean;
  onSelect: () => void;
}) {
  const [imgOk, setImgOk] = useState(false);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      aria-label={`Elegir tipografía ${option.code}`}
      className={cn(
        "group relative flex aspect-[4/3] flex-col items-center justify-center overflow-hidden rounded-2xl border bg-white p-2 shadow-sm transition",
        active
          ? "border-cyan-400 ring-2 ring-cyan-300"
          : "border-slate-200 hover:border-violet-300 hover:shadow-md",
      )}
    >
      <span className="absolute left-1.5 top-1.5 z-10 rounded-md bg-slate-900/75 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white">
        {option.code}
      </span>
      {active && (
        <span className="absolute right-1.5 top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-400 text-white shadow">
          <Check className="h-3 w-3" aria-hidden />
        </span>
      )}

      {/* Fallback con el nombre estilizado (visible por defecto). */}
      <span
        className="px-1 text-center text-lg leading-tight"
        style={fallbackStyle(option.code)}
      >
        {previewName}
      </span>

      {/* Muestra real recortada de la guía; se sobrepone solo si carga. */}
      {option.previewImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={option.previewImage}
          alt={`Tipografía ${option.code}`}
          loading="lazy"
          onLoad={() => setImgOk(true)}
          onError={() => setImgOk(false)}
          className={cn(
            "absolute inset-0 h-full w-full bg-white object-contain p-1.5 transition-opacity",
            imgOk ? "opacity-100" : "opacity-0",
          )}
        />
      )}

      {/* Pista de acción al pasar el cursor / seleccionar. */}
      <span
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/55 to-transparent px-2 py-1 text-[10px] font-bold text-white opacity-0 transition-opacity",
          active ? "opacity-100" : "group-hover:opacity-100",
        )}
      >
        {active ? "Tipografía elegida ✓" : "Elegir esta tipografía"}
      </span>
    </button>
  );
}

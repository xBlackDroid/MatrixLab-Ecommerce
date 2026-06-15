"use client";

import Image from "next/image";
import { Circle, Loader2, RectangleHorizontal, Square, Upload } from "lucide-react";
import { formatCm } from "@/lib/designer/print-sizes";
import { cn } from "@/lib/utils";

type Shape = "square" | "circle" | "rectangle";

/** Panel de control del modo repetición automática. */
export default function RepeatLayoutSheet({
  hasImage,
  previewUrl,
  uploading,
  shape,
  widthCm,
  heightCm,
  count,
  minCm,
  maxCm,
  onUploadClick,
  onShapeChange,
  onSizeChange,
}: {
  hasImage: boolean;
  previewUrl: string | null;
  uploading: boolean;
  shape: Shape;
  widthCm: number;
  heightCm: number;
  count: number;
  minCm: number;
  maxCm: number;
  onUploadClick: () => void;
  onShapeChange: (shape: Shape) => void;
  onSizeChange: (widthCm: number, heightCm: number) => void;
}) {
  const shapes: Array<{ id: Shape; label: string; icon: typeof Square }> = [
    { id: "square", label: "Cuadrado", icon: Square },
    { id: "circle", label: "Círculo", icon: Circle },
    { id: "rectangle", label: "Rectángulo", icon: RectangleHorizontal },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-sm font-medium text-ml-white/70">Tu imagen</p>
        <button
          type="button"
          onClick={onUploadClick}
          disabled={uploading}
          className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-white/15 bg-white/5 px-4 py-5 text-center transition hover:border-ml-violet/50 disabled:opacity-40"
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-ml-violet" aria-hidden />
          ) : previewUrl ? (
            <span className="relative h-14 w-14 overflow-hidden rounded-lg bg-white/10">
              <Image src={previewUrl} alt="Imagen base" fill unoptimized className="object-contain" />
            </span>
          ) : (
            <Upload className="h-6 w-6 text-ml-violet" aria-hidden />
          )}
          <span className="text-sm font-semibold">
            {hasImage ? "Cambiar imagen" : "Subir imagen"}
          </span>
          <span className="text-xs text-ml-white/50">PNG, JPG o WEBP</span>
        </button>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-ml-white/70">Forma</p>
        <div className="grid grid-cols-3 gap-2">
          {shapes.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onShapeChange(s.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-2.5 text-xs font-medium transition",
                shape === s.id
                  ? "border-ml-cyan bg-ml-cyan/10 text-ml-cyan"
                  : "border-white/10 bg-white/5 text-ml-white/70 hover:border-white/25",
              )}
            >
              <s.icon className="h-5 w-5" aria-hidden />
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-3.5">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-sm font-medium text-ml-white/70">
            {shape === "rectangle" ? "Ancho" : "Tamaño"}
          </span>
          <span className="text-xs text-ml-white/50">{formatCm(widthCm)}</span>
        </div>
        <input
          type="range"
          min={minCm}
          max={maxCm}
          step={0.5}
          value={widthCm}
          onChange={(e) =>
            onSizeChange(
              Number(e.target.value),
              shape === "rectangle" ? heightCm : Number(e.target.value),
            )
          }
          className="w-full accent-ml-violet"
        />
        {shape === "rectangle" && (
          <>
            <div className="mb-1.5 mt-3 flex items-center justify-between">
              <span className="text-sm font-medium text-ml-white/70">Alto</span>
              <span className="text-xs text-ml-white/50">{formatCm(heightCm)}</span>
            </div>
            <input
              type="range"
              min={minCm}
              max={maxCm}
              step={0.5}
              value={heightCm}
              onChange={(e) => onSizeChange(widthCm, Number(e.target.value))}
              className="w-full accent-ml-violet"
            />
          </>
        )}
      </div>

      <p className="rounded-xl border border-ml-cyan/20 bg-ml-cyan/5 px-3.5 py-2.5 text-sm text-ml-cyan">
        Caben <strong>{count}</strong> piezas en tu hoja carta.
      </p>
    </div>
  );
}

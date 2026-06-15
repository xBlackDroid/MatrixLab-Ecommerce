"use client";

import Image from "next/image";
import { Loader2, Trash2, Upload } from "lucide-react";
import type { SheetPiece } from "@/lib/designer/types";
import { formatCm } from "@/lib/designer/print-sizes";
import { cn } from "@/lib/utils";

/** Panel de control del modo planilla libre (hasta N imágenes). */
export default function FreeLayoutSheet({
  pieces,
  selectedId,
  uploading,
  maxImages,
  minPieceCm,
  maxPieceCm,
  onUploadClick,
  onSelect,
  onDelete,
  onResize,
}: {
  pieces: SheetPiece[];
  selectedId: string | null;
  uploading: boolean;
  maxImages: number;
  minPieceCm: number;
  maxPieceCm: number;
  onUploadClick: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onResize: (id: string, widthCm: number) => void;
}) {
  const selected = pieces.find((p) => p.id === selectedId) ?? null;
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-sm font-medium text-ml-white/70">
          Imágenes{" "}
          <span className="text-ml-white/45">
            ({pieces.length}/{maxImages})
          </span>
        </p>
        <button
          type="button"
          onClick={onUploadClick}
          disabled={uploading || pieces.length >= maxImages}
          className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-white/15 bg-white/5 px-4 py-5 text-center transition hover:border-ml-violet/50 disabled:opacity-40"
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-ml-violet" aria-hidden />
          ) : (
            <Upload className="h-6 w-6 text-ml-violet" aria-hidden />
          )}
          <span className="text-sm font-semibold">Agregar imagen</span>
          <span className="text-xs text-ml-white/50">PNG, JPG o WEBP</span>
        </button>
      </div>

      {pieces.length > 0 && (
        <ul className="flex flex-col gap-2">
          {pieces.map((piece) => (
            <li
              key={piece.id}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-3 py-2 transition",
                selectedId === piece.id
                  ? "border-ml-cyan bg-ml-cyan/10"
                  : "border-white/10 bg-white/5",
              )}
            >
              <button
                type="button"
                onClick={() => onSelect(piece.id)}
                className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
              >
                <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md bg-white/10">
                  <Image
                    src={piece.localUrl}
                    alt={piece.fileName}
                    fill
                    unoptimized
                    className="object-contain"
                  />
                </span>
                <span className="truncate text-xs text-ml-white/75">
                  {formatCm(piece.widthCm)} × {formatCm(piece.heightCm)}
                </span>
              </button>
              <button
                type="button"
                onClick={() => onDelete(piece.id)}
                aria-label="Eliminar"
                className="rounded-md p-1.5 text-ml-white/50 transition hover:text-ml-coral"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-3.5">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-sm font-medium text-ml-white/70">
              Tamaño de la pieza
            </span>
            <span className="text-xs text-ml-white/50">
              {formatCm(selected.widthCm)}
            </span>
          </div>
          <input
            type="range"
            min={minPieceCm}
            max={maxPieceCm}
            step={0.5}
            value={selected.widthCm}
            onChange={(e) => onResize(selected.id, Number(e.target.value))}
            className="w-full accent-ml-violet"
          />
        </div>
      )}

      <p className="text-xs text-ml-white/45">
        Arrastra cada imagen en el lienzo. Mantenemos una separación mínima de
        2 cm entre piezas para una producción limpia.
      </p>
    </div>
  );
}

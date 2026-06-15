"use client";

import Image from "next/image";
import { Copy, Crosshair, Trash2 } from "lucide-react";
import type { PlacedAsset } from "@/lib/designer/types";
import { cn } from "@/lib/utils";

/**
 * Panel de capas: lista las imágenes de la zona activa y permite
 * seleccionar, centrar, duplicar (si no excede el máximo) y eliminar.
 */
export default function AssetLayerPanel({
  assets,
  selectedId,
  maxAssets,
  onSelect,
  onCenter,
  onDuplicate,
  onDelete,
}: {
  assets: PlacedAsset[];
  selectedId: string | null;
  maxAssets: number;
  onSelect: (id: string) => void;
  onCenter: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (assets.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-white/15 px-3.5 py-3 text-xs text-ml-white/45">
        Aún no hay imágenes en esta zona. Sube una para empezar.
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-2">
      {assets.map((asset) => (
        <li
          key={asset.id}
          className={cn(
            "flex items-center gap-3 rounded-xl border px-3 py-2 transition",
            selectedId === asset.id
              ? "border-ml-cyan bg-ml-cyan/10"
              : "border-white/10 bg-white/5",
          )}
        >
          <button
            type="button"
            onClick={() => onSelect(asset.id)}
            className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
          >
            <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md bg-white/10">
              <Image
                src={asset.localUrl}
                alt={asset.fileName}
                fill
                unoptimized
                className="object-contain"
              />
            </span>
            <span className="truncate text-xs text-ml-white/75">
              {asset.fileName}
            </span>
          </button>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => onCenter(asset.id)}
              aria-label="Centrar"
              className="rounded-md p-1.5 text-ml-white/50 transition hover:text-ml-cyan"
            >
              <Crosshair className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => onDuplicate(asset.id)}
              disabled={assets.length >= maxAssets}
              aria-label="Duplicar"
              className="rounded-md p-1.5 text-ml-white/50 transition hover:text-ml-violet disabled:opacity-30"
            >
              <Copy className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => onDelete(asset.id)}
              aria-label="Eliminar"
              className="rounded-md p-1.5 text-ml-white/50 transition hover:text-ml-coral"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

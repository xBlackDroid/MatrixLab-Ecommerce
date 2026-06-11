"use client";

import Link from "next/link";
import { Shirt, Sparkles, ShoppingBag } from "lucide-react";
import type { BaseColorOption, ProductTypeConfig } from "@/lib/designer/types";
import { PRODUCT_TYPE_CONFIGS } from "@/lib/designer/printAreas";
import { cn } from "@/lib/utils";

const TYPE_ICONS = {
  playera: Shirt,
  gorra: Sparkles,
  tote: ShoppingBag,
} as const;

interface ProductSelectorProps {
  config: ProductTypeConfig;
  baseColor: BaseColorOption;
  selectedSize: string | null;
  onColorChange: (color: BaseColorOption) => void;
  onSizeChange: (size: string) => void;
}

/** Panel izquierdo: producto base, color y talla. */
export default function ProductSelector({
  config,
  baseColor,
  selectedSize,
  onColorChange,
  onSizeChange,
}: ProductSelectorProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-2 text-sm font-medium text-ml-white/70">Producto</p>
        <div className="grid grid-cols-3 gap-2">
          {Object.values(PRODUCT_TYPE_CONFIGS).map((type) => {
            const Icon = TYPE_ICONS[type.id];
            const active = type.id === config.id;
            return (
              <Link
                key={type.id}
                href={`/tienda/disenador/${type.id}`}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-medium transition",
                  active
                    ? "border-ml-cyan bg-ml-cyan/10 text-ml-cyan"
                    : "border-white/10 bg-white/5 text-ml-white/70 hover:border-white/25",
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
                {type.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-ml-white/70">Color base</p>
        <div className="flex flex-wrap gap-2.5">
          {config.baseColors.map((color) => (
            <button
              key={color.id}
              type="button"
              onClick={() => onColorChange(color)}
              aria-label={`Color ${color.label}`}
              title={color.label}
              className={cn(
                "h-10 w-10 rounded-full border-2 transition",
                baseColor.id === color.id
                  ? "border-ml-cyan ring-2 ring-ml-cyan/30"
                  : "border-white/20 hover:border-white/50",
              )}
              style={{ backgroundColor: color.hex }}
            />
          ))}
        </div>
        <p className="mt-2 text-xs text-ml-white/50">{baseColor.label}</p>
      </div>

      {config.sizeRequired && config.sizes.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-ml-white/70">Talla</p>
          <div className="flex flex-wrap gap-2">
            {config.sizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => onSizeChange(size)}
                className={cn(
                  "min-w-11 rounded-full border px-3 py-2 text-sm transition",
                  selectedSize === size
                    ? "border-ml-cyan bg-ml-cyan/10 text-ml-cyan"
                    : "border-white/15 bg-white/5 text-ml-white/75 hover:border-white/30",
                )}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

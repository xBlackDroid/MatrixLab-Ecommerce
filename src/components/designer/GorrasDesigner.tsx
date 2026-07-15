"use client";

import { useState } from "react";
import GarmentDesigner from "@/components/designer/GarmentDesigner";
import type { DesignerProductType, ProductWithVariants } from "@/lib/db/types";
import { cn } from "@/lib/utils";

/**
 * Diseñador de gorras: UNA sola entrada pública (/tienda/disenador/gorras) con
 * selector interno "Tipo de gorra". Cambiar el tipo cambia mockup, paleta de
 * colores y producto base (vía remount de GarmentDesigner con nuevo key).
 *
 * Reutiliza GarmentDesigner sin duplicar lógica; cada tipo sigue teniendo su
 * propio producto base para el carrito (gorra-trucker / gorra-clasica).
 */

type GorraType = Extract<DesignerProductType, "gorra-trucker" | "gorra-clasica">;

const OPTIONS: Array<{ id: GorraType; label: string }> = [
  { id: "gorra-trucker", label: "Gorra trucker" },
  { id: "gorra-clasica", label: "Gorra clásica ajustable" },
];

export default function GorrasDesigner({
  truckerProduct,
  clasicaProduct,
  truckerPreviewOnly = false,
  clasicaPreviewOnly = false,
}: {
  truckerProduct: ProductWithVariants | null;
  clasicaProduct: ProductWithVariants | null;
  /** true si el producto de ese tipo es respaldo de previsualización. */
  truckerPreviewOnly?: boolean;
  clasicaPreviewOnly?: boolean;
}) {
  const [type, setType] = useState<GorraType>(
    truckerProduct ? "gorra-trucker" : "gorra-clasica",
  );
  const product = type === "gorra-trucker" ? truckerProduct : clasicaProduct;
  const previewOnly =
    type === "gorra-trucker" ? truckerPreviewOnly : clasicaPreviewOnly;

  return (
    <div className="flex flex-col gap-6">
      <div className="glass rounded-2xl px-5 py-4">
        <h2 className="mb-3 flex items-center gap-2.5 text-sm font-bold text-ml-white">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ml-cyan/15 text-xs font-bold text-ml-cyan">
            1
          </span>
          Elige tu prenda: tipo de gorra
        </h2>
        <div className="inline-flex flex-wrap gap-2">
          {OPTIONS.map((opt) => {
            const available =
              opt.id === "gorra-trucker" ? truckerProduct : clasicaProduct;
            return (
              <button
                key={opt.id}
                type="button"
                disabled={!available}
                onClick={() => setType(opt.id)}
                className={cn(
                  "min-h-11 rounded-full border px-5 py-2.5 text-sm font-semibold transition",
                  type === opt.id
                    ? "border-ml-cyan bg-ml-cyan/10 text-ml-cyan"
                    : "border-white/15 bg-white/5 text-ml-white/75 hover:border-white/30",
                  !available && "opacity-40",
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {product ? (
        <GarmentDesigner
          key={type}
          productType={type}
          product={product}
          previewOnly={previewOnly}
          showStepOne={false}
        />
      ) : (
        <div className="glass rounded-3xl p-12 text-center text-ml-white/60">
          Este tipo de gorra está en preparación. Elige otro tipo o escríbenos
          por WhatsApp.
        </div>
      )}
    </div>
  );
}

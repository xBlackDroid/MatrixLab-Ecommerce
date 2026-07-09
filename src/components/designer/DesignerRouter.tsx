"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import type { DesignerKind, DesignerProductType, ProductWithVariants } from "@/lib/db/types";

/**
 * Router del Laboratorio: carga SOLO el diseñador necesario vía dynamic import
 * (ssr:false). Así Konva y cada editor viven en chunks separados y nunca
 * entran al bundle de la landing ni de la tienda.
 */

const loading = () => (
  <div className="flex min-h-[50vh] items-center justify-center">
    <Loader2 className="h-9 w-9 animate-spin text-ml-violet" aria-hidden />
  </div>
);

const GarmentDesigner = dynamic(
  () => import("@/components/designer/GarmentDesigner"),
  { ssr: false, loading },
);
const SheetDesigner = dynamic(
  () => import("@/components/designer/sheets/SheetDesigner"),
  { ssr: false, loading },
);
const LaserDesigner = dynamic(
  () => import("@/components/designer/laser/LaserDesigner"),
  { ssr: false, loading },
);

export default function DesignerRouter({
  kind,
  productType,
  product,
  previewOnly = false,
}: {
  kind: DesignerKind;
  productType: DesignerProductType;
  product: ProductWithVariants;
  /**
   * true cuando el producto base NO está en el catálogo real y `product` es el
   * respaldo de previsualización: el editor abre completo pero guardar/agregar
   * al carrito quedan deshabilitados con aviso claro (solo cotización).
   */
  previewOnly?: boolean;
}) {
  if (kind === "sheet") {
    return (
      <SheetDesigner
        productType={productType}
        product={product}
        previewOnly={previewOnly}
      />
    );
  }
  if (kind === "laser") {
    return <LaserDesigner product={product} previewOnly={previewOnly} />;
  }
  return (
    <GarmentDesigner
      productType={productType}
      product={product}
      previewOnly={previewOnly}
    />
  );
}

import type { ProductRow, ProductVariantRow } from "@/lib/db/types";
import type { InventoryPricing } from "@/lib/store/inventory-pricing";

/**
 * Bloques comerciales del inventario admin (MatrixLab Wear, Stickers, …).
 *
 * Sin dependencias de servidor: lo usan la tabla de cliente (filtro y
 * etiquetas) y la lectura de servidor. La CLASIFICACIÓN por handle de
 * categoría vive en `inventory.ts` (servidor), que reutiliza las constantes
 * canónicas del catálogo; aquí sólo están los nombres y la forma de la fila.
 */
export const INVENTORY_BLOCKS = [
  { id: "wear", label: "MatrixLab Wear" },
  { id: "stickers", label: "MatrixLab Stickers" },
  { id: "tumbler", label: "MatrixLab Tumbler" },
  { id: "3d", label: "MatrixLab 3D" },
  { id: "laser", label: "MatrixLab Láser" },
  { id: "escolar", label: "Regreso a Clases" },
] as const;

export type InventoryBlockId = (typeof INVENTORY_BLOCKS)[number]["id"];

/** Etiqueta para variantes sin categoría o con una categoría no mapeada. */
export const NO_INVENTORY_BLOCK_LABEL = "Sin bloque";

export function inventoryBlockLabel(block: InventoryBlockId | null): string {
  return (
    INVENTORY_BLOCKS.find((item) => item.id === block)?.label ??
    NO_INVENTORY_BLOCK_LABEL
  );
}

/** Metadatos de presentación por fila, resueltos en servidor. */
export interface InventoryDisplay {
  /** Nombre del producto ya reparado (mojibake); null si la variante es huérfana. */
  productTitle: string | null;
  categoryHandle: string | null;
  categoryTitle: string | null;
  block: InventoryBlockId | null;
  blockLabel: string;
  /** Foto pública (color de la variante si existe); null → "Sin imagen". */
  thumbnail: string | null;
}

export type InventoryRow = ProductVariantRow & {
  products: Pick<ProductRow, "title" | "handle"> | null;
  display: InventoryDisplay;
  /** Precio efectivo (variante ?? base) y su origen, resuelto en servidor. */
  pricing: InventoryPricing;
};

/** Minúsculas y sin acentos: "laser" encuentra "MatrixLab Láser". */
export function normalizeInventorySearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/** Texto que recorre la búsqueda: producto, variante, SKU, bloque y categoría. */
export function inventorySearchText(row: InventoryRow): string {
  return normalizeInventorySearch([
    row.display.productTitle ?? row.products?.title ?? "",
    row.title,
    row.sku ?? "",
    row.display.blockLabel,
    row.display.categoryTitle ?? "",
    row.display.categoryHandle ?? "",
  ].join(" "));
}

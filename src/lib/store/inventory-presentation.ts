import "server-only";

import type { CategoryRow, ProductRow, ProductVariantRow } from "@/lib/db/types";
import {
  inventoryBlockLabel,
  NO_INVENTORY_BLOCK_LABEL,
  type InventoryBlockId,
  type InventoryDisplay,
  type InventoryRow,
} from "@/lib/store/commercial-blocks";
import { MATRIXLAB_3D_CATEGORY_HANDLE } from "@/lib/store/matrixlab-3d";
import { MATRIXLAB_STICKERS_CATEGORY_HANDLE } from "@/lib/store/matrixlab-stickers";
import {
  catalogImageOf,
  LEGACY_TUMBLER_PARENT_HANDLE,
  presentCatalogProduct,
  READY_TO_WEAR_CATEGORY_HANDLES,
  TUMBLER_PARENT_HANDLE,
  TUMBLER_SUBCATEGORY_HANDLES,
} from "@/lib/store/products";
import { readyWearVariantImage } from "@/lib/store/ready-wear-colors";
import { repairMojibake } from "@/lib/store/text";

/**
 * Presentación del inventario admin (bloque comercial + miniatura). Sin
 * acceso a base: recibe filas ya leídas, así que también la usa la vista de
 * muestra `/preview/inventario` sin tocar Supabase.
 */

/**
 * Bloque comercial de una variante, por el handle REAL de la categoría de su
 * producto. Sólo cuentan los handles canónicos: nunca se adivina por el título
 * (un "UV Sticker" de `wraps-glow-finish` es MatrixLab Tumbler, no Stickers).
 * Las sublíneas de Tumbler ocultas en la navegación pública siguen aquí: el
 * admin conserva su inventario.
 */
const INVENTORY_BLOCK_BY_CATEGORY: ReadonlyMap<string, InventoryBlockId> = new Map([
  ...READY_TO_WEAR_CATEGORY_HANDLES.map((h) => [h, "wear"] as const),
  [MATRIXLAB_STICKERS_CATEGORY_HANDLE, "stickers"],
  ["imanes", "stickers"],
  [TUMBLER_PARENT_HANDLE, "tumbler"],
  [LEGACY_TUMBLER_PARENT_HANDLE, "tumbler"],
  ...TUMBLER_SUBCATEGORY_HANDLES.map((h) => [h, "tumbler"] as const),
  [MATRIXLAB_3D_CATEGORY_HANDLE, "3d"],
  ["grabado-laser", "laser"],
  ["etiquetas-escolares", "escolar"],
]);

export function inventoryBlockOf(
  categoryHandle: string | null | undefined,
): InventoryBlockId | null {
  if (!categoryHandle) return null;
  return INVENTORY_BLOCK_BY_CATEGORY.get(categoryHandle) ?? null;
}

type InventoryCategoryJoin = Pick<CategoryRow, "handle" | "title">;
type InventoryProductJoin = Pick<ProductRow, "title" | "handle" | "images"> & {
  categories: InventoryCategoryJoin | InventoryCategoryJoin[] | null;
};
/** Fila tal cual llega del Data API (relaciones LEFT JOIN: pueden ser null). */
export type InventoryEntry = ProductVariantRow & {
  products: InventoryProductJoin | InventoryProductJoin[] | null;
};

/** Relación many-to-one: el Data API la entrega como objeto (o null). */
function single<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

/** Sólo rutas públicas propias o URLs https; cualquier otra cosa → sin imagen. */
function safeThumbnail(src: string | null | undefined): string | null {
  if (typeof src !== "string") return null;
  const value = src.trim();
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  return /^https:\/\/[^\s"'<>]+$/.test(value) ? value : null;
}

type PresentedInventoryProduct = Omit<InventoryDisplay, "thumbnail"> & {
  handle: string;
  image: string | null;
};

/**
 * Metadatos de presentación por fila, en servidor. Reutiliza el mismo
 * pipeline que la vitrina y el carrito (`presentCatalogProduct`, foto por
 * color de `readyWearVariantImage`). La presentación del producto se calcula
 * UNA vez por producto en la lectura: tallas y colores comparten el resultado
 * sin repetir consultas al filesystem. No altera stock, estado ni orden.
 */
export function presentInventoryEntries(entries: InventoryEntry[]): InventoryRow[] {
  const cache = new Map<string, PresentedInventoryProduct>();
  return entries.map((entry) => {
    const { products, ...variant } = entry;
    const product = single(products);
    if (!product) {
      return {
        ...variant,
        products: null,
        display: {
          productTitle: null,
          categoryHandle: null,
          categoryTitle: null,
          block: null,
          blockLabel: NO_INVENTORY_BLOCK_LABEL,
          thumbnail: null,
        },
      };
    }

    let presented = cache.get(variant.product_id);
    if (!presented) {
      const category = single(product.categories);
      const shown = presentCatalogProduct({
        title: product.title,
        handle: product.handle,
        description: null,
        images: Array.isArray(product.images) ? product.images : [],
      } as ProductRow);
      const block = inventoryBlockOf(category?.handle);
      presented = {
        handle: product.handle,
        productTitle: shown.title,
        categoryHandle: category?.handle ?? null,
        categoryTitle: category?.title ? repairMojibake(category.title) : null,
        block,
        blockLabel: inventoryBlockLabel(block),
        image: catalogImageOf(shown),
      };
      cache.set(variant.product_id, presented);
    }

    const { handle, image, ...display } = presented;
    return {
      ...variant,
      products: { title: display.productTitle ?? product.title, handle },
      display: {
        ...display,
        thumbnail: safeThumbnail(
          readyWearVariantImage(handle, variant.color) ?? image,
        ),
      },
    };
  });
}


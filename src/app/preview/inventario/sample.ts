import "server-only";

import type { ProductVariantRow } from "@/lib/db/types";
import type { MovementRow } from "@/components/admin/InventoryTable";
import type { InventoryEntry } from "@/lib/store/inventory-presentation";
import { matrixLab3dHandle } from "@/lib/store/matrixlab-3d";
import { readyTumblerHandle } from "@/lib/store/tumbler-ready";
import { sparkleHandle } from "@/lib/store/tumbler-sparkles";
import { stickerHandle } from "@/lib/store/tumbler-stickers";

/**
 * DATOS DE MUESTRA para la vista previa del inventario. Nombres y fotos del
 * catálogo público; stock, estados, SKUs e ids son INVENTADOS y no salen de
 * ninguna base. Pasan por la misma presentación que el admin real
 * (`presentInventoryEntries`), así que el bloque y la miniatura se resuelven
 * igual que en producción.
 */

/**
 * La vista previa sólo existe en despliegues Preview de Vercel y en `next dev`.
 * En producción (VERCEL_ENV=production) o en un `next start` sin Vercel → 404.
 */
export function isInventoryPreviewEnabled(
  env: { NODE_ENV?: string; VERCEL_ENV?: string } = process.env,
): boolean {
  return env.VERCEL_ENV === "preview" || env.NODE_ENV === "development";
}

const CREATED_AT = "2026-10-01T12:00:00.000Z";

type SampleProduct = {
  id: string;
  title: string;
  handle: string;
  images?: string[];
  category: { handle: string; title: string } | null;
};

function variant(
  product: SampleProduct | null,
  n: number,
  fields: Partial<ProductVariantRow> & Pick<ProductVariantRow, "title" | "stock">,
): InventoryEntry {
  const productId = product?.id ?? "muestra-sin-producto";
  return {
    id: `${productId}-v${n}`,
    product_id: productId,
    sku: null,
    price: null,
    color: null,
    size: null,
    option_label: null,
    status: "disponible",
    created_at: CREATED_AT,
    updated_at: CREATED_AT,
    ...fields,
    products: product
      ? {
          title: product.title,
          handle: product.handle,
          images: product.images ?? [],
          categories: product.category,
        }
      : null,
  };
}

const WEAR: SampleProduct = {
  id: "muestra-wear",
  title: "Playera MatrixLab Wear WR001",
  handle: "wear-lista-wr001",
  category: { handle: "playeras-prendas", title: "Playeras y prendas" },
};
const STICKERS: SampleProduct = {
  id: "muestra-imanes",
  title: "Imán para auto IMN-AUTO001",
  handle: "muestra-iman-auto001",
  images: ["/images/matrixlab-stickers/imn-auto001.webp"],
  category: { handle: "imanes", title: "Imanes" },
};
const UV_STICKER: SampleProduct = {
  id: "muestra-uv",
  title: "UV Sticker 24oz A001",
  handle: stickerHandle("A001"),
  category: { handle: "wraps-glow-finish", title: "Wraps & Glow Finish" },
};
const SPARKLE: SampleProduct = {
  id: "muestra-sparkle",
  title: "Fairy Byte",
  handle: sparkleHandle("2002"),
  category: { handle: "repuestos-consumibles", title: "Sparkle Mix" },
};
const READY_TUMBLER: SampleProduct = {
  id: "muestra-vaso",
  title: "Vaso ToyStory Marcianitos",
  handle: readyTumblerHandle("VL001"),
  category: { handle: "snowglobe", title: "Tumbler & SnowGlobe Bar" },
};
const PIECE_3D: SampleProduct = {
  id: "muestra-3d",
  title: "Dragón Fuego Vivo - Lámpara RGB 3D",
  handle: matrixLab3dHandle("3D001"),
  category: { handle: "impresion-3d", title: "Impresión 3D" },
};
const LASER: SampleProduct = {
  id: "muestra-laser",
  title: "Grabado láser personalizado",
  handle: "muestra-grabado-laser",
  images: ["/images/categories/matrixlab-laser.png"],
  category: { handle: "grabado-laser", title: "Grabado láser" },
};
const SCHOOL: SampleProduct = {
  id: "muestra-escolar",
  title: "Etiquetas escolares personalizadas",
  handle: "muestra-etiquetas-escolares",
  images: ["/images/categories/etiquetas-escolares.png"],
  category: { handle: "etiquetas-escolares", title: "Etiquetas escolares" },
};
const NO_PHOTO: SampleProduct = {
  id: "muestra-sin-foto",
  title: "Gorra trucker (sin foto cargada)",
  handle: "muestra-gorra-sin-foto",
  category: { handle: "gorras", title: "Gorras" },
};
const NO_CATEGORY: SampleProduct = {
  id: "muestra-sin-categoria",
  title: "Producto sin categoría asignada",
  handle: "muestra-sin-categoria",
  category: null,
};

export const SAMPLE_INVENTORY_ENTRIES: InventoryEntry[] = [
  variant(WEAR, 1, { title: "Negra / M", sku: "MUESTRA-WR001-N-M", color: "Negra", size: "M", stock: 6 }),
  variant(WEAR, 2, { title: "Blanca / L", sku: "MUESTRA-WR001-B-L", color: "Blanca", size: "L", stock: 2 }),
  variant(WEAR, 3, { title: "Gris / S", sku: "MUESTRA-WR001-G-S", color: "Gris", size: "S", stock: 0, status: "agotado" }),
  variant(STICKERS, 1, { title: "Pieza", sku: "MUESTRA-IMN-AUTO001", stock: 14 }),
  variant(UV_STICKER, 1, { title: "24 oz", sku: "MUESTRA-UV-A001", stock: 3 }),
  variant(SPARKLE, 1, { title: "Bote", sku: "MUESTRA-SP-2002", stock: 2 }),
  variant(READY_TUMBLER, 1, { title: "Pieza", sku: "MUESTRA-VL001", stock: 5 }),
  variant(PIECE_3D, 1, { title: "Pieza", sku: "MUESTRA-3D001", stock: 1, status: "sobre_pedido" }),
  variant(LASER, 1, { title: "Pieza", sku: "MUESTRA-LASER", stock: 0, status: "sobre_pedido" }),
  variant(SCHOOL, 1, { title: "Planilla", sku: "MUESTRA-ESCOLAR", stock: 40 }),
  variant(NO_PHOTO, 1, { title: "Unitalla", sku: "MUESTRA-GORRA", stock: 4, status: "oculto" }),
  variant(NO_CATEGORY, 1, { title: "Única", sku: "MUESTRA-SIN-BLOQUE", stock: 7 }),
  variant(null, 1, { title: "Variante huérfana", sku: null, stock: 0, status: "oculto" }),
];

export const SAMPLE_MOVEMENTS: MovementRow[] = [
  {
    id: "muestra-mov-1",
    product_variant_id: "muestra-wear-v1",
    order_id: null,
    movement_type: "reposicion",
    quantity: 4,
    reason: "Ejemplo de reposición",
    created_at: "2026-10-20T16:30:00.000Z",
    product_variants: { title: "Negra / M", sku: "MUESTRA-WR001-N-M" },
  },
  {
    id: "muestra-mov-2",
    product_variant_id: "muestra-uv-v1",
    order_id: null,
    movement_type: "ajuste",
    quantity: -1,
    reason: "Ejemplo de ajuste",
    created_at: "2026-10-21T18:05:00.000Z",
    product_variants: { title: "24 oz", sku: "MUESTRA-UV-A001" },
  },
];

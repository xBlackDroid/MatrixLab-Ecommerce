import "server-only";

import { getAnonClient } from "@/lib/db/client";
import { getServiceClient } from "@/lib/db/admin";
import type {
  CategoryRow,
  ProductRow,
  ProductVariantRow,
  ProductWithVariants,
} from "@/lib/db/types";
import {
  MOCK_CATEGORIES,
  MOCK_PRODUCTS,
  MOCK_VARIANTS,
} from "@/lib/store/mock-data";
import { isValidHandle } from "@/lib/security/sanitize";
import type { ProductSort } from "@/lib/validation/store";

/**
 * Catálogo público. Lee vía anon key (RLS limita a contenido visible).
 * Si Supabase no está configurado, usa los mocks de desarrollo para que el
 * catálogo sea navegable; las operaciones transaccionales siguen bloqueadas.
 */

function getCatalogClient() {
  // Preferimos anon (sujeto a RLS). El service client solo entra como
  // respaldo de lectura cuando no se configuró la anon key.
  return getAnonClient() ?? getServiceClient();
}

const VISIBLE_PRODUCT_FILTER = [
  "disponible",
  "agotado",
  "sobre_pedido",
  "proximamente",
] as const;

export async function getCategories(): Promise<CategoryRow[]> {
  const client = getCatalogClient();
  if (!client) {
    return [...MOCK_CATEGORIES].sort((a, b) => a.sort_order - b.sort_order);
  }
  const { data, error } = await client
    .from("categories")
    .select("*")
    .eq("status", "activa")
    .order("sort_order", { ascending: true });
  if (error || !data) return [];
  return data as CategoryRow[];
}

export async function getCategoryByHandle(
  handle: string,
): Promise<CategoryRow | null> {
  if (!isValidHandle(handle)) return null;
  const client = getCatalogClient();
  if (!client) {
    return MOCK_CATEGORIES.find((c) => c.handle === handle) ?? null;
  }
  const { data, error } = await client
    .from("categories")
    .select("*")
    .eq("handle", handle)
    .eq("status", "activa")
    .maybeSingle();
  if (error) return null;
  return (data as CategoryRow | null) ?? null;
}

function sortProducts(products: ProductRow[], sort: ProductSort): ProductRow[] {
  const sorted = [...products];
  switch (sort) {
    case "price_asc":
      sorted.sort((a, b) => Number(a.base_price) - Number(b.base_price));
      break;
    case "price_desc":
      sorted.sort((a, b) => Number(b.base_price) - Number(a.base_price));
      break;
    case "featured":
      sorted.sort(
        (a, b) =>
          Number(b.is_customizable) - Number(a.is_customizable) ||
          Number(a.base_price) - Number(b.base_price),
      );
      break;
    default:
      sorted.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
  }
  return sorted;
}

export async function getProductsByCategory(
  categoryId: string,
  sort: ProductSort = "newest",
): Promise<ProductRow[]> {
  const client = getCatalogClient();
  if (!client) {
    return sortProducts(
      MOCK_PRODUCTS.filter((p) => p.category_id === categoryId),
      sort,
    );
  }
  let query = client
    .from("products")
    .select("*")
    .eq("category_id", categoryId)
    .in("status", [...VISIBLE_PRODUCT_FILTER]);

  // Orden controlado por whitelist (ProductSortSchema valida antes de llegar).
  switch (sort) {
    case "price_asc":
      query = query.order("base_price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("base_price", { ascending: false });
      break;
    case "featured":
      query = query
        .order("is_customizable", { ascending: false })
        .order("base_price", { ascending: true });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data as ProductRow[];
}

export async function getAllVisibleProducts(): Promise<ProductRow[]> {
  const client = getCatalogClient();
  if (!client) return [...MOCK_PRODUCTS];
  const { data, error } = await client
    .from("products")
    .select("*")
    .in("status", [...VISIBLE_PRODUCT_FILTER])
    .order("created_at", { ascending: false })
    .limit(60);
  if (error || !data) return [];
  return data as ProductRow[];
}

export async function getProductByHandle(
  handle: string,
): Promise<ProductWithVariants | null> {
  if (!isValidHandle(handle)) return null;
  const client = getCatalogClient();
  if (!client) {
    const mock = MOCK_PRODUCTS.find((p) => p.handle === handle);
    if (!mock || mock.status === "oculto") return null;
    return {
      ...mock,
      variants: MOCK_VARIANTS.filter(
        (v) => v.product_id === mock.id && v.status !== "oculto",
      ),
      category:
        MOCK_CATEGORIES.find((c) => c.id === mock.category_id) ?? null,
    };
  }

  const { data, error } = await client
    .from("products")
    .select("*, product_variants(*), categories(id, title, handle)")
    .eq("handle", handle)
    .in("status", [...VISIBLE_PRODUCT_FILTER])
    .maybeSingle();
  if (error || !data) return null;

  const row = data as ProductRow & {
    product_variants: ProductVariantRow[] | null;
    categories: Pick<CategoryRow, "id" | "title" | "handle"> | null;
  };
  return {
    ...row,
    variants: (row.product_variants ?? []).filter((v) => v.status !== "oculto"),
    category: row.categories ?? null,
  };
}

/** Productos relacionados: misma categoría, excluyendo el actual. */
export async function getRelatedProducts(
  product: ProductRow,
  limit = 4,
): Promise<ProductRow[]> {
  if (!product.category_id) return [];
  const all = await getProductsByCategory(product.category_id, "featured");
  return all.filter((p) => p.id !== product.id).slice(0, limit);
}

/** Mapa handle de producto → tipo del diseñador (para CTA "Personalizar"). */
export const DESIGNER_PRODUCT_HANDLES: Record<string, "playera" | "gorra" | "tote"> = {
  "playera-personalizada": "playera",
  "gorra-personalizada": "gorra",
  "tote-bag-personalizada": "tote",
};

/** Producto base que usa el diseñador para cada tipo. */
export const DESIGNER_TYPE_TO_HANDLE: Record<"playera" | "gorra" | "tote", string> = {
  playera: "playera-personalizada",
  gorra: "gorra-personalizada",
  tote: "tote-bag-personalizada",
};

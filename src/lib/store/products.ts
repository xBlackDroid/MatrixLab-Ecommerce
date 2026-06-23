import "server-only";

import { getAnonClient } from "@/lib/db/client";
import { getServiceClient } from "@/lib/db/admin";
import type {
  CategoryRow,
  DesignerProductType,
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

/**
 * "Insumos creativos" (madre) agrupa subcategorías comerciales. La página de la
 * categoría madre muestra estos bloques (no tiene productos propios). El orden
 * sigue el naming comercial del catálogo.
 */
export const INSUMOS_PARENT_HANDLE = "insumos";
// Orden público EXACTO de las 8 subcategorías de Insumos creativos.
export const INSUMOS_SUBCATEGORY_HANDLES = [
  "snowglobe", // 1. SnowGlobe Bar
  "llaveros", // 2. Llaveros creativos
  "tags-acrilico", // 3. Tags de acrílico
  "acrilicos", // 4. Acrylab
  "accesorios-personalizacion", // 5. Creator Tools
  "repuestos-consumibles", // 6. Sparkle Mix
  "magic-flow", // 7. Magic Flow
  "wraps-glow-finish", // 8. Wraps & Glow Finish
] as const;

/** Subcategorías de Insumos creativos, en orden comercial (para su landing). */
export async function getInsumosSubcategories(): Promise<CategoryRow[]> {
  const all = await getCategories();
  const order = INSUMOS_SUBCATEGORY_HANDLES as readonly string[];
  return all
    .filter((c) => order.includes(c.handle))
    .sort((a, b) => order.indexOf(a.handle) - order.indexOf(b.handle));
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

/**
 * Resolver del producto base de un laboratorio (diseñador).
 *
 * A diferencia de getProductByHandle (catálogo público vía anon key + RLS, con
 * embed de categoría y filtro de estados visibles), este resuelve del lado
 * servidor con el SERVICE client — igual que las APIs de diseño y carrito — por
 * lo que NO depende de matices de RLS/estado del catálogo público. Acepta
 * cualquier estado salvo 'oculto' (incluye 'sobre_pedido' y 'disponible'),
 * y trae las variantes en una consulta aparte (sin embeds frágiles).
 *
 * Si Supabase no está configurado, cae a los mocks de desarrollo.
 */
export async function getDesignerBaseProduct(
  handle: string,
): Promise<ProductWithVariants | null> {
  if (!isValidHandle(handle)) {
    console.info("[school-labels] resolver: handle inválido", { handle });
    return null;
  }

  // Server-side: el service client es el adecuado para el producto base del
  // diseñador (las APIs de diseño/carrito también usan service role). Si no
  // existe, intenta anon; si tampoco, usa mocks.
  const service = getServiceClient();
  const client = service ?? getAnonClient();
  if (!client) {
    const mock = MOCK_PRODUCTS.find((p) => p.handle === handle);
    console.info("[school-labels] resolver: sin Supabase, usando mocks", {
      handle,
      foundMock: Boolean(mock),
    });
    if (!mock || mock.status === "oculto") return null;
    return {
      ...mock,
      variants: MOCK_VARIANTS.filter(
        (v) => v.product_id === mock.id && v.status !== "oculto",
      ),
      category: MOCK_CATEGORIES.find((c) => c.id === mock.category_id) ?? null,
    };
  }

  // Consulta SOLO por handle (sin filtrar status/categoría/embed) para no
  // descartar el producto por error y poder diagnosticar su estado real.
  const { data: rows, error } = await client
    .from("products")
    .select("*")
    .eq("handle", handle)
    .limit(1);
  const product = ((rows as ProductRow[] | null) ?? [])[0] ?? null;

  // DIAGNÓSTICO TEMPORAL (sin secretos): revela por qué se resuelve o no.
  console.info("[school-labels] resolver: products query", {
    handle,
    usingServiceRole: Boolean(service),
    found: Boolean(product),
    status: product?.status ?? null,
    isCustomizable: product?.is_customizable ?? null,
    error: error?.message ?? null,
    errorCode: (error as { code?: string } | null)?.code ?? null,
  });

  if (!product) return null;
  // Solo se descarta si está oculto; sobre_pedido y disponible se aceptan.
  if (product.status === "oculto") {
    console.info(
      "[school-labels] resolver: producto OCULTO; cámbialo a sobre_pedido o disponible en /admin/productos.",
      { handle },
    );
    return null;
  }

  const { data: variantData, error: variantError } = await client
    .from("product_variants")
    .select("*")
    .eq("product_id", product.id)
    .neq("status", "oculto");
  const variants = (variantData as ProductVariantRow[] | null) ?? [];

  console.info("[school-labels] resolver: variants query", {
    productId: product.id,
    variantCount: variants.length,
    error: variantError?.message ?? null,
    variants: variants.map((v) => ({
      optionLabel: v.option_label,
      title: v.title,
      status: v.status,
      price: v.price,
    })),
  });

  return {
    ...product,
    variants,
    category: null,
  };
}

/**
 * Mapa handle de producto base → tipo del diseñador (para el CTA
 * "Personalizar en el laboratorio" en la página de producto). El mapa
 * inverso (tipo → handle) vive en lib/designer/product-catalog.ts.
 */
export const DESIGNER_PRODUCT_HANDLES: Record<string, DesignerProductType> = {
  "playera-personalizada": "playera",
  "sudadera-personalizada": "sudadera",
  "gorra-personalizada": "gorra",
  "gorra-trucker-personalizada": "gorra-trucker",
  "gorra-clasica-personalizada": "gorra-clasica",
  "tote-bag-personalizada": "tote",
  "planilla-stickers": "stickers-planilla",
  "planilla-imanes": "imanes-planilla",
  "grabado-laser-personalizado": "laser",
  "etiquetas-escolares-personalizadas": "etiquetas-escolares",
};

// Re-export del mapa tipo → handle (fuente: product-catalog).
export { DESIGNER_TYPE_TO_HANDLE } from "@/lib/designer/product-catalog";

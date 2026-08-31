import "server-only";

import { existsSync, readdirSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getAnonClient } from "@/lib/db/client";
import { getServiceClient } from "@/lib/db/admin";
import { getServerEnv } from "@/lib/security/env";
import type {
  CategoryRow,
  DesignerProductType,
  ProductRow,
  ProductVariantRow,
  ProductWithVariants,
} from "@/lib/db/types";
import {
  DESIGNER_HANDLE_TO_TYPE,
  resolveDesignerHandle,
} from "@/lib/designer/product-handles";
import {
  MOCK_CATEGORIES,
  MOCK_PRODUCTS,
  MOCK_VARIANTS,
} from "@/lib/store/mock-data";
import { repairMojibake, repairMojibakeNullable } from "@/lib/store/text";
import {
  SPARKLE_PLACEHOLDER_IMAGE,
  sparkleByHandle,
  sparkleHandle,
  sparkleImagePath,
  TUMBLER_SPARKLES,
  type SparkleItem,
} from "@/lib/store/tumbler-sparkles";
import {
  STICKER_PLACEHOLDER_IMAGE,
  stickerByHandle,
  stickerHandle,
  stickerImagePath,
  TUMBLER_STICKERS,
  type StickerItem,
} from "@/lib/store/tumbler-stickers";
import {
  CUP_PLACEHOLDER_IMAGE,
  cupByHandle,
  cupHandle,
  cupImagePath,
  TUMBLER_CUPS,
  type CupItem,
} from "@/lib/store/tumbler-cups";
import {
  MATRIXLAB_STICKER_PLACEHOLDER_IMAGE,
  MATRIXLAB_STICKERS,
  matrixLabStickerByHandle,
  matrixLabStickerImagePath,
  matrixLabStickerPrice,
  matrixLabStickerSku,
  type MatrixLabStickerItem,
} from "@/lib/store/matrixlab-stickers";
import {
  MATRIXLAB_WEAR,
  MATRIXLAB_WEAR_PLACEHOLDER_IMAGE,
  matrixLabWearByHandle,
  matrixLabWearHandle,
  matrixLabWearImagePath,
  matrixLabWearNeedsDefinition,
  matrixLabWearSku,
  type MatrixLabWearItem,
} from "@/lib/store/matrixlab-wear";
import {
  MATRIXLAB_3D,
  MATRIXLAB_3D_PLACEHOLDER_IMAGE,
  matrixLab3dByHandle,
  matrixLab3dHandle,
  matrixLab3dImagePath,
  matrixLab3dSku,
  type MatrixLab3dItem,
} from "@/lib/store/matrixlab-3d";
import { isValidHandle } from "@/lib/security/sanitize";
import type { ProductSort } from "@/lib/validation/store";

/**
 * Repara mojibake (encoding roto) en los textos visibles del catálogo. Solo
 * afecta la presentación; la base de datos no se toca. Idempotente.
 */
function fixCategoryText(c: CategoryRow): CategoryRow {
  return {
    ...c,
    title: repairMojibake(c.title),
    description: repairMojibakeNullable(c.description),
  };
}

function fixProductText(p: ProductRow): ProductRow {
  return {
    ...p,
    title: repairMojibake(p.title),
    description: repairMojibakeNullable(p.description),
  };
}

/**
 * Existencia de un archivo público sin depender de mayúsc./minúsc.
 *
 * Necesario porque el filesystem de desarrollo (Windows/macOS) es
 * case-insensitive, pero el de producción (Vercel/Linux) NO lo es: un
 * archivo subido como "C08R.webp" pasa `existsSync` en local y falla en
 * producción si el código busca "c08r.webp" (la convención de nombres real).
 *
 * El chequeo directo (`existsSync`) sigue siendo el camino rápido y en vivo
 * — así un archivo nuevo en dev aparece en el siguiente render, sin caché
 * que lo oculte. Solo si ese chequeo falla se hace un listado de la carpeta
 * (sin cachear: son carpetas de decenas de archivos, no vale la pena la
 * complejidad de invalidar una caché por esto) para recuperar el archivo
 * aunque su nombre real tenga otra capitalización.
 */
function publicImageExists(rel: string): boolean {
  const abs = join(process.cwd(), "public", rel);
  if (existsSync(abs)) return true;
  const filename = basename(rel).toLowerCase();
  try {
    return readdirSync(join(process.cwd(), "public", dirname(rel))).some(
      (f) => f.toLowerCase() === filename,
    );
  } catch {
    return false;
  }
}

/**
 * Imagen de un Sparkle (MatrixLab Tumbler), resuelta por CÓDIGO en servidor:
 *
 *   1. si el admin ya curó imágenes en la base, se respetan tal cual;
 *   2. si existe `public/images/tumbler/sparkles/<codigo>.webp`, se usa esa —
 *      subir el archivo basta para que aparezca, sin tocar código ni base;
 *   3. si no, se usa el placeholder de marca. Nunca una imagen rota.
 */
function resolveSparkleImages(p: ProductRow): ProductRow {
  const sparkle = sparkleByHandle(p.handle);
  if (!sparkle) return p;
  if (Array.isArray(p.images) && p.images.length > 0) return p;
  const rel = sparkleImagePath(sparkle.code);
  const photo = publicImageExists(rel);
  return { ...p, images: [photo ? rel : SPARKLE_PLACEHOLDER_IMAGE] };
}

/**
 * Imagen de un UV Sticker (MatrixLab Tumbler), resuelta por CÓDIGO en
 * servidor, con la misma regla que los Sparkles:
 *
 *   1. si el admin ya curó imágenes en la base, se respetan tal cual;
 *   2. si existe `public/images/tumbler/stickers/<codigo>.webp`, se usa esa —
 *      copiar el archivo basta para que aparezca, sin tocar código ni base;
 *   3. si no, se usa el placeholder de marca. Nunca una imagen rota.
 */
function resolveStickerImages(p: ProductRow): ProductRow {
  const sticker = stickerByHandle(p.handle);
  if (!sticker) return p;
  if (Array.isArray(p.images) && p.images.length > 0) return p;
  const rel = stickerImagePath(sticker.code);
  const photo = publicImageExists(rel);
  return { ...p, images: [photo ? rel : STICKER_PLACEHOLDER_IMAGE] };
}

/**
 * Imagen de un vaso (MatrixLab Tumbler), resuelta por CÓDIGO en servidor, con
 * la misma regla que Sparkles y UV Stickers:
 *
 *   1. si el admin ya curó imágenes en la base, se respetan tal cual;
 *   2. si existe `public/images/tumbler/vasos/<codigo>.webp`, se usa esa —
 *      copiar el archivo basta para que aparezca, sin tocar código ni base;
 *   3. si no, se usa el placeholder de marca. Nunca una imagen rota.
 */
function resolveCupImages(p: ProductRow): ProductRow {
  const cup = cupByHandle(p.handle);
  if (!cup) return p;
  if (Array.isArray(p.images) && p.images.length > 0) return p;
  const rel = cupImagePath(cup.code);
  const photo = publicImageExists(rel);
  return { ...p, images: [photo ? rel : CUP_PLACEHOLDER_IMAGE] };
}

/**
 * Pipeline de presentación pública de un producto. Cada resolver devuelve el
 * producto intacto si el handle no le corresponde, así que encadenarlos es
 * seguro: un Sparkle nunca entra al resolver de stickers ni al de vasos.
 */
function presentProduct(p: ProductRow): ProductRow {
  return resolveMatrixLabImages(
    resolveCupImages(
      resolveStickerImages(resolveSparkleImages(fixProductText(p))),
    ),
  );
}

/**
 * Imagen de las tres líneas MatrixLab (Stickers / Wear / 3D), resuelta por
 * CÓDIGO con la misma regla que Tumbler. Sin esto, los productos sembrados
 * saldrían sin foto en /tienda/producto/<handle>, en la búsqueda y en las
 * grillas de relacionados, aunque el catálogo de la categoría sí muestre el
 * placeholder de marca: el seed no escribe `images` a propósito.
 */
function resolveMatrixLabImages(p: ProductRow): ProductRow {
  if (Array.isArray(p.images) && p.images.length > 0) return p;
  const sticker = matrixLabStickerByHandle(p.handle);
  if (sticker) {
    const rel = matrixLabStickerImagePath(sticker.code);
    return {
      ...p,
      images: [
        publicImageExists(rel) ? rel : MATRIXLAB_STICKER_PLACEHOLDER_IMAGE,
      ],
    };
  }
  const wear = matrixLabWearByHandle(p.handle);
  if (wear) {
    const rel = matrixLabWearImagePath(wear.code);
    return {
      ...p,
      images: [publicImageExists(rel) ? rel : MATRIXLAB_WEAR_PLACEHOLDER_IMAGE],
    };
  }
  const piece = matrixLab3dByHandle(p.handle);
  if (piece) {
    const rel = matrixLab3dImagePath(piece.code);
    return {
      ...p,
      images: [publicImageExists(rel) ? rel : MATRIXLAB_3D_PLACEHOLDER_IMAGE],
    };
  }
  return p;
}

// ---------------------------------------------------------------------------
// MatrixLab Tumbler — línea comercial de vasos, termos, snow globe e insumos.
// ---------------------------------------------------------------------------

/** Handle público oficial de la categoría madre de la línea. */
export const TUMBLER_PARENT_HANDLE = "matrixlab-tumbler";
/** Handle histórico ("Insumos creativos"); se mantiene por compatibilidad. */
export const LEGACY_TUMBLER_PARENT_HANDLE = "insumos";

const TUMBLER_TITLE = "MatrixLab Tumbler";
const TUMBLER_DESCRIPTION =
  "Insumos, accesorios y materiales para vasos, termos y proyectos snow globe.";

/**
 * Rebrand de presentación: si la base de datos aún tiene la categoría madre
 * con el handle/nombre histórico ("Insumos creativos" / `insumos`), se muestra
 * al público como "MatrixLab Tumbler" sin tocar la fila real. El admin sigue
 * viendo los datos reales (consulta la tabla directamente, no pasa por aquí).
 */
function normalizeTumblerCategory(c: CategoryRow): CategoryRow {
  if (c.handle !== LEGACY_TUMBLER_PARENT_HANDLE) return c;
  return {
    ...c,
    handle: TUMBLER_PARENT_HANDLE,
    title: TUMBLER_TITLE,
    description: TUMBLER_DESCRIPTION,
  };
}

/**
 * Rebrand de presentación por categoría: nombre público que se muestra en la
 * tienda cuando difiere del `title` de la base.
 *
 * Mismo patrón que `normalizeTumblerCategory`: se cambia SOLO lo que ve el
 * cliente. El handle, el id, la ruta `/tienda/categoria/<handle>`, los
 * productos y el admin siguen usando el dato real, así que ningún enlace ni
 * referencia interna se rompe.
 */
const PUBLIC_CATEGORY_TITLES: Record<string, string> = {
  stickers: "MatrixLab Stickers",
  "impresion-3d": "MatrixLab 3D",
};

/** Aplica el nombre público de la categoría (si tiene uno definido). */
function applyPublicCategoryTitle(c: CategoryRow): CategoryRow {
  const title = PUBLIC_CATEGORY_TITLES[c.handle];
  return title ? { ...c, title } : c;
}

/**
 * Imagen de la categoría: si existe `public/images/categories/<handle>.png`
 * (o .webp) se usa esa; si el admin configuró una URL remota, se respeta; y si
 * no hay nada, queda null y la UI cae a su icono (nunca una imagen rota).
 */
function resolveCategoryImage(c: CategoryRow): string | null {
  for (const ext of ["png", "webp"] as const) {
    const rel = `/images/categories/${c.handle}.${ext}`;
    if (publicImageExists(rel)) return rel;
  }
  if (c.image_url && /^https?:\/\//.test(c.image_url)) return c.image_url;
  return null;
}

/** Pipeline de presentación pública de una categoría. */
function presentCategory(c: CategoryRow): CategoryRow {
  const branded = applyPublicCategoryTitle(
    normalizeTumblerCategory(fixCategoryText(c)),
  );
  return { ...branded, image_url: resolveCategoryImage(branded) };
}

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

/**
 * Tiempo máximo de una lectura de catálogo (ms). Si Supabase se cuelga
 * (proyecto pausado, red lenta, etc.) NO bloqueamos la ruta: degradamos a un
 * fallback (lista vacía / null) para que la página renderice su estado
 * controlado en vez de quedar colgada hasta el timeout del serverless.
 */
const READ_TIMEOUT_MS = 4000;

type ReadResult<T> = { data: T | null; error: unknown };

/** Corre una query de Supabase contra un timeout; devuelve fallback si tarda. */
async function raceRead<T>(
  query: PromiseLike<ReadResult<T>>,
  timeoutMs: number = READ_TIMEOUT_MS,
): Promise<ReadResult<T>> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<ReadResult<T>>((resolve) => {
    timer = setTimeout(
      () => resolve({ data: null, error: { message: "read-timeout" } }),
      timeoutMs,
    );
  });
  try {
    return await Promise.race([query, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function getCategories(): Promise<CategoryRow[]> {
  const client = getCatalogClient();
  if (!client) {
    return [...MOCK_CATEGORIES]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(presentCategory);
  }
  const { data, error } = await raceRead<CategoryRow[]>(
    client
      .from("categories")
      .select("*")
      .eq("status", "activa")
      .order("sort_order", { ascending: true }) as unknown as PromiseLike<
      ReadResult<CategoryRow[]>
    >,
  );
  if (error || !data) return [];
  return data.map(presentCategory);
}

export async function getCategoryByHandle(
  handle: string,
): Promise<CategoryRow | null> {
  if (!isValidHandle(handle)) return null;
  const client = getCatalogClient();
  if (!client) {
    const mock =
      MOCK_CATEGORIES.find((c) => c.handle === handle) ??
      // Compatibilidad: la ruta nueva resuelve aunque el dato aún tenga el
      // handle histórico (el rebrand lo aplica presentCategory).
      (handle === TUMBLER_PARENT_HANDLE
        ? MOCK_CATEGORIES.find(
            (c) => c.handle === LEGACY_TUMBLER_PARENT_HANDLE,
          )
        : undefined);
    return mock ? presentCategory(mock) : null;
  }
  const fetchByHandle = (h: string) =>
    raceRead<CategoryRow>(
      client
        .from("categories")
        .select("*")
        .eq("handle", h)
        .eq("status", "activa")
        .maybeSingle() as unknown as PromiseLike<ReadResult<CategoryRow>>,
    );
  const { data, error } = await fetchByHandle(handle);
  if (error) return null;
  if (data) return presentCategory(data);
  // Base de datos aún sin migrar: /tienda/categoria/matrixlab-tumbler debe
  // funcionar aunque la fila conserve el handle histórico `insumos`.
  if (handle === TUMBLER_PARENT_HANDLE) {
    const legacy = await fetchByHandle(LEGACY_TUMBLER_PARENT_HANDLE);
    if (!legacy.error && legacy.data) return presentCategory(legacy.data);
  }
  return null;
}

/**
 * "MatrixLab Tumbler" (madre) agrupa subcategorías comerciales. La página de
 * la categoría madre muestra estos bloques (no tiene productos propios). El
 * orden sigue el naming comercial del catálogo. Los handles internos se
 * conservan tal cual por compatibilidad con seeds, productos y rutas.
 */
// Orden público EXACTO de las 8 subcategorías de MatrixLab Tumbler.
export const TUMBLER_SUBCATEGORY_HANDLES = [
  "snowglobe", // 1. SnowGlobe Bar
  "llaveros", // 2. Llaveros creativos
  "tags-acrilico", // 3. Tags de acrílico
  "acrilicos", // 4. Acrylab
  "accesorios-personalizacion", // 5. Creator Tools
  "repuestos-consumibles", // 6. Sparkle Mix
  "magic-flow", // 7. Magic Flow
  "wraps-glow-finish", // 8. Wraps & Glow Finish
] as const;

/**
 * ---------------------------------------------------------------------------
 * Sparkles / Glitter Chunky (categoría `repuestos-consumibles`)
 * ---------------------------------------------------------------------------
 * Cada Sparkle es un producto independiente con UNA variante ("Bote") que
 * lleva SKU, precio e inventario. Esta lectura junta el producto real de la
 * base con su fila del Excel (`TUMBLER_SPARKLES`) para poder mostrar nombre,
 * precio, inventario y referencia en una sola tarjeta.
 *
 * El precio y el stock que se muestran vienen SIEMPRE de la base (variante →
 * producto), nunca del frontend: el carrito los vuelve a resolver en servidor.
 */
export interface SparkleCatalogEntry {
  /** Fila del Excel (nombre público, código, colección). */
  item: SparkleItem;
  productId: string;
  handle: string;
  /** Título real en base (puede diferir si el admin lo editó). */
  title: string;
  variantId: string | null;
  sku: string | null;
  /** Precio unitario resuelto en servidor (variante → producto). */
  price: number;
  /** Inventario real de la variante. */
  stock: number;
  /** Imagen resuelta por código (foto real o placeholder de marca). */
  image: string;
  /** Producto vendible: estado válido y con inventario (o sobre pedido). */
  sellable: boolean;
}

export interface SparkleCatalog {
  /** Sparkles del Excel presentes en la base, en el orden EXACTO del Excel. */
  entries: SparkleCatalogEntry[];
  /** Códigos del Excel que aún no existen en la base (seed pendiente). */
  missingCodes: string[];
  /**
   * Productos genéricos anteriores de la categoría (p. ej. "Glitter chunky
   * para vasos", "Mezcla de brillos decorativos", "Mica efecto brillo").
   *
   * NO se borran de la base ni del admin: siguen existiendo como registros
   * históricos y conservan su ficha en /tienda/producto/<handle>. Solo se
   * separan aquí para que la vista pública de la categoría muestre
   * exclusivamente los 46 Sparkles del Excel, sin mezclarlos.
   */
  legacyHidden: ProductRow[];
}

type ProductWithVariantRows = ProductRow & {
  product_variants: ProductVariantRow[] | null;
};

/** Arma una entrada del catálogo a partir del producto y sus variantes. */
function buildSparkleEntry(
  item: SparkleItem,
  product: ProductRow,
  variants: ProductVariantRow[],
): SparkleCatalogEntry {
  const variant =
    variants.find((v) => v.status !== "oculto") ?? variants[0] ?? null;
  const price =
    variant?.price !== null && variant?.price !== undefined
      ? Number(variant.price)
      : Number(product.base_price);
  const stock = variant ? variant.stock : 0;
  const onDemand =
    product.status === "sobre_pedido" || variant?.status === "sobre_pedido";
  const sellable =
    ["disponible", "sobre_pedido"].includes(product.status) &&
    !["agotado", "oculto"].includes(variant?.status ?? "disponible") &&
    (onDemand || stock > 0);
  const images = presentProduct(product).images;
  return {
    item,
    productId: product.id,
    handle: product.handle,
    title: product.title,
    variantId: variant?.id ?? null,
    sku: variant?.sku ?? null,
    price,
    stock,
    image: images[0] ?? SPARKLE_PLACEHOLDER_IMAGE,
    sellable,
  };
}

/** Junta productos + variantes con el Excel, respetando el orden del Excel. */
function assembleSparkleCatalog(
  products: ProductRow[],
  variantsByProduct: Map<string, ProductVariantRow[]>,
): SparkleCatalog {
  const byHandle = new Map(products.map((p) => [p.handle, p]));
  const entries: SparkleCatalogEntry[] = [];
  const missingCodes: string[] = [];
  for (const item of TUMBLER_SPARKLES) {
    const product = byHandle.get(sparkleHandle(item.code));
    if (!product) {
      missingCodes.push(item.code);
      continue;
    }
    entries.push(
      buildSparkleEntry(item, product, variantsByProduct.get(product.id) ?? []),
    );
  }
  const legacyHidden = products
    .filter((p) => !sparkleByHandle(p.handle))
    .map(presentProduct);
  return { entries, missingCodes, legacyHidden };
}

/** Catálogo Sparkles de la categoría (productos + variante de cada uno). */
export async function getSparkleCatalog(
  categoryId: string,
): Promise<SparkleCatalog> {
  const client = getCatalogClient();
  if (!client) {
    const products = MOCK_PRODUCTS.filter(
      (p) => p.category_id === categoryId && p.status !== "oculto",
    ).map(fixProductText);
    const variantsByProduct = new Map<string, ProductVariantRow[]>();
    for (const v of MOCK_VARIANTS) {
      if (v.status === "oculto") continue;
      variantsByProduct.set(v.product_id, [
        ...(variantsByProduct.get(v.product_id) ?? []),
        v,
      ]);
    }
    return assembleSparkleCatalog(products, variantsByProduct);
  }
  const { data, error } = await raceRead<ProductWithVariantRows[]>(
    client
      .from("products")
      .select("*, product_variants(*)")
      .eq("category_id", categoryId)
      .in("status", [...VISIBLE_PRODUCT_FILTER]) as unknown as PromiseLike<
      ReadResult<ProductWithVariantRows[]>
    >,
  );
  if (error || !data) {
    return { entries: [], missingCodes: [], legacyHidden: [] };
  }
  const variantsByProduct = new Map<string, ProductVariantRow[]>();
  const products: ProductRow[] = [];
  for (const row of data) {
    const { product_variants, ...product } = row;
    products.push(fixProductText(product as ProductRow));
    variantsByProduct.set(
      product.id,
      (product_variants ?? []).filter((v) => v.status !== "oculto"),
    );
  }
  return assembleSparkleCatalog(products, variantsByProduct);
}

/**
 * ---------------------------------------------------------------------------
 * UV Stickers (categoría `wraps-glow-finish`)
 * ---------------------------------------------------------------------------
 * Implementación PARALELA a la de Sparkles, no compartida: cada línea puede
 * cambiar de precio, acabado o inventario sin arrastrar a la otra.
 *
 * Cada UV Sticker es un producto independiente con UNA variante ("Pieza") que
 * lleva SKU, precio e inventario. Esta lectura junta el producto real de la
 * base con su fila del Excel (`TUMBLER_STICKERS`) para poder mostrar nombre,
 * precio, inventario, acabado y referencia en una sola tarjeta.
 *
 * El precio y el stock que se muestran vienen SIEMPRE de la base (variante →
 * producto), nunca del frontend: el carrito los vuelve a resolver en servidor.
 */
export interface StickerCatalogEntry {
  /** Fila del Excel (nombre público, código, acabado). */
  item: StickerItem;
  productId: string;
  handle: string;
  /** Título real en base (puede diferir si el admin lo editó). */
  title: string;
  variantId: string | null;
  sku: string | null;
  /** Precio unitario resuelto en servidor (variante → producto). */
  price: number;
  /** Inventario real de la variante. */
  stock: number;
  /** Imagen resuelta por código (foto real o placeholder de marca). */
  image: string;
  /** Producto vendible: estado válido y con inventario (o sobre pedido). */
  sellable: boolean;
}

export interface StickerCatalog {
  /** Stickers del Excel presentes en la base, en el orden EXACTO del Excel. */
  entries: StickerCatalogEntry[];
  /** Códigos del Excel que aún no existen en la base (seed pendiente). */
  missingCodes: string[];
  /**
   * Productos genéricos anteriores de la categoría (p. ej. "Wrap UV
   * decorativo", "Lámina decorativa para vaso", "Resina UV para acabado
   * brillante").
   *
   * NO se borran de la base ni del admin: siguen existiendo como registros
   * históricos y conservan su ficha en /tienda/producto/<handle>. Solo se
   * separan aquí para que la vista pública de la categoría muestre
   * exclusivamente los UV Stickers del Excel, sin mezclarlos.
   */
  legacyHidden: ProductRow[];
}

/** Arma una entrada del catálogo a partir del producto y sus variantes. */
function buildStickerEntry(
  item: StickerItem,
  product: ProductRow,
  variants: ProductVariantRow[],
): StickerCatalogEntry {
  const variant =
    variants.find((v) => v.status !== "oculto") ?? variants[0] ?? null;
  const price =
    variant?.price !== null && variant?.price !== undefined
      ? Number(variant.price)
      : Number(product.base_price);
  const stock = variant ? variant.stock : 0;
  const onDemand =
    product.status === "sobre_pedido" || variant?.status === "sobre_pedido";
  const sellable =
    ["disponible", "sobre_pedido"].includes(product.status) &&
    !["agotado", "oculto"].includes(variant?.status ?? "disponible") &&
    (onDemand || stock > 0);
  const images = presentProduct(product).images;
  return {
    item,
    productId: product.id,
    handle: product.handle,
    title: product.title,
    variantId: variant?.id ?? null,
    sku: variant?.sku ?? null,
    price,
    stock,
    image: images[0] ?? STICKER_PLACEHOLDER_IMAGE,
    sellable,
  };
}

/** Junta productos + variantes con el Excel, respetando el orden del Excel. */
function assembleStickerCatalog(
  products: ProductRow[],
  variantsByProduct: Map<string, ProductVariantRow[]>,
): StickerCatalog {
  const byHandle = new Map(products.map((p) => [p.handle, p]));
  const entries: StickerCatalogEntry[] = [];
  const missingCodes: string[] = [];
  for (const item of TUMBLER_STICKERS) {
    const product = byHandle.get(stickerHandle(item.code));
    if (!product) {
      missingCodes.push(item.code);
      continue;
    }
    entries.push(
      buildStickerEntry(item, product, variantsByProduct.get(product.id) ?? []),
    );
  }
  const legacyHidden = products
    .filter((p) => !stickerByHandle(p.handle))
    .map(presentProduct);
  return { entries, missingCodes, legacyHidden };
}

/** Catálogo UV Stickers de la categoría (productos + variante de cada uno). */
export async function getStickerCatalog(
  categoryId: string,
): Promise<StickerCatalog> {
  const client = getCatalogClient();
  if (!client) {
    const products = MOCK_PRODUCTS.filter(
      (p) => p.category_id === categoryId && p.status !== "oculto",
    ).map(fixProductText);
    const variantsByProduct = new Map<string, ProductVariantRow[]>();
    for (const v of MOCK_VARIANTS) {
      if (v.status === "oculto") continue;
      variantsByProduct.set(v.product_id, [
        ...(variantsByProduct.get(v.product_id) ?? []),
        v,
      ]);
    }
    return assembleStickerCatalog(products, variantsByProduct);
  }
  const { data, error } = await raceRead<ProductWithVariantRows[]>(
    client
      .from("products")
      .select("*, product_variants(*)")
      .eq("category_id", categoryId)
      .in("status", [...VISIBLE_PRODUCT_FILTER]) as unknown as PromiseLike<
      ReadResult<ProductWithVariantRows[]>
    >,
  );
  if (error || !data) {
    return { entries: [], missingCodes: [], legacyHidden: [] };
  }
  const variantsByProduct = new Map<string, ProductVariantRow[]>();
  const products: ProductRow[] = [];
  for (const row of data) {
    const { product_variants, ...product } = row;
    products.push(fixProductText(product as ProductRow));
    variantsByProduct.set(
      product.id,
      (product_variants ?? []).filter((v) => v.status !== "oculto"),
    );
  }
  return assembleStickerCatalog(products, variantsByProduct);
}

/**
 * ---------------------------------------------------------------------------
 * Vasos (categoría `snowglobe`)
 * ---------------------------------------------------------------------------
 * Implementación PARALELA a la de Sparkles y UV Stickers, no compartida: cada
 * línea puede cambiar de precio, capacidad o inventario sin arrastrar a las
 * otras.
 *
 * Cada vaso es un producto independiente con UNA variante ("Pieza") que lleva
 * SKU, precio e inventario. Esta lectura junta el producto real de la base con
 * su fila del Excel (`TUMBLER_CUPS`) para poder mostrar nombre, precio,
 * capacidad, inventario y referencia en una sola tarjeta.
 *
 * El precio y el stock que se muestran vienen SIEMPRE de la base (variante →
 * producto), nunca del frontend: el carrito los vuelve a resolver en servidor.
 */
export interface CupCatalogEntry {
  /** Fila del Excel (nombre público, código, capacidad, colección). */
  item: CupItem;
  productId: string;
  handle: string;
  /** Título real en base (puede diferir si el admin lo editó). */
  title: string;
  variantId: string | null;
  sku: string | null;
  /** Precio unitario resuelto en servidor (variante → producto). */
  price: number;
  /** Inventario real de la variante. */
  stock: number;
  /** Imagen resuelta por código (foto real o placeholder de marca). */
  image: string;
  /** Producto vendible: estado válido y con inventario (o sobre pedido). */
  sellable: boolean;
}

export interface CupCatalog {
  /** Vasos del Excel presentes en la base, en el orden EXACTO del Excel. */
  entries: CupCatalogEntry[];
  /** Códigos del Excel que aún no existen en la base (seed pendiente). */
  missingCodes: string[];
  /**
   * Productos SnowGlobe anteriores de la categoría (p. ej. "Kit base para
   * vaso SnowGlobe", "Vaso SnowGlobe listo para rellenar", "Vaso SnowGlobe de
   * vidrio").
   *
   * NO se borran de la base ni del admin: siguen existiendo como registros
   * históricos y conservan su ficha en /tienda/producto/<handle>. Solo se
   * separan aquí para que la vista pública de la categoría muestre
   * exclusivamente los vasos del Excel, sin mezclarlos.
   */
  legacyHidden: ProductRow[];
}

/** Arma una entrada del catálogo a partir del producto y sus variantes. */
function buildCupEntry(
  item: CupItem,
  product: ProductRow,
  variants: ProductVariantRow[],
): CupCatalogEntry {
  const variant =
    variants.find((v) => v.status !== "oculto") ?? variants[0] ?? null;
  const price =
    variant?.price !== null && variant?.price !== undefined
      ? Number(variant.price)
      : Number(product.base_price);
  const stock = variant ? variant.stock : 0;
  const onDemand =
    product.status === "sobre_pedido" || variant?.status === "sobre_pedido";
  const sellable =
    ["disponible", "sobre_pedido"].includes(product.status) &&
    !["agotado", "oculto"].includes(variant?.status ?? "disponible") &&
    (onDemand || stock > 0);
  const images = presentProduct(product).images;
  return {
    item,
    productId: product.id,
    handle: product.handle,
    title: product.title,
    variantId: variant?.id ?? null,
    sku: variant?.sku ?? null,
    price,
    stock,
    image: images[0] ?? CUP_PLACEHOLDER_IMAGE,
    sellable,
  };
}

/** Junta productos + variantes con el Excel, respetando el orden del Excel. */
function assembleCupCatalog(
  products: ProductRow[],
  variantsByProduct: Map<string, ProductVariantRow[]>,
): CupCatalog {
  const byHandle = new Map(products.map((p) => [p.handle, p]));
  const entries: CupCatalogEntry[] = [];
  const missingCodes: string[] = [];
  for (const item of TUMBLER_CUPS) {
    const product = byHandle.get(cupHandle(item.code));
    if (!product) {
      missingCodes.push(item.code);
      continue;
    }
    entries.push(
      buildCupEntry(item, product, variantsByProduct.get(product.id) ?? []),
    );
  }
  const legacyHidden = products
    .filter((p) => !cupByHandle(p.handle))
    .map(presentProduct);
  return { entries, missingCodes, legacyHidden };
}

/** Catálogo de vasos de la categoría (productos + variante de cada uno). */
export async function getCupCatalog(categoryId: string): Promise<CupCatalog> {
  const client = getCatalogClient();
  if (!client) {
    const products = MOCK_PRODUCTS.filter(
      (p) => p.category_id === categoryId && p.status !== "oculto",
    ).map(fixProductText);
    const variantsByProduct = new Map<string, ProductVariantRow[]>();
    for (const v of MOCK_VARIANTS) {
      if (v.status === "oculto") continue;
      variantsByProduct.set(v.product_id, [
        ...(variantsByProduct.get(v.product_id) ?? []),
        v,
      ]);
    }
    return assembleCupCatalog(products, variantsByProduct);
  }
  const { data, error } = await raceRead<ProductWithVariantRows[]>(
    client
      .from("products")
      .select("*, product_variants(*)")
      .eq("category_id", categoryId)
      .in("status", [...VISIBLE_PRODUCT_FILTER]) as unknown as PromiseLike<
      ReadResult<ProductWithVariantRows[]>
    >,
  );
  if (error || !data) {
    return { entries: [], missingCodes: [], legacyHidden: [] };
  }
  const variantsByProduct = new Map<string, ProductVariantRow[]>();
  const products: ProductRow[] = [];
  for (const row of data) {
    const { product_variants, ...product } = row;
    products.push(fixProductText(product as ProductRow));
    variantsByProduct.set(
      product.id,
      (product_variants ?? []).filter((v) => v.status !== "oculto"),
    );
  }
  return assembleCupCatalog(products, variantsByProduct);
}

/** Subcategorías de MatrixLab Tumbler, en orden comercial (para su landing). */
export async function getTumblerSubcategories(): Promise<CategoryRow[]> {
  const all = await getCategories();
  const order = TUMBLER_SUBCATEGORY_HANDLES as readonly string[];
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
    ).map(presentProduct);
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

  const { data, error } = await raceRead<ProductRow[]>(
    query as unknown as PromiseLike<ReadResult<ProductRow[]>>,
  );
  if (error || !data) return [];
  return data.map(presentProduct);
}

export async function getAllVisibleProducts(): Promise<ProductRow[]> {
  const client = getCatalogClient();
  if (!client) return [...MOCK_PRODUCTS].map(presentProduct);
  const { data, error } = await raceRead<ProductRow[]>(
    client
      .from("products")
      .select("*")
      .in("status", [...VISIBLE_PRODUCT_FILTER])
      .order("created_at", { ascending: false })
      .limit(60) as unknown as PromiseLike<ReadResult<ProductRow[]>>,
  );
  if (error || !data) return [];
  return data.map(presentProduct);
}

export async function getProductByHandle(
  handle: string,
): Promise<ProductWithVariants | null> {
  if (!isValidHandle(handle)) return null;
  const client = getCatalogClient();
  if (!client) {
    const mock = MOCK_PRODUCTS.find((p) => p.handle === handle);
    if (!mock || mock.status === "oculto") return null;
    const mockCategory = MOCK_CATEGORIES.find((c) => c.id === mock.category_id);
    return {
      ...presentProduct(mock),
      variants: MOCK_VARIANTS.filter(
        (v) => v.product_id === mock.id && v.status !== "oculto",
      ),
      category: mockCategory ? fixCategoryText(mockCategory) : null,
    };
  }

  type HandleRow = ProductRow & {
    product_variants: ProductVariantRow[] | null;
    categories: Pick<CategoryRow, "id" | "title" | "handle"> | null;
  };
  const { data, error } = await raceRead<HandleRow>(
    client
      .from("products")
      .select("*, product_variants(*), categories(id, title, handle)")
      .eq("handle", handle)
      .in("status", [...VISIBLE_PRODUCT_FILTER])
      .maybeSingle() as unknown as PromiseLike<ReadResult<HandleRow>>,
  );
  if (error || !data) return null;

  const row = data;
  return {
    ...presentProduct(row),
    variants: (row.product_variants ?? []).filter((v) => v.status !== "oculto"),
    category: row.categories
      ? { ...row.categories, title: repairMojibake(row.categories.title) }
      : null,
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
/**
 * Cliente Supabase dedicado del resolver, con la URL NORMALIZADA.
 *
 * PGRST125 ("Invalid path specified in request URL") aparece cuando la ruta
 * REST queda malformada — típicamente porque SUPABASE_URL trae un slash final
 * o un segmento `/rest/v1` extra. Aquí limpiamos esos casos antes de crear el
 * cliente, sin tocar los clientes compartidos (anon/service) del resto de la
 * app. Prefiere service role (server-side); si no hay, usa anon key.
 */
let cachedSchoolClient: SupabaseClient | null = null;
function getSchoolLabelsClient(): {
  client: SupabaseClient | null;
  usingServiceRole: boolean;
} {
  const env = getServerEnv();
  const rawUrl = env.supabaseUrl;
  const key = env.supabaseServiceRoleKey ?? env.supabaseAnonKey;
  if (!rawUrl || !key) {
    return { client: null, usingServiceRole: false };
  }
  const url = rawUrl
    .trim()
    .replace(/\/+$/, "") // sin slash(es) final(es)
    .replace(/\/rest\/v1\/?$/i, "") // sin segmento /rest/v1 accidental
    .replace(/\/+$/, "");
  if (!cachedSchoolClient) {
    cachedSchoolClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return {
    client: cachedSchoolClient,
    usingServiceRole: Boolean(env.supabaseServiceRoleKey),
  };
}

export async function getDesignerBaseProduct(
  handle: string,
): Promise<ProductWithVariants | null> {
  // Normaliza SIEMPRE al handle real de producción vía el mapa canónico:
  // si llega un tipo de diseñador o alias de ruta ("playera", "laser",
  // "stickers-planilla", …) se traduce a su handle real
  // ("playera-personalizada", "grabado-laser-personalizado",
  // "planilla-stickers", …) antes de consultar. Así ningún lookup "viejo"
  // vuelve a caer en modo previsualización con el producto sí existente.
  //
  // NOTA: aquí NO hay presupuesto global. El presupuesto rígido anterior
  // (9s totales sobre lecturas secuenciales de 4s + reintentos) cortaba la
  // función a los 9.01s y producía un falso "read-timeout" con el producto
  // existente en Supabase. Ahora el resolver hace UNA sola lectura con su
  // propio límite (15s) y máximo un reintento transitorio.
  const canonical = resolveDesignerHandle(handle);
  const resolved = await resolveDesignerBaseProduct(canonical);
  if (resolved) return resolved;
  // Último respaldo: si la entrada original era distinta al handle canónico
  // (caso anómalo: la base usa el alias como handle), intenta la consulta
  // literal antes de rendirse.
  if (canonical !== handle && isValidHandle(handle)) {
    return resolveDesignerBaseProduct(handle);
  }
  return null;
}

/**
 * Timeout de la ÚNICA lectura del resolver del laboratorio (producto +
 * variantes embebidas en un solo round-trip). Holgado a propósito: un cold
 * start serverless + TLS + región cruzada puede superar por mucho los 4s del
 * catálogo general, y un falso timeout manda el diseñador a previsualización
 * con el producto existente.
 */
const DESIGNER_READ_TIMEOUT_MS = 15_000;

/** Espera corta antes del único reintento por fallo transitorio. */
const DESIGNER_RETRY_DELAY_MS = 350;

/**
 * ¿El error de lectura es transitorio (timeout, conexión, 429, 5xx)?
 * Solo estos casos justifican UN reintento; un resultado limpio sin fila
 * (found:false sin error) jamás se reintenta.
 */
function isTransientReadError(
  err: { code?: string; message?: string } | null | undefined,
): boolean {
  if (!err) return false;
  const message = (err.message ?? "").toLowerCase();
  const code = String(err.code ?? "");
  return (
    message.includes("timeout") || // read-timeout local o gateway timeout
    message.includes("fetch failed") || // undici: DNS/TLS/conexión
    message.includes("network") ||
    message.includes("socket") ||
    message.includes("econn") ||
    message.includes("aborted") ||
    message.includes("too many requests") ||
    message.includes("bad gateway") ||
    message.includes("service unavailable") ||
    code === "429" ||
    /^5\d\d$/.test(code)
  );
}

/**
 * Producto base de RESPALDO para el laboratorio, construido desde los mocks.
 *
 * Se usa cuando el catálogo real (Supabase) no tiene el producto base: el
 * diseñador abre en modo previsualización/cotización en lugar de bloquear la
 * página. Este producto NUNCA debe llegar a guardar/carrito (los diseñadores
 * deshabilitan esas acciones en modo previsualización): sus ids son los
 * canónicos de seeds/mocks y pueden no existir en la base de datos.
 */
export function getDesignerFallbackProduct(
  handle: string,
): ProductWithVariants | null {
  // Mismo mapeo canónico que el resolver real: los mocks de respaldo viven
  // bajo los handles reales de producción.
  const canonical = resolveDesignerHandle(handle);
  if (!isValidHandle(canonical)) return null;
  return mockDesignerProduct(canonical);
}

function mockDesignerProduct(handle: string): ProductWithVariants | null {
  const mock = MOCK_PRODUCTS.find((p) => p.handle === handle);
  if (!mock || mock.status === "oculto") return null;
  return {
    ...mock,
    variants: MOCK_VARIANTS.filter(
      (v) => v.product_id === mock.id && v.status !== "oculto",
    ),
    category: MOCK_CATEGORIES.find((c) => c.id === mock.category_id) ?? null,
  };
}

/** Fila embebida de la lectura única del resolver (producto + variantes). */
type DesignerEmbeddedRow = ProductRow & {
  product_variants: ProductVariantRow[] | null;
};

async function resolveDesignerBaseProduct(
  handle: string,
): Promise<ProductWithVariants | null> {
  if (!isValidHandle(handle)) return null;

  const { client, usingServiceRole } = getSchoolLabelsClient();
  if (!client) {
    return mockDesignerProduct(handle);
  }

  // UNA SOLA lectura: producto + variantes embebidas por la FK real
  // (product_variants.product_id → products.id), el mismo embed que ya usa el
  // catálogo público (getProductByHandle). Un solo round-trip: las lecturas
  // secuenciales bajo presupuesto global producían falsos timeouts con la
  // fila existente (ver docs/PRODUCTION_QA_HOTFIX.md, Hotfix 4).
  const readOnce = () =>
    raceRead<DesignerEmbeddedRow[]>(
      client
        .from("products")
        .select("*, product_variants(*)")
        .eq("handle", handle)
        .limit(1) as unknown as PromiseLike<ReadResult<DesignerEmbeddedRow[]>>,
      DESIGNER_READ_TIMEOUT_MS,
    );

  let { data: rows, error: readError } = await readOnce();
  // Reintento ÚNICO y solo ante fallos realmente transitorios (timeout,
  // conexión, 429, 5xx), con espera corta. Un resultado limpio sin fila
  // ([] sin error) NUNCA se reintenta ni se cachea: cada request vuelve a
  // consultar (las rutas del diseñador son force-dynamic).
  if (isTransientReadError(readError as { code?: string; message?: string } | null)) {
    await new Promise((resolve) => setTimeout(resolve, DESIGNER_RETRY_DELAY_MS));
    ({ data: rows, error: readError } = await readOnce());
  }

  const row = (rows ?? [])[0] ?? null;
  const err = readError as { code?: string; message?: string } | null;
  const variants = row
    ? (row.product_variants ?? []).filter((v) => v.status !== "oculto")
    : [];

  if (!row) {
    console.warn("[designer] lookup de producto base sin resultado", {
      handle,
      usingServiceRole,
      errorCode: err?.code ?? null,
      errorMessage: err?.message ?? null,
    });
    // Doble fallo transitorio: la red hacia Supabase está caída AHORA; un
    // tercer intento por el otro path solo sumaría otro timeout al render.
    if (isTransientReadError(err)) return null;
    // Miss limpio o error no transitorio (p. ej. llave service inválida):
    // último respaldo por el path del catálogo público (cliente anon + RLS,
    // una lectura acotada) antes de caer a previsualización.
    const fallback = await getProductByHandle(handle);
    if (fallback) {
      if (fallback.status === "oculto" || !fallback.is_customizable) {
        return null;
      }
      return fallback;
    }
    return null;
  }

  // Estados válidos para el diseñador: cualquiera visible ('disponible' y
  // 'sobre_pedido' incluidos) con is_customizable = true. Los personalizados
  // se fabrican bajo pedido: NUNCA se exige stock físico aquí.
  if (row.status === "oculto" || !row.is_customizable) return null;

  const { product_variants: _pv, ...product } = row;
  void _pv;
  return {
    ...product,
    variants,
    category: null,
  };
}

/**
 * Mapa handle de producto base → tipo del diseñador (para el CTA
 * "Personalizar en el laboratorio" en la página de producto). Derivado de la
 * FUENTE ÚNICA de verdad en lib/designer/product-handles.ts — no editar aquí.
 */
export const DESIGNER_PRODUCT_HANDLES: Record<string, DesignerProductType> =
  DESIGNER_HANDLE_TO_TYPE;

// Re-exports del mapeo canónico (fuente: lib/designer/product-handles.ts).
export { DESIGNER_TYPE_TO_HANDLE } from "@/lib/designer/product-catalog";
export {
  DESIGNER_PRODUCT_HANDLE_MAP,
  resolveDesignerHandle,
} from "@/lib/designer/product-handles";

// ---------------------------------------------------------------------------
// MatrixLab Stickers / Wear / 3D — catálogos por CÓDIGO
// ---------------------------------------------------------------------------
/**
 * Estas tres líneas comparten una diferencia IMPORTANTE con Sparkles, UV
 * Stickers de Tumbler y Vasos: sus Excel llegaron con la columna Precio VACÍA
 * en las 217 filas, así que todavía NO existen como productos vendibles en la
 * base (el seed está bloqueado hasta que se confirmen precios).
 *
 * Por eso el ensamblado es una VITRINA COMPLETA y no un join estricto: emite
 * SIEMPRE una tarjeta por cada fila del Excel, y le adjunta el producto real
 * de Supabase sólo cuando ya existe. Consecuencias:
 *
 *   * el Preview muestra los 110 / 100 / 7 diseños aunque el seed no se haya
 *     ejecutado nunca;
 *   * el precio y el stock que se muestran vienen SIEMPRE de la variante real
 *     (nunca del Excel ni del frontend), y si no hay variante la tarjeta dice
 *     "Precio por confirmar" en lugar de inventar una cifra;
 *   * `sellable` exige producto + variante + precio resuelto, así que ninguna
 *     tarjeta puede agregarse al carrito mientras el precio esté pendiente.
 *
 * Cada línea tiene su propia implementación (igual que Sparkles/Stickers/Vasos
 * ya son paralelas entre sí): una puede resolver precios sin arrastrar a las
 * otras dos.
 */

/** Productos genéricos previos de la categoría, que NO se borran. */
type LegacyProducts = ProductRow[];

/** Lee productos + variantes visibles de una categoría (base o mocks). */
async function readCategoryProducts(categoryId: string): Promise<{
  products: ProductRow[];
  variantsByProduct: Map<string, ProductVariantRow[]>;
}> {
  // Sin fila de categoría no hay nada que consultar. Se corta ANTES de pegarle
  // a la base: `category_id` es `uuid`, así que filtrar por "" devolvería un
  // 400 ("invalid input syntax for type uuid") en cada render.
  if (!categoryId) {
    return { products: [], variantsByProduct: new Map() };
  }
  const client = getCatalogClient();
  if (!client) {
    const products = MOCK_PRODUCTS.filter(
      (p) => p.category_id === categoryId && p.status !== "oculto",
    ).map(fixProductText);
    const variantsByProduct = new Map<string, ProductVariantRow[]>();
    for (const v of MOCK_VARIANTS) {
      if (v.status === "oculto") continue;
      variantsByProduct.set(v.product_id, [
        ...(variantsByProduct.get(v.product_id) ?? []),
        v,
      ]);
    }
    return { products, variantsByProduct };
  }
  const { data, error } = await raceRead<ProductWithVariantRows[]>(
    client
      .from("products")
      .select("*, product_variants(*)")
      .eq("category_id", categoryId)
      .in("status", [...VISIBLE_PRODUCT_FILTER]) as unknown as PromiseLike<
      ReadResult<ProductWithVariantRows[]>
    >,
  );
  if (error || !data) {
    return { products: [], variantsByProduct: new Map() };
  }
  const variantsByProduct = new Map<string, ProductVariantRow[]>();
  const products: ProductRow[] = [];
  for (const row of data) {
    const { product_variants, ...product } = row;
    products.push(fixProductText(product as ProductRow));
    variantsByProduct.set(
      product.id,
      (product_variants ?? []).filter((v) => v.status !== "oculto"),
    );
  }
  return { products, variantsByProduct };
}

/**
 * Precio y estado de venta de una fila, resueltos SIEMPRE contra la base.
 * Devuelve `price: null` cuando el precio aún no está confirmado: la tarjeta
 * muestra "Precio por confirmar" y no se puede agregar al carrito.
 */
function resolvePendingPricing(
  product: ProductRow | null,
  variants: ProductVariantRow[],
  /**
   * Precio de catálogo YA confirmado comercialmente para la línea. Se usa
   * SÓLO para mostrar precio mientras el producto no existe en base (seed sin
   * ejecutar). Nunca sustituye al precio real de la variante: si la variante
   * existe, manda la variante. `null` = línea con precio aún pendiente.
   */
  catalogPrice: number | null = null,
): {
  variantId: string | null;
  price: number | null;
  stock: number | null;
  sellable: boolean;
} {
  if (!product) {
    // Sin producto en base no hay nada vendible, pero sí puede haber un precio
    // de catálogo confirmado que mostrar (no es un precio inventado).
    return {
      variantId: null,
      price: catalogPrice,
      stock: null,
      sellable: false,
    };
  }
  const variant =
    variants.find((v) => v.status !== "oculto") ?? variants[0] ?? null;
  const rawPrice = variant?.price ?? product.base_price;
  const price =
    rawPrice === null || rawPrice === undefined ? null : Number(rawPrice);
  // Un precio de 0 o negativo NO es un precio confirmado: es una celda vacía
  // que llegó hasta la base. Se trata como pendiente, nunca como gratis.
  const priceConfirmed = price !== null && Number.isFinite(price) && price > 0;
  const stock = variant ? variant.stock : 0;
  const onDemand =
    product.status === "sobre_pedido" || variant?.status === "sobre_pedido";
  const sellable =
    priceConfirmed &&
    variant !== null &&
    ["disponible", "sobre_pedido"].includes(product.status) &&
    !["agotado", "oculto"].includes(variant.status ?? "disponible") &&
    (onDemand || stock > 0);
  return {
    variantId: variant?.id ?? null,
    price: priceConfirmed ? price : null,
    stock,
    sellable,
  };
}

/** Foto resuelta por CÓDIGO: archivo real si existe, si no el placeholder. */
function resolveCodeImage(
  product: ProductRow | null,
  rel: string,
  placeholder: string,
): string {
  const curated = product?.images;
  if (Array.isArray(curated) && curated.length > 0) return curated[0];
  return publicImageExists(rel) ? rel : placeholder;
}

/**
 * Foto de un diseño de MatrixLab Wear resuelta por CÓDIGO, para usarse FUERA
 * del catálogo (hoy: la referencia del diseño elegido dentro del Laboratorio).
 *
 * Existe para que ningún consumidor arme la ruta a mano: mientras no se suban
 * las fotos reales, `public/images/matrixlab-wear/` sólo tiene el placeholder,
 * así que apuntar directo a `<codigo>.webp` daría una imagen rota.
 */
export function resolveMatrixLabWearImage(code: string): string {
  return resolveCodeImage(
    null,
    matrixLabWearImagePath(code),
    MATRIXLAB_WEAR_PLACEHOLDER_IMAGE,
  );
}

// --- MatrixLab Stickers ----------------------------------------------------

export interface MatrixLabStickerCatalogEntry {
  /** Fila del Excel (nombre, categoría, descripción, acabado, handle). */
  item: MatrixLabStickerItem;
  /** Handle público del Excel (columna L). */
  handle: string;
  /** Título real en base si el producto existe; si no, el nombre del Excel. */
  title: string;
  /** Producto en Supabase; `null` mientras el seed siga bloqueado. */
  productId: string | null;
  variantId: string | null;
  /** SKU determinista (STK-<código>), siempre presente. */
  sku: string;
  /** Precio resuelto en servidor. `null` = pendiente de confirmar. */
  price: number | null;
  /** Inventario real de la variante; `null` si aún no hay variante. */
  stock: number | null;
  /** Unidades declaradas en el Excel (columna H). */
  declaredInventory: number;
  /** Imagen resuelta por código (foto real o placeholder de marca). */
  image: string;
  /** Producto vendible: producto + variante + precio confirmado. */
  sellable: boolean;
}

export interface MatrixLabStickerCatalog {
  /** Los 110 diseños del Excel, en el orden EXACTO del Excel. */
  entries: MatrixLabStickerCatalogEntry[];
  /** Cuántos diseños siguen sin precio confirmado. */
  pricePending: number;
  /** Productos genéricos previos de la categoría: se ocultan, NO se borran. */
  legacyHidden: ProductRow[];
}

/** Catálogo MatrixLab Stickers: 110 diseños del Excel + datos reales de base. */
export async function getMatrixLabStickersCatalog(
  categoryId: string,
): Promise<MatrixLabStickerCatalog> {
  const { products, variantsByProduct } = await readCategoryProducts(categoryId);
  const byHandle = new Map(products.map((p) => [p.handle, p]));
  const entries: MatrixLabStickerCatalogEntry[] = [];
  for (const item of MATRIXLAB_STICKERS) {
    const product = byHandle.get(item.handle) ?? null;
    const pricing = resolvePendingPricing(
      product,
      product ? (variantsByProduct.get(product.id) ?? []) : [],
      // Precio único confirmado de la línea ($10/pieza): ya no está pendiente.
      matrixLabStickerPrice(),
    );
    entries.push({
      item,
      handle: item.handle,
      title: product?.title ?? item.name,
      productId: product?.id ?? null,
      variantId: pricing.variantId,
      sku: matrixLabStickerSku(item.code),
      price: pricing.price,
      stock: pricing.stock,
      declaredInventory: item.inventory,
      image: resolveCodeImage(
        product,
        matrixLabStickerImagePath(item.code),
        MATRIXLAB_STICKER_PLACEHOLDER_IMAGE,
      ),
      sellable: pricing.sellable,
    });
  }
  const legacyHidden: LegacyProducts = products.filter(
    (p) => !matrixLabStickerByHandle(p.handle),
  );
  return {
    entries,
    pricePending: entries.filter((e) => e.price === null).length,
    legacyHidden,
  };
}

// --- MatrixLab Wear --------------------------------------------------------

export interface MatrixLabWearCatalogEntry {
  /** Fila del Excel (nombre, categoría, descripción, prenda, color, talla). */
  item: MatrixLabWearItem;
  /** Handle estable derivado del CÓDIGO (`wear-<código>`). */
  handle: string;
  title: string;
  productId: string | null;
  variantId: string | null;
  /** SKU determinista (WEAR-<código>), siempre presente. */
  sku: string;
  /** Precio resuelto en servidor. `null` = pendiente de confirmar. */
  price: number | null;
  stock: number | null;
  /** Unidades declaradas por DISEÑO (columna J), no por talla/color. */
  declaredInventory: number;
  image: string;
  sellable: boolean;
  /** Color y/o talla siguen como "Por definir" en el Excel. */
  needsDefinition: boolean;
}

export interface MatrixLabWearCatalog {
  /** Los 100 diseños del Excel, en el orden EXACTO del Excel. */
  entries: MatrixLabWearCatalogEntry[];
  pricePending: number;
  legacyHidden: ProductRow[];
}

/**
 * Catálogo MatrixLab Wear: 100 DISEÑOS del Excel.
 *
 * No crea ni consulta variantes de talla/color por diseño: la talla y el color
 * se eligen en el Laboratorio (`/tienda/disenador/playera`), que ya tiene ese
 * modelo (variantes reales del producto base `playera-personalizada`).
 */
export async function getMatrixLabWearCatalog(
  categoryId: string,
): Promise<MatrixLabWearCatalog> {
  const { products, variantsByProduct } = await readCategoryProducts(categoryId);
  const byHandle = new Map(products.map((p) => [p.handle, p]));
  const entries: MatrixLabWearCatalogEntry[] = [];
  for (const item of MATRIXLAB_WEAR) {
    const handle = matrixLabWearHandle(item.code);
    const product = byHandle.get(handle) ?? null;
    const pricing = resolvePendingPricing(
      product,
      product ? (variantsByProduct.get(product.id) ?? []) : [],
    );
    entries.push({
      item,
      handle,
      title: product?.title ?? item.name,
      productId: product?.id ?? null,
      variantId: pricing.variantId,
      sku: matrixLabWearSku(item.code),
      price: pricing.price,
      stock: pricing.stock,
      declaredInventory: item.inventory,
      image: resolveCodeImage(
        product,
        matrixLabWearImagePath(item.code),
        MATRIXLAB_WEAR_PLACEHOLDER_IMAGE,
      ),
      sellable: pricing.sellable,
      needsDefinition: matrixLabWearNeedsDefinition(item),
    });
  }
  const legacyHidden: LegacyProducts = products.filter(
    (p) => !matrixLabWearByHandle(p.handle),
  );
  return {
    entries,
    pricePending: entries.filter((e) => e.price === null).length,
    legacyHidden,
  };
}

// --- MatrixLab 3D ----------------------------------------------------------

export interface MatrixLab3dCatalogEntry {
  /** Fila del Excel (nombre, categoría, uso, acabado, personalizable). */
  item: MatrixLab3dItem;
  /** Handle estable derivado del CÓDIGO (`ml3d-<código>`). */
  handle: string;
  title: string;
  productId: string | null;
  variantId: string | null;
  /** SKU determinista (ML3D-<código>), siempre presente. */
  sku: string;
  /** Precio resuelto en servidor. `null` = pendiente de confirmar. */
  price: number | null;
  stock: number | null;
  /** Unidades declaradas en el Excel (columna I). */
  declaredInventory: number;
  image: string;
  sellable: boolean;
}

export interface MatrixLab3dCatalog {
  /** Las 7 piezas del Excel, en el orden EXACTO del Excel. */
  entries: MatrixLab3dCatalogEntry[];
  pricePending: number;
  legacyHidden: ProductRow[];
}

/** Catálogo MatrixLab 3D: 7 piezas del Excel + datos reales de base. */
export async function getMatrixLab3dCatalog(
  categoryId: string,
): Promise<MatrixLab3dCatalog> {
  const { products, variantsByProduct } = await readCategoryProducts(categoryId);
  const byHandle = new Map(products.map((p) => [p.handle, p]));
  const entries: MatrixLab3dCatalogEntry[] = [];
  for (const item of MATRIXLAB_3D) {
    const handle = matrixLab3dHandle(item.code);
    const product = byHandle.get(handle) ?? null;
    const pricing = resolvePendingPricing(
      product,
      product ? (variantsByProduct.get(product.id) ?? []) : [],
    );
    entries.push({
      item,
      handle,
      title: product?.title ?? item.name,
      productId: product?.id ?? null,
      variantId: pricing.variantId,
      sku: matrixLab3dSku(item.code),
      price: pricing.price,
      stock: pricing.stock,
      declaredInventory: item.inventory,
      image: resolveCodeImage(
        product,
        matrixLab3dImagePath(item.code),
        MATRIXLAB_3D_PLACEHOLDER_IMAGE,
      ),
      sellable: pricing.sellable,
    });
  }
  const legacyHidden: LegacyProducts = products.filter(
    (p) => !matrixLab3dByHandle(p.handle),
  );
  return {
    entries,
    pricePending: entries.filter((e) => e.price === null).length,
    legacyHidden,
  };
}

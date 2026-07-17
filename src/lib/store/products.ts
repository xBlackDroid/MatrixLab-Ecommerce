import "server-only";

import { existsSync } from "node:fs";
import { join } from "node:path";
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
 * Imagen de la categoría: si existe `public/images/categories/<handle>.png`
 * (o .webp) se usa esa; si el admin configuró una URL remota, se respeta; y si
 * no hay nada, queda null y la UI cae a su icono (nunca una imagen rota).
 */
function resolveCategoryImage(c: CategoryRow): string | null {
  for (const ext of ["png", "webp"] as const) {
    const rel = `/images/categories/${c.handle}.${ext}`;
    if (existsSync(join(process.cwd(), "public", rel))) return rel;
  }
  if (c.image_url && /^https?:\/\//.test(c.image_url)) return c.image_url;
  return null;
}

/** Pipeline de presentación pública de una categoría. */
function presentCategory(c: CategoryRow): CategoryRow {
  const branded = normalizeTumblerCategory(fixCategoryText(c));
  return { ...branded, image_url: resolveCategoryImage(branded) };
}

/**
 * Categorías que NO se muestran como tarjetas públicas en /tienda. No se borran
 * de la base de datos ni de sus rutas: solo se ocultan del grid del catálogo.
 * Son las subcategorías internas de "MatrixLab Tumbler" (SnowGlobe Bar,
 * Llaveros, Tags de acrílico, Acrylab, Creator Tools, Sparkle Mix, Magic Flow,
 * Wraps & Glow Finish): siguen vivas como handles/seeds/productos y como
 * bloques dentro de la landing de MatrixLab Tumbler, pero la única tarjeta
 * pública de la línea es la categoría madre.
 */
export const PUBLIC_HIDDEN_CATEGORY_HANDLES: ReadonlySet<string> = new Set([
  "snowglobe",
  "llaveros",
  "tags-acrilico",
  "acrilicos",
  "accesorios-personalizacion",
  "repuestos-consumibles",
  "magic-flow",
  "wraps-glow-finish",
]);

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

/**
 * Categorías para el GRID público de /tienda: las activas menos las
 * subcategorías internas de MatrixLab Tumbler (ver
 * PUBLIC_HIDDEN_CATEGORY_HANDLES). Las rutas de esas categorías siguen vivas;
 * solo no aparecen como tarjetas en el catálogo.
 */
export async function getPublicStoreCategories(): Promise<CategoryRow[]> {
  const all = await getCategories();
  return all.filter((c) => !PUBLIC_HIDDEN_CATEGORY_HANDLES.has(c.handle));
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
    ).map(fixProductText);
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
  return data.map(fixProductText);
}

export async function getAllVisibleProducts(): Promise<ProductRow[]> {
  const client = getCatalogClient();
  if (!client) return [...MOCK_PRODUCTS].map(fixProductText);
  const { data, error } = await raceRead<ProductRow[]>(
    client
      .from("products")
      .select("*")
      .in("status", [...VISIBLE_PRODUCT_FILTER])
      .order("created_at", { ascending: false })
      .limit(60) as unknown as PromiseLike<ReadResult<ProductRow[]>>,
  );
  if (error || !data) return [];
  return data.map(fixProductText);
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
      ...fixProductText(mock),
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
    ...fixProductText(row),
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

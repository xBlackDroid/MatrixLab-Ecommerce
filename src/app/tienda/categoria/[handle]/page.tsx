import type { ComponentType, SVGProps } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CupSoda,
  Droplets,
  Gem,
  Layers,
  MessageCircle,
  Sparkles,
  Sticker,
} from "lucide-react";
import ProductGrid from "@/components/store/ProductGrid";
import SparklesCatalog from "@/components/store/SparklesCatalog";
import TumblerCupsCatalog from "@/components/store/TumblerCupsCatalog";
import TumblerStickersCatalog from "@/components/store/TumblerStickersCatalog";
import MatrixLabStickersCatalog from "@/components/store/MatrixLabStickersCatalog";
import MatrixLabWearCatalog from "@/components/store/MatrixLabWearCatalog";
import MatrixLab3DCatalog from "@/components/store/MatrixLab3DCatalog";
import SortSelect from "@/components/store/SortSelect";
import {
  getCategoryByHandle,
  getProductsByCategory,
  getCupCatalog,
  getSparkleCatalog,
  getStickerCatalog,
  getMatrixLabStickersCatalog,
  getMatrixLabWearCatalog,
  getMatrixLab3dCatalog,
  getTumblerSubcategories,
  LEGACY_TUMBLER_PARENT_HANDLE,
  TUMBLER_PARENT_HANDLE,
} from "@/lib/store/products";
import type { CategoryRow } from "@/lib/db/types";
import { SPARKLES_CATEGORY_HANDLE } from "@/lib/store/tumbler-sparkles";
import {
  STICKERS_CATEGORY_HANDLE,
  STICKERS_PUBLIC_TITLE,
} from "@/lib/store/tumbler-stickers";
import { CUPS_CATEGORY_HANDLE } from "@/lib/store/tumbler-cups";
import {
  MATRIXLAB_STICKERS_CATEGORY_HANDLE,
  MATRIXLAB_STICKERS_PUBLIC_TITLE,
} from "@/lib/store/matrixlab-stickers";
import {
  MATRIXLAB_WEAR_CATEGORY_HANDLE,
  MATRIXLAB_WEAR_PUBLIC_TITLE,
} from "@/lib/store/matrixlab-wear";
import {
  MATRIXLAB_3D_CATEGORY_HANDLE,
  MATRIXLAB_3D_PUBLIC_TITLE,
} from "@/lib/store/matrixlab-3d";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { ProductSortSchema } from "@/lib/validation/store";

export const dynamic = "force-dynamic";

/**
 * Categorías CURADAS enlazadas desde la home / tienda. Si la base de datos aún
 * no tiene la fila (p. ej. seed pendiente en producción), la ruta NO da 404:
 * muestra una página "Próximamente" con CTA de WhatsApp. Cualquier handle
 * fuera de esta whitelist sigue dando 404 normal.
 */
const CURATED_CATEGORY_FALLBACKS: Record<
  string,
  { title: string; description: string; whatsapp: string }
> = {
  stickers: {
    // Nombre público (mismo rebrand de presentación que aplica
    // PUBLIC_CATEGORY_TITLES; el handle /categoria/stickers no cambia).
    title: "MatrixLab Stickers",
    description:
      "Stickers personalizados para marcas, eventos, regalos, campañas, empaques y colecciones.",
    whatsapp: "Hola MatrixLab, quiero cotizar stickers personalizados.",
  },
  imanes: {
    title: "Imanes",
    description:
      "Imanes personalizados para refrigerador, eventos, recuerdos, marcas y promociones.",
    whatsapp: "Hola MatrixLab, quiero cotizar imanes personalizados.",
  },
  "impresion-3d": {
    // Nombre público; el handle /categoria/impresion-3d no cambia.
    title: "MatrixLab 3D",
    description:
      "Piezas únicas, prototipos, decoración, accesorios y objetos personalizados capa por capa.",
    whatsapp: "Hola MatrixLab, quiero cotizar una pieza de impresión 3D.",
  },
  "etiquetas-escolares": {
    title: "Etiquetas escolares",
    description:
      "Packs personalizados para útiles, loncheras, termos, cuadernos y regreso a clases.",
    whatsapp: "Hola MatrixLab, quiero cotizar etiquetas escolares personalizadas.",
  },
  [TUMBLER_PARENT_HANDLE]: {
    title: "MatrixLab Tumbler",
    description:
      "Insumos, accesorios y materiales para vasos, termos y proyectos snow globe.",
    whatsapp: "Hola MatrixLab, busco un insumo de MatrixLab Tumbler.",
  },
};

/**
 * Nombre público de marca de las tres líneas nuevas. Es SOLO presentación: ni
 * el handle ni la fila de `categories` cambian, así que
 * /tienda/categoria/stickers, /playeras-prendas e /impresion-3d siguen siendo
 * las mismas rutas de siempre.
 */
const MATRIXLAB_PUBLIC_TITLES: Record<string, string> = {
  [MATRIXLAB_STICKERS_CATEGORY_HANDLE]: MATRIXLAB_STICKERS_PUBLIC_TITLE,
  [MATRIXLAB_WEAR_CATEGORY_HANDLE]: MATRIXLAB_WEAR_PUBLIC_TITLE,
  [MATRIXLAB_3D_CATEGORY_HANDLE]: MATRIXLAB_3D_PUBLIC_TITLE,
};

/**
 * Lookup seguro en la whitelist de categorías curadas.
 *
 * Un índice directo heredaría claves del prototipo: `isValidHandle` acepta
 * `/^[a-z0-9-]+$/`, así que /tienda/categoria/constructor devolvía la función
 * `Object` —un valor truthy— y la ruta respondía 200 con una página sin
 * título en lugar del 404 que corresponde.
 */
function curatedFallback(
  handle: string,
): { title: string; description: string; whatsapp: string } | null {
  return Object.hasOwn(CURATED_CATEGORY_FALLBACKS, handle)
    ? CURATED_CATEGORY_FALLBACKS[handle]
    : null;
}

interface CategoryPageProps {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ orden?: string }>;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { handle } = await params;
  const category = await getCategoryByHandle(handle);
  // Las tres líneas nuevas publican su nombre de marca aunque la categoría
  // todavía no tenga fila en la base (su seed sigue bloqueado por precios).
  // `Object.hasOwn` y no un índice directo: un handle válido según
  // `isValidHandle` como "constructor" heredaría una clave del prototipo y
  // devolvería una función como título.
  const matrixLabTitle = Object.hasOwn(MATRIXLAB_PUBLIC_TITLES, handle)
    ? MATRIXLAB_PUBLIC_TITLES[handle]
    : null;
  if (matrixLabTitle) {
    const description =
      category?.description ?? curatedFallback(handle)?.description;
    return {
      title: matrixLabTitle,
      description,
      openGraph: {
        title: `${matrixLabTitle} | Tienda MatrixLab`,
        description,
      },
    };
  }
  if (!category) {
    const fallback = curatedFallback(handle);
    if (fallback) {
      return { title: fallback.title, description: fallback.description };
    }
    return { title: "Categoría" };
  }
  return {
    title: category.title,
    description:
      category.description ??
      `Descubre ${category.title} personalizados en la Tienda MatrixLab.`,
    openGraph: {
      title: `${category.title} | Tienda MatrixLab`,
      description: category.description ?? undefined,
    },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { handle } = await params;
  const { orden } = await searchParams;

  // Compatibilidad: el handle histórico de la línea de vasos/insumos redirige
  // a la URL pública oficial de MatrixLab Tumbler.
  if (handle === LEGACY_TUMBLER_PARENT_HANDLE) {
    redirect(`/tienda/categoria/${TUMBLER_PARENT_HANDLE}`);
  }

  const category = await getCategoryByHandle(handle);

  // MatrixLab Stickers / Wear / 3D publican el catálogo real del Excel. A
  // diferencia de las líneas de Tumbler, su seed sigue BLOQUEADO por precios
  // pendientes, así que el catálogo NO depende de que existan filas en
  // `products`: se arma desde el Excel y toma de la base sólo lo que ya
  // exista. Por eso se resuelve ANTES del "Próximamente": aunque la categoría
  // aún no esté sembrada, la vitrina se ve completa.
  const isMatrixLabStickers = handle === MATRIXLAB_STICKERS_CATEGORY_HANDLE;
  const isMatrixLabWear = handle === MATRIXLAB_WEAR_CATEGORY_HANDLE;
  const isMatrixLab3d = handle === MATRIXLAB_3D_CATEGORY_HANDLE;

  if (isMatrixLabStickers || isMatrixLabWear || isMatrixLab3d) {
    const fallback = curatedFallback(handle);
    const title =
      isMatrixLabStickers
        ? MATRIXLAB_STICKERS_PUBLIC_TITLE
        : isMatrixLabWear
          ? MATRIXLAB_WEAR_PUBLIC_TITLE
          : MATRIXLAB_3D_PUBLIC_TITLE;
    const description =
      category?.description ?? fallback?.description ?? null;
    // Sin fila en base no hay categoryId: el catálogo se arma igual desde el
    // Excel y simplemente no encuentra productos que adjuntar.
    const categoryId = category?.id ?? "";

    if (isMatrixLabStickers) {
      const catalog = await getMatrixLabStickersCatalog(categoryId);
      return (
        <MatrixLabCategoryShell
          title={title}
          description={description}
          imageUrl={category?.image_url ?? null}
          summary={`${catalog.entries.length} diseños`}
        >
          <MatrixLabStickersCatalog
            entries={catalog.entries}
            whatsappUrl={buildWhatsAppUrl(
              "Hola MatrixLab, quiero cotizar stickers de MatrixLab Stickers.",
            )}
          />
        </MatrixLabCategoryShell>
      );
    }

    if (isMatrixLabWear) {
      const catalog = await getMatrixLabWearCatalog(categoryId);
      return (
        <MatrixLabCategoryShell
          title={title}
          description={description}
          imageUrl={category?.image_url ?? null}
          summary={`${catalog.entries.length} diseños`}
        >
          <MatrixLabWearCatalog entries={catalog.entries} />
        </MatrixLabCategoryShell>
      );
    }

    const catalog = await getMatrixLab3dCatalog(categoryId);
    return (
      <MatrixLabCategoryShell
        title={title}
        description={description}
        imageUrl={category?.image_url ?? null}
        summary={`${catalog.entries.length} piezas`}
      >
        <MatrixLab3DCatalog
          entries={catalog.entries}
          whatsappUrl={buildWhatsAppUrl(
            "Hola MatrixLab, quiero cotizar una pieza de MatrixLab 3D.",
          )}
          customizationWhatsappUrl={buildWhatsAppUrl(
            "Hola MatrixLab, quiero personalizar una pieza de MatrixLab 3D.",
          )}
        />
      </MatrixLabCategoryShell>
    );
  }

  if (!category) {
    // Regla de QA: ningún CTA visible de la home puede terminar en 404. Las
    // categorías curadas sin fila en la base muestran "Próximamente".
    const fallback = curatedFallback(handle);
    if (fallback) return <CategoryComingSoon {...fallback} />;
    notFound();
  }

  // "MatrixLab Tumbler" (categoría madre) presenta sus subcategorías
  // comerciales como bloques; no tiene productos propios. El resto de
  // categorías muestra su grilla de productos normal.
  const isTumblerParent = handle === TUMBLER_PARENT_HANDLE;
  const subcategories = isTumblerParent ? await getTumblerSubcategories() : [];

  // Sparkle Mix es un catálogo propio: 46 Sparkles individuales con buscador,
  // filtros por colección y orden fijo del Excel (no usa el selector de orden).
  const isSparkles = handle === SPARKLES_CATEGORY_HANDLE;
  const sparkles = isSparkles ? await getSparkleCatalog(category.id) : null;

  // Wraps & Glow Finish presenta el catálogo real de UV Stickers: productos
  // individuales con buscador, filtros por acabado y orden fijo del Excel
  // (A001 → A209), por lo que tampoco usa el selector de orden.
  const isStickers = handle === STICKERS_CATEGORY_HANDLE;
  const stickers = isStickers ? await getStickerCatalog(category.id) : null;

  // SnowGlobe Bar presenta el catálogo real de vasos: 5 productos en el orden
  // del Excel (V001 → V005). Son pocos y caben en pantalla, así que no lleva
  // buscador ni filtros; tampoco usa el selector de orden. El nombre visible
  // de la categoría NO cambia.
  const isCups = handle === CUPS_CATEGORY_HANDLE;
  const cups = isCups ? await getCupCatalog(category.id) : null;

  // Whitelist de ordenamiento: cualquier valor extraño cae en "newest".
  const sort = ProductSortSchema.parse(orden ?? "newest");
  const products =
    isTumblerParent || isSparkles || isStickers || isCups
      ? []
      : await getProductsByCategory(category.id, sort);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <Link
        href="/tienda"
        className="inline-flex items-center gap-1.5 text-sm text-ml-white/60 transition hover:text-ml-violet"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Volver a la tienda
      </Link>

      <div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="flex items-start gap-4">
          {/* Logo/imagen de la categoría (p. ej. matrixlab-tumbler.png). Si el
              archivo aún no existe, image_url llega null y no se renderiza
              nada: la página nunca muestra una imagen rota. */}
          {category.image_url && (
            <Image
              src={category.image_url}
              alt={category.title}
              width={72}
              height={72}
              className="h-16 w-16 shrink-0 rounded-2xl border border-white/10 object-cover sm:h-[72px] sm:w-[72px]"
            />
          )}
          <div>
            {/* Encabezado público más claro para UV Stickers. Es SOLO
                presentación: el título y el handle de la categoría en base no
                se tocan, así que /tienda/categoria/wraps-glow-finish y las
                referencias internas a "Wraps & Glow Finish" siguen sirviendo. */}
            <h1 className="text-3xl font-bold sm:text-4xl">
              {isStickers ? STICKERS_PUBLIC_TITLE : category.title}
            </h1>
            {/* Alineación de marca SOLO a nivel de presentación: el título y
                el handle de la categoría en base no se tocan (la ruta
                /tienda/categoria/repuestos-consumibles no cambia). */}
            {isSparkles && sparkles && (
              <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-ml-cyan">
                Sparkles · Glitter Chunky — {sparkles.entries.length} colores
              </p>
            )}
            {isStickers && stickers && (
              <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-ml-cyan">
                {category.title} — {stickers.entries.length} diseños disponibles
              </p>
            )}
            {category.description && (
              <p className="mt-3 max-w-2xl text-ml-white/65">
                {category.description}
              </p>
            )}
          </div>
        </div>
        {!isTumblerParent && !isSparkles && !isStickers && !isCups && (
          <SortSelect current={sort} />
        )}
      </div>

      {isTumblerParent ? (
        <TumblerBlocks subcategories={subcategories} />
      ) : cups ? (
        /* Solo los vasos del Excel. Los productos SnowGlobe históricos (kit
           base, vaso para rellenar, vaso de vidrio) siguen en la base y en el
           admin: únicamente se ocultan de ESTA presentación para no mezclarse
           con el catálogo por código. */
        <TumblerCupsCatalog entries={cups.entries} />
      ) : stickers ? (
        /* Solo los UV Stickers del Excel. Los productos genéricos anteriores
           de la categoría (Wrap UV decorativo, Lámina decorativa para vaso,
           Resina UV) siguen en la base y en el admin: únicamente se ocultan de
           ESTA presentación para no mezclarse con el catálogo por código. */
        <TumblerStickersCatalog entries={stickers.entries} />
      ) : sparkles ? (
        /* Solo los 46 Sparkles. Los productos genéricos anteriores de la
           categoría (glitter chunky, mezcla de brillos, mica) siguen en la
           base y en el admin: únicamente se ocultan de ESTA presentación
           para no mezclarse con el catálogo por código. */
        <SparklesCatalog entries={sparkles.entries} />
      ) : (
        <div className="mt-10">
          <ProductGrid products={products} />
        </div>
      )}
    </div>
  );
}

/**
 * Encabezado común de las tres líneas nuevas (MatrixLab Stickers / Wear / 3D).
 *
 * Reutiliza la misma estructura visual que el resto de categorías (volver a la
 * tienda, logo opcional, título, resumen, descripción) pero NO depende de que
 * exista la fila de `categories`: el catálogo se arma desde el Excel.
 */
function MatrixLabCategoryShell({
  title,
  description,
  imageUrl,
  summary,
  children,
}: {
  title: string;
  description: string | null;
  imageUrl: string | null;
  summary: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <Link
        href="/tienda"
        className="inline-flex items-center gap-1.5 text-sm text-ml-white/60 transition hover:text-ml-violet"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Volver a la tienda
      </Link>

      <div className="mt-6 flex items-start gap-4">
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={title}
            width={72}
            height={72}
            className="h-16 w-16 shrink-0 rounded-2xl border border-white/10 object-cover sm:h-[72px] sm:w-[72px]"
          />
        )}
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
          <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-ml-cyan">
            {summary}
          </p>
          {description && (
            <p className="mt-3 max-w-2xl text-ml-white/65">{description}</p>
          )}
        </div>
      </div>

      {children}
    </div>
  );
}

/** Página "Próximamente" para categorías curadas sin fila en la base aún. */
function CategoryComingSoon({
  title,
  description,
  whatsapp,
}: {
  title: string;
  description: string;
  whatsapp: string;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <Link
        href="/tienda"
        className="inline-flex items-center gap-1.5 text-sm text-ml-white/60 transition hover:text-ml-violet"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Volver a la tienda
      </Link>

      <div className="glass mx-auto mt-10 max-w-lg rounded-3xl p-12 text-center">
        <span className="glass inline-flex items-center rounded-full px-4 py-2 text-sm text-ml-cyan">
          Próximamente
        </span>
        <h1 className="mt-5 text-3xl font-bold">{title}</h1>
        <p className="mt-3 text-ml-white/65">{description}</p>
        <p className="mt-3 text-sm text-ml-white/50">
          Estamos preparando esta sección del catálogo. Mientras tanto,
          cuéntanos tu idea y la cotizamos contigo directamente.
        </p>
        <a
          href={buildWhatsAppUrl(whatsapp)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-ml-green px-7 py-3.5 font-semibold text-ml-bg transition hover:bg-ml-green/90"
        >
          <MessageCircle className="h-5 w-5" aria-hidden />
          Cotizar por WhatsApp
        </a>
      </div>
    </div>
  );
}

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

interface TumblerBlockDisplay {
  /** Handle real de la categoría (no se toca en DB; solo se usa para el href
   * y para verificar que la fila exista antes de mostrar la card). */
  handle: string;
  title: string;
  description: string;
  icon: IconComponent;
  accentText: string;
  iconClasses: string;
  gradient: string;
  hover: string;
}

/**
 * Presentación curada de las subcategorías de MatrixLab Tumbler: nombre
 * visible, copy y acento propios por línea, en el orden comercial deseado.
 * SOLO afecta esta página — el título/descripción real en base (y el resto
 * de la app) no cambian. Los handles son los reales de
 * `TUMBLER_SUBCATEGORY_HANDLES`; "llaveros" y "tags-acrilico" quedan fuera a
 * propósito (Tags de acrílico se integra conceptualmente en Acrylab, y
 * Llaveros deja de tener tarjeta propia), pero sus rutas y datos siguen
 * vivos sin cambios.
 */
const TUMBLER_BLOCKS_DISPLAY: TumblerBlockDisplay[] = [
  {
    handle: SPARKLES_CATEGORY_HANDLE, // "repuestos-consumibles"
    title: "Sparkle Mix",
    description:
      "Sparkles, glitter y mezclas decorativas para crear efectos únicos en vasos y proyectos personalizados.",
    icon: Sparkles,
    accentText: "text-ml-violet",
    iconClasses: "bg-ml-violet/15 text-ml-violet",
    gradient: "from-ml-violet/25 via-ml-coral/10 to-transparent",
    hover: "hover:border-ml-violet/50 hover:shadow-glow-violet",
  },
  {
    handle: CUPS_CATEGORY_HANDLE, // "snowglobe"
    title: "SnowGlobe Cups",
    description:
      "Vasos y bases para crear proyectos SnowGlobe, tumblers personalizados y diseños creativos.",
    icon: CupSoda,
    accentText: "text-ml-cyan",
    iconClasses: "bg-ml-cyan/15 text-ml-cyan",
    gradient: "from-ml-cyan/25 via-ml-violet/10 to-transparent",
    hover: "hover:border-ml-cyan/50 hover:shadow-glow-cyan",
  },
  {
    handle: STICKERS_CATEGORY_HANDLE, // "wraps-glow-finish"
    title: "Wraps & Glow Studio",
    description:
      "Stickers UV y wraps premium para transformar vasos y superficies con diseños de alta definición y acabados especiales.",
    icon: Sticker,
    accentText: "text-ml-coral",
    iconClasses: "bg-ml-coral/15 text-ml-coral",
    gradient: "from-ml-coral/25 via-ml-violet/10 to-transparent",
    hover: "hover:border-ml-coral/50 hover:shadow-glow-coral",
  },
  {
    handle: "magic-flow",
    title: "Magic Flow",
    description:
      "Líquidos, bases y mezclas especiales para efectos, movimiento y acabados en proyectos SnowGlobe y Tumbler.",
    icon: Droplets,
    accentText: "text-ml-cyan",
    iconClasses: "bg-ml-cyan/15 text-ml-cyan",
    gradient: "from-ml-cyan/25 via-ml-green/10 to-transparent",
    hover: "hover:border-ml-cyan/50 hover:shadow-glow-cyan",
  },
  {
    handle: "acrilicos",
    title: "Acrylab",
    description:
      "Piezas de acrílico precortadas para llaveros, tags, figuras y proyectos creativos listos para personalizar.",
    icon: Gem,
    accentText: "text-ml-violet",
    iconClasses: "bg-ml-violet/15 text-ml-violet",
    gradient: "from-ml-violet/25 via-ml-cyan/10 to-transparent",
    hover: "hover:border-ml-violet/50 hover:shadow-glow-violet",
  },
  {
    handle: "accesorios-personalizacion",
    title: "Creator Tools",
    description:
      "Herramientas, repuestos y consumibles para tu estación creativa MatrixLab Tumbler.",
    icon: Layers,
    accentText: "text-ml-green",
    iconClasses: "bg-ml-green/15 text-ml-green",
    gradient: "from-ml-green/25 via-ml-violet/10 to-transparent",
    hover: "hover:border-ml-green/50 hover:shadow-glow-green",
  },
];

/** Bloques de las subcategorías comerciales de MatrixLab Tumbler. */
function TumblerBlocks({ subcategories }: { subcategories: CategoryRow[] }) {
  // Defensivo: solo se muestra una card si su fila realmente existe en base
  // (mismo criterio que el resto de la app — ningún link visible da 404).
  const realHandles = new Set(subcategories.map((c) => c.handle));
  const blocks = TUMBLER_BLOCKS_DISPLAY.filter((item) =>
    realHandles.has(item.handle),
  );

  return (
    <div className="mt-10">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {blocks.map((item) => (
          <Link
            key={item.handle}
            href={`/tienda/categoria/${item.handle}`}
            className={`group glass relative flex h-full min-h-60 flex-col overflow-hidden rounded-[1.75rem] p-7 transition hover:-translate-y-1 ${item.hover}`}
          >
            <div
              className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-80 transition group-hover:opacity-100`}
              aria-hidden
            />
            <item.icon
              className={`pointer-events-none absolute -bottom-6 -right-6 h-36 w-36 ${item.accentText} opacity-[0.08] transition duration-300 group-hover:scale-110 group-hover:opacity-[0.16]`}
              aria-hidden
            />
            <span
              className={`relative flex h-14 w-14 items-center justify-center rounded-2xl ${item.iconClasses}`}
            >
              <item.icon className="h-7 w-7" aria-hidden />
            </span>
            <div className="relative mt-5 flex-1">
              <h2 className="text-lg font-bold text-ml-white">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ml-white/65">
                {item.description}
              </p>
            </div>
            <span
              className={`relative mt-4 inline-flex items-center gap-1.5 text-sm font-semibold ${item.accentText}`}
            >
              Explorar
              <ArrowRight
                className="h-4 w-4 transition group-hover:translate-x-1"
                aria-hidden
              />
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
        <p className="text-ml-white/75">
          ¿Buscas un insumo específico? Escríbenos por WhatsApp y te ayudamos a
          conseguirlo.
        </p>
        <a
          href={buildWhatsAppUrl(
            "Hola, busco un insumo de MatrixLab Tumbler. ¿Me pueden ayudar?",
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-ml-coral px-6 py-3 font-semibold text-ml-bg transition hover:bg-ml-coral/90"
        >
          <MessageCircle className="h-5 w-5" aria-hidden />
          Escribir por WhatsApp
        </a>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, MessageCircle } from "lucide-react";
import ProductGrid from "@/components/store/ProductGrid";
import SortSelect from "@/components/store/SortSelect";
import {
  getCategoryByHandle,
  getProductsByCategory,
  getTumblerSubcategories,
  LEGACY_TUMBLER_PARENT_HANDLE,
  TUMBLER_PARENT_HANDLE,
} from "@/lib/store/products";
import type { CategoryRow } from "@/lib/db/types";
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
    title: "Stickers",
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
    title: "Impresión 3D",
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

interface CategoryPageProps {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ orden?: string }>;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { handle } = await params;
  const category = await getCategoryByHandle(handle);
  if (!category) {
    const fallback = CURATED_CATEGORY_FALLBACKS[handle];
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
  if (!category) {
    // Regla de QA: ningún CTA visible de la home puede terminar en 404. Las
    // categorías curadas sin fila en la base muestran "Próximamente".
    const fallback = CURATED_CATEGORY_FALLBACKS[handle];
    if (fallback) return <CategoryComingSoon {...fallback} />;
    notFound();
  }

  // "MatrixLab Tumbler" (categoría madre) presenta sus subcategorías
  // comerciales como bloques; no tiene productos propios. El resto de
  // categorías muestra su grilla de productos normal.
  const isTumblerParent = handle === TUMBLER_PARENT_HANDLE;
  const subcategories = isTumblerParent ? await getTumblerSubcategories() : [];

  // Whitelist de ordenamiento: cualquier valor extraño cae en "newest".
  const sort = ProductSortSchema.parse(orden ?? "newest");
  const products = isTumblerParent
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
            <h1 className="text-3xl font-bold sm:text-4xl">{category.title}</h1>
            {category.description && (
              <p className="mt-3 max-w-2xl text-ml-white/65">
                {category.description}
              </p>
            )}
          </div>
        </div>
        {!isTumblerParent && <SortSelect current={sort} />}
      </div>

      {isTumblerParent ? (
        <TumblerBlocks subcategories={subcategories} />
      ) : (
        <div className="mt-10">
          <ProductGrid products={products} />
        </div>
      )}
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

/** Bloques de las subcategorías comerciales de MatrixLab Tumbler. */
function TumblerBlocks({ subcategories }: { subcategories: CategoryRow[] }) {
  return (
    <div className="mt-10">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {subcategories.map((c) => (
          <Link
            key={c.id}
            href={`/tienda/categoria/${c.handle}`}
            className="group glass flex flex-col rounded-2xl p-6 transition hover:border-ml-violet/50"
          >
            <h2 className="text-lg font-bold text-ml-white transition group-hover:text-ml-violet">
              {c.title}
            </h2>
            {c.description && (
              <p className="mt-2 flex-1 text-sm leading-relaxed text-ml-white/65">
                {c.description}
              </p>
            )}
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-ml-cyan">
              Explorar →
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

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle } from "lucide-react";
import ProductGrid from "@/components/store/ProductGrid";
import SortSelect from "@/components/store/SortSelect";
import {
  getCategoryByHandle,
  getInsumosSubcategories,
  getProductsByCategory,
  INSUMOS_PARENT_HANDLE,
} from "@/lib/store/products";
import type { CategoryRow } from "@/lib/db/types";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { ProductSortSchema } from "@/lib/validation/store";

export const dynamic = "force-dynamic";

interface CategoryPageProps {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ orden?: string }>;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { handle } = await params;
  const category = await getCategoryByHandle(handle);
  if (!category) return { title: "Categoría" };
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

  const category = await getCategoryByHandle(handle);
  if (!category) notFound();

  // "Insumos creativos" (categoría madre) presenta sus subcategorías
  // comerciales como bloques; no tiene productos propios. El resto de
  // categorías muestra su grilla de productos normal.
  const isInsumosParent = handle === INSUMOS_PARENT_HANDLE;
  const subcategories = isInsumosParent ? await getInsumosSubcategories() : [];

  // Whitelist de ordenamiento: cualquier valor extraño cae en "newest".
  const sort = ProductSortSchema.parse(orden ?? "newest");
  const products = isInsumosParent
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
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">{category.title}</h1>
          {category.description && (
            <p className="mt-3 max-w-2xl text-ml-white/65">
              {category.description}
            </p>
          )}
        </div>
        {!isInsumosParent && <SortSelect current={sort} />}
      </div>

      {isInsumosParent ? (
        <InsumosBlocks subcategories={subcategories} />
      ) : (
        <div className="mt-10">
          <ProductGrid products={products} />
        </div>
      )}
    </div>
  );
}

/** Bloques de las subcategorías comerciales de Insumos creativos. */
function InsumosBlocks({ subcategories }: { subcategories: CategoryRow[] }) {
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
            "Hola, busco un insumo creativo específico. ¿Me pueden ayudar?",
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

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import ProductGrid from "@/components/store/ProductGrid";
import SortSelect from "@/components/store/SortSelect";
import {
  getCategoryByHandle,
  getProductsByCategory,
} from "@/lib/store/products";
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

  // Whitelist de ordenamiento: cualquier valor extraño cae en "newest".
  const sort = ProductSortSchema.parse(orden ?? "newest");
  const products = await getProductsByCategory(category.id, sort);

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
        <SortSelect current={sort} />
      </div>

      <div className="mt-10">
        <ProductGrid products={products} />
      </div>
    </div>
  );
}

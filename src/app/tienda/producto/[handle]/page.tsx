import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import ProductGallery from "@/components/store/ProductGallery";
import ProductGrid from "@/components/store/ProductGrid";
import ProductOptions from "@/components/store/ProductOptions";
import {
  DESIGNER_PRODUCT_HANDLES,
  getProductByHandle,
  getRelatedProducts,
} from "@/lib/store/products";

export const dynamic = "force-dynamic";

interface ProductPageProps {
  params: Promise<{ handle: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProductByHandle(handle);
  if (!product) return { title: "Producto" };
  const description =
    product.description?.slice(0, 160) ??
    "Producto personalizado del laboratorio creativo MatrixLab.";
  return {
    title: product.title,
    description,
    openGraph: {
      title: `${product.title} | Tienda MatrixLab`,
      description,
      ...(Array.isArray(product.images) && product.images[0]
        ? { images: [{ url: product.images[0] }] }
        : {}),
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { handle } = await params;
  const product = await getProductByHandle(handle);
  if (!product) notFound();

  const related = await getRelatedProducts(product, 4);
  const designerType = DESIGNER_PRODUCT_HANDLES[product.handle] ?? null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <Link
        href={
          product.category
            ? `/tienda/categoria/${product.category.handle}`
            : "/tienda"
        }
        className="inline-flex items-center gap-1.5 text-sm text-ml-white/60 transition hover:text-ml-violet"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {product.category ? product.category.title : "Volver a la tienda"}
      </Link>

      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <ProductGallery
          images={Array.isArray(product.images) ? product.images : []}
          title={product.title}
        />

        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">{product.title}</h1>
          <div className="mt-6">
            <ProductOptions product={product} designerType={designerType} />
          </div>
        </div>
      </div>

      {product.description && (
        <section className="glass mt-12 max-w-3xl rounded-2xl p-7">
          <h2 className="text-lg font-semibold">Descripción</h2>
          <p className="mt-3 whitespace-pre-line leading-relaxed text-ml-white/70">
            {product.description}
          </p>
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-bold">También te puede gustar</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}

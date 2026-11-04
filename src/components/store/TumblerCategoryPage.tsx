import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import TumblerSubcategoryNav, { TUMBLER_CATALOG_SECTIONS } from "./TumblerSubcategoryNav";
import ReadyTumblerCatalog from "./ReadyTumblerCatalog";
import TumblerCupsCatalog from "./TumblerCupsCatalog";
import SparklesCatalog from "./SparklesCatalog";
import TumblerStickersCatalog from "./TumblerStickersCatalog";
import ProductGrid from "./ProductGrid";
import BrandWordmark from "./BrandWordmark";
import {
  getCategoryByHandle, getReadyTumblerCatalog, getCupCatalog,
  getSparkleCatalog, getStickerCatalog, getProductsByCategory,
} from "@/lib/store/products";

/** The full category is a catalog with a selector, not another menu of category cards. */
export default function TumblerCategoryPage({ selectedHandle }: { selectedHandle?: string }) {
  const section = TUMBLER_CATALOG_SECTIONS.find(item => item.handle === selectedHandle) ?? TUMBLER_CATALOG_SECTIONS[0];
  return <div className="mobile-catalog-page mx-auto max-w-7xl px-4 py-12 sm:px-6" data-complete-tumbler>
    <div className="flex items-center gap-3 sm:block">
    <Link href="/tienda" className="inline-flex min-h-11 min-w-11 items-center gap-2 text-sm text-ui-text-muted hover:text-ml-cyan"><ArrowLeft className="h-4 w-4" aria-hidden /><span className="sr-only sm:not-sr-only">Volver a la tienda</span></Link>
    <header className="flex items-center gap-3 sm:mt-4">
      <h1><BrandWordmark family="tumbler" label="Tumbler" pageHeading /></h1>
    </header>
    </div>
    <TumblerSubcategoryNav selected={section.handle} />
    <section key={section.handle} className="tumbler-complete-products mt-6" aria-label={`Catálogo completo: ${section.title}`}>
      <h2 className="mb-4 text-xl font-semibold max-sm:sr-only">{section.title}</h2>
      <Suspense key={section.handle} fallback={<div role="status" className="rounded-xl border border-ui-border p-6 text-ui-text-muted">Cargando {section.title.toLocaleLowerCase("es")}…</div>}>
        <TumblerCategoryProducts handle={section.handle} />
      </Suspense>
    </section>
    <Link href="/tienda/matrixlab-tumbler/cursos" className="mt-8 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ml-cyan">Cursos Tumbler<ArrowLeft aria-hidden className="h-4 w-4 rotate-180" /></Link>
  </div>;
}

async function TumblerCategoryProducts({ handle }: { handle: string }) {
  let catalog: React.ReactNode;
  if (handle === "vasos-listos") {
    catalog = <ReadyTumblerCatalog embedded items={await getReadyTumblerCatalog()} />;
  } else {
    const category = await getCategoryByHandle(handle);
    if (!category) {
      catalog = <p role="status" className="rounded-xl border border-ui-border p-5 text-ui-text-muted">Todavía no hay productos publicados en esta subcategoría.</p>;
    } else if (handle === "snowglobe") {
      catalog = <TumblerCupsCatalog entries={(await getCupCatalog(category.id)).entries} />;
    } else if (handle === "repuestos-consumibles") {
      catalog = <SparklesCatalog key={handle} entries={(await getSparkleCatalog(category.id)).entries} />;
    } else if (handle === "wraps-glow-finish") {
      catalog = <TumblerStickersCatalog key={handle} entries={(await getStickerCatalog(category.id)).entries} />;
    } else {
      catalog = <ProductGrid products={await getProductsByCategory(category.id)} brandContext="tumbler" />;
    }
  }
  return catalog;
}

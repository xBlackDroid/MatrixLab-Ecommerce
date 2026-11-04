import Link from "next/link";
import { ArrowLeft, ChevronDown, MessageCircle, Sparkles } from "lucide-react";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import ThreeDProductGallery from "./ThreeDProductGallery";
import { MATRIXLAB_3D_CATEGORY_LABELS, MATRIXLAB_3D_PLACEHOLDER_IMAGE, type MatrixLab3dItem } from "@/lib/store/matrixlab-3d";
import { formatPrice } from "@/lib/utils";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

/** Ficha del catálogo 3D cuando la pieza aún se atiende por consulta y no tiene producto comprable. */
export default function ThreeDProductDetail({ item }: { item: MatrixLab3dItem }) {
  const categoryHref = "/tienda/categoria/impresion-3d";
  const images = item.imagePaths?.length ? [...item.imagePaths] : [MATRIXLAB_3D_PLACEHOLDER_IMAGE];
  const contact = buildWhatsAppUrl(`Hola MatrixLab, quiero ${item.customizable ? "personalizar" : "consultar"} ${item.name} (${item.code}), ${item.salesUnit}.`);
  return (
    <div className="mobile-product-page mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <Breadcrumbs items={[{ label: "Tienda", href: "/tienda" }, { label: "3D", href: categoryHref }, { label: item.name }]} />
      <Link href={categoryHref} className="inline-flex min-h-11 items-center gap-2 text-sm text-ui-text-muted hover:text-ml-green"><ArrowLeft className="h-4 w-4" aria-hidden />Volver a 3D</Link>
      <div className="mt-4 grid min-w-0 gap-6 lg:grid-cols-2 lg:gap-10">
        <ThreeDProductGallery images={images} title={item.name} />
        <div className="min-w-0">
          <p className="mb-2 text-sm font-medium text-ml-green">{MATRIXLAB_3D_CATEGORY_LABELS[item.category]}</p>
          <h1 className="text-2xl font-bold leading-tight sm:text-4xl">{item.name}</h1>
          {item.customizable && <p className="mt-3 flex items-center gap-2 text-sm text-ml-violet"><Sparkles className="h-4 w-4" aria-hidden />Personalizable</p>}
          <p className="mt-5 text-2xl font-bold">{item.price === null ? "Precio por cotización" : <>{item.priceFrom && "Desde "}<span className="ui-money">{formatPrice(item.price)}</span></>}</p>
          {item.price !== null && <p className="mt-1 text-sm text-ui-text-muted">MXN / {item.salesUnit}</p>}
          <a href={contact} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ml-green px-6 py-3 text-sm font-semibold text-ml-bg hover:bg-ml-green/90"><MessageCircle className="h-4 w-4" aria-hidden />{item.price === null ? "Cotizar por WhatsApp" : "Consultar por WhatsApp"}</a>
          <details className="group mt-6 border-t border-ui-border">
            <summary className="flex min-h-12 cursor-pointer items-center justify-between text-sm font-semibold">Detalles del producto<ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden /></summary>
            <div className="space-y-3 pb-4 text-sm leading-relaxed text-ui-text-muted"><p className="whitespace-pre-line">{item.description}</p><p>{item.usageLabel} · {item.finishLabel}</p><p className="text-xs">Ref. {item.code}</p></div>
          </details>
        </div>
      </div>
    </div>
  );
}

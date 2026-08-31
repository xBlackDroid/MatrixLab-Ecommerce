import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Info, MessageCircle } from "lucide-react";
import DesignerRouter from "@/components/designer/DesignerRouter";
import GorrasDesigner from "@/components/designer/GorrasDesigner";
import {
  getCatalogEntry,
  isDesignerProductType,
} from "@/lib/designer/product-catalog";
import { DESIGNER_PRODUCT_HANDLE_MAP } from "@/lib/designer/product-handles";
import {
  getDesignerBaseProduct,
  getDesignerFallbackProduct,
} from "@/lib/store/products";
import {
  MATRIXLAB_WEAR_CATEGORY_LABELS,
  MATRIXLAB_WEAR_DESIGN_PARAM,
  matrixLabWearImagePath,
  matrixLabWearSku,
  resolveMatrixLabWearDesignParam,
  type MatrixLabWearItem,
} from "@/lib/store/matrixlab-wear";
import { buildWhatsAppUrl, whatsappMessages } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

interface DesignerPageProps {
  params: Promise<{ productType: string }>;
  /**
   * `design` (opcional) lleva el diseño elegido en el catálogo de MatrixLab
   * Wear. Es texto del cliente: se valida contra la allowlist de los 100
   * handles antes de usarse. Sin él, el Laboratorio abre exactamente igual
   * que siempre.
   */
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

// Rutas legado → ruta pública nueva. No aparecen en UI; redirigen.
const LEGACY_REDIRECTS: Record<string, string> = {
  gorra: "/tienda/disenador/gorras",
  "gorra-trucker": "/tienda/disenador/gorras",
  "gorra-clasica": "/tienda/disenador/gorras",
};

// Tipos legado de imanes: la ruta sigue viva (no rompe enlaces) pero ya no se
// promociona ni se diseña aquí. Se cotiza por WhatsApp.
const LEGACY_QUOTE_TYPES = new Set([
  "imanes-planilla",
  "imanes-repeticion",
]);

export async function generateMetadata({
  params,
}: DesignerPageProps): Promise<Metadata> {
  const { productType } = await params;
  if (productType === "gorras") {
    return {
      title: "Diseña tu gorra",
      description:
        "Diseña tu gorra trucker o clásica ajustable en el laboratorio MatrixLab.",
    };
  }
  if (!isDesignerProductType(productType)) return { title: "Laboratorio" };
  const entry = getCatalogEntry(productType);
  return { title: `Diseña: ${entry.publicName}`, description: entry.shortDescription };
}

export default async function DesignerProductPage({
  params,
  searchParams,
}: DesignerPageProps) {
  const { productType } = await params;
  const query = (await searchParams) ?? {};

  // Diseño elegido en el catálogo de MatrixLab Wear. `resolve…` sólo devuelve
  // algo si el valor es EXACTAMENTE uno de los 100 handles conocidos: un
  // handle inventado, una URL o un path se descartan y el Laboratorio abre
  // normal. Se muestra como REFERENCIA, no se carga al lienzo.
  const wearDesign = resolveMatrixLabWearDesignParam(
    query[MATRIXLAB_WEAR_DESIGN_PARAM],
  );

  // 1) Redirects de rutas legado (no rompen, no se promocionan).
  const legacy = LEGACY_REDIRECTS[productType];
  if (legacy) redirect(legacy);

  // 1.b) Imanes (legado): no se diseñan aquí; se cotizan por WhatsApp.
  if (LEGACY_QUOTE_TYPES.has(productType)) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6">
        <div className="mb-6">
          <Link
            href="/tienda/disenador"
            className="inline-flex items-center gap-1.5 text-sm text-ml-white/60 transition hover:text-ml-cyan"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Volver al laboratorio
          </Link>
        </div>
        <QuoteByWhatsAppNotice />
      </div>
    );
  }

  // 2) Sección pública combinada de gorras. Los handles reales salen SIEMPRE
  //    del mapa canónico (fuente única en lib/designer/product-handles.ts).
  if (productType === "gorras") {
    const truckerHandle = DESIGNER_PRODUCT_HANDLE_MAP["gorra-trucker"];
    const clasicaHandle = DESIGNER_PRODUCT_HANDLE_MAP["gorra-clasica"];
    const [trucker, clasica] = await Promise.all([
      getDesignerBaseProduct(truckerHandle),
      getDesignerBaseProduct(clasicaHandle),
    ]);
    // Respaldo: si el catálogo no tiene el producto base, el diseñador abre en
    // modo previsualización/cotización en lugar de bloquear la página.
    const truckerView = trucker ?? getDesignerFallbackProduct(truckerHandle);
    const clasicaView = clasica ?? getDesignerFallbackProduct(clasicaHandle);
    if (!trucker || !clasica) {
      console.warn("[designer] producto base no encontrado; modo previsualización", {
        productType,
        trucker: Boolean(trucker),
        clasica: Boolean(clasica),
      });
    }
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6">
        <div className="mb-6">
          <Link
            href="/tienda/disenador"
            className="inline-flex items-center gap-1.5 text-sm text-ml-white/60 transition hover:text-ml-cyan"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Volver al laboratorio
          </Link>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
            Diseña tu <span className="text-gradient">gorra</span>
          </h1>
        </div>
        {!trucker && !clasica && <PreviewModeBanner />}
        {truckerView || clasicaView ? (
          <GorrasDesigner
            truckerProduct={truckerView}
            clasicaProduct={clasicaView}
            truckerPreviewOnly={!trucker}
            clasicaPreviewOnly={!clasica}
          />
        ) : (
          <UnavailableNotice />
        )}
      </div>
    );
  }

  // 3) Whitelist estricta del resto de tipos.
  if (!isDesignerProductType(productType)) notFound();

  const entry = getCatalogEntry(productType);
  const product = await getDesignerBaseProduct(entry.baseHandle);
  // Respaldo: sin producto base en catálogo, el diseñador abre igual en modo
  // previsualización (armar diseño + cotizar por WhatsApp); guardar/carrito se
  // deshabilitan con aviso claro dentro del editor.
  const viewProduct = product ?? getDesignerFallbackProduct(entry.baseHandle);
  if (!product) {
    console.warn("[designer] producto base no encontrado; modo previsualización", {
      productType,
      baseHandle: entry.baseHandle,
      fallback: Boolean(viewProduct),
    });
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6">
      <div className="mb-6">
        <Link
          href="/tienda/disenador"
          className="inline-flex items-center gap-1.5 text-sm text-ml-white/60 transition hover:text-ml-cyan"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Volver al laboratorio
        </Link>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
          Diseña: <span className="text-gradient">{entry.publicName}</span>
        </h1>
      </div>

      {/* Sólo tiene sentido en prendas: es de donde viene el catálogo Wear. */}
      {wearDesign && entry.kind === "garment" && (
        <WearDesignReference item={wearDesign} />
      )}
      {!product && viewProduct && <PreviewModeBanner />}
      {viewProduct ? (
        <DesignerRouter
          kind={entry.kind}
          productType={productType}
          product={viewProduct}
          previewOnly={!product}
        />
      ) : (
        <UnavailableNotice />
      )}
    </div>
  );
}

/**
 * Referencia del diseño elegido en el catálogo de MatrixLab Wear.
 *
 * MUESTRA, NO IMPRIME. La foto de `public/images/matrixlab-wear/<código>.webp`
 * es material de catálogo (una foto o un mockup de la prenda), NO un archivo
 * de arte listo para impresión: cargarla al lienzo imprimiría el mockup —con
 * su prenda, sus sombras y su fondo— en lugar del diseño. Por eso aquí sólo se
 * enseña como referencia y el editor sigue funcionando igual que siempre.
 *
 * Para precargar el arte de verdad haría falta un segundo asset imprimible
 * (PNG con transparencia y resolución de impresión), que hoy NO existe. En
 * cuanto exista, este bloque es el punto donde se engancha.
 */
function WearDesignReference({ item }: { item: MatrixLabWearItem }) {
  return (
    <div className="mb-6 flex items-start gap-4 rounded-2xl border border-ml-violet/30 bg-ml-violet/10 p-4">
      <Image
        src={matrixLabWearImagePath(item.code)}
        alt={item.name}
        width={72}
        height={72}
        className="h-16 w-16 shrink-0 rounded-xl border border-white/10 object-cover sm:h-[72px] sm:w-[72px]"
      />
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-ml-violet">
          Diseño elegido · {MATRIXLAB_WEAR_CATEGORY_LABELS[item.category]}
        </p>
        <p className="mt-0.5 truncate font-bold text-ml-white">{item.name}</p>
        <p className="mt-0.5 text-xs text-ml-white/50">
          Ref. {item.code} · {matrixLabWearSku(item.code)}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ml-white/70">
          Lo traemos como referencia de lo que elegiste. Confírmanos este
          diseño al cotizar y define aquí tu talla y color.
        </p>
      </div>
    </div>
  );
}

/** Alerta suave del modo previsualización (el diseñador sigue usable). */
function PreviewModeBanner() {
  return (
    <p className="mb-6 flex items-start gap-2.5 rounded-2xl border border-ml-cyan/30 bg-ml-cyan/10 px-5 py-4 text-sm leading-relaxed text-ml-white/85">
      <Info className="mt-0.5 h-5 w-5 shrink-0 text-ml-cyan" aria-hidden />
      <span>
        Modo previsualización: el producto base no está disponible en catálogo,
        pero puedes armar tu diseño y cotizar por WhatsApp.
      </span>
    </p>
  );
}

function QuoteByWhatsAppNotice() {
  return (
    <div className="glass mx-auto max-w-lg rounded-3xl p-12 text-center">
      <h2 className="text-xl font-bold">Esta opción se cotiza por WhatsApp</h2>
      <p className="mt-3 text-ml-white/60">
        Las planillas de imanes se producen bajo pedido. Cuéntanos tu idea y la
        cotizamos contigo directamente.
      </p>
      <a
        href={buildWhatsAppUrl(whatsappMessages.quoteDesign())}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-ml-coral px-6 py-3 font-semibold text-ml-bg transition hover:bg-ml-coral/90"
      >
        <MessageCircle className="h-5 w-5" aria-hidden />
        Cotizar por WhatsApp
      </a>
    </div>
  );
}

function UnavailableNotice() {
  return (
    <div className="glass mx-auto max-w-lg rounded-3xl p-12 text-center">
      <h2 className="text-xl font-bold">Este producto aún no está disponible</h2>
      <p className="mt-3 text-ml-white/60">
        No encontramos el producto base en el catálogo todavía. Cuéntanos tu
        idea por WhatsApp y la producimos contigo.
      </p>
      <a
        href={buildWhatsAppUrl(whatsappMessages.quoteDesign())}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-ml-coral px-6 py-3 font-semibold text-ml-bg transition hover:bg-ml-coral/90"
      >
        <MessageCircle className="h-5 w-5" aria-hidden />
        Cotizar por WhatsApp
      </a>
    </div>
  );
}

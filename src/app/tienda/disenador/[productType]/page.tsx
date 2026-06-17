import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, MessageCircle } from "lucide-react";
import DesignerRouter from "@/components/designer/DesignerRouter";
import GorrasDesigner from "@/components/designer/GorrasDesigner";
import {
  getCatalogEntry,
  isDesignerProductType,
} from "@/lib/designer/product-catalog";
import { getProductByHandle } from "@/lib/store/products";
import { buildWhatsAppUrl, whatsappMessages } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

interface DesignerPageProps {
  params: Promise<{ productType: string }>;
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
}: DesignerPageProps) {
  const { productType } = await params;

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

  // 2) Sección pública combinada de gorras.
  if (productType === "gorras") {
    const [trucker, clasica] = await Promise.all([
      getProductByHandle("gorra-trucker-personalizada"),
      getProductByHandle("gorra-clasica-personalizada"),
    ]);
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
        {trucker || clasica ? (
          <GorrasDesigner truckerProduct={trucker} clasicaProduct={clasica} />
        ) : (
          <UnavailableNotice />
        )}
      </div>
    );
  }

  // 3) Whitelist estricta del resto de tipos.
  if (!isDesignerProductType(productType)) notFound();

  const entry = getCatalogEntry(productType);
  const product = await getProductByHandle(entry.baseHandle);

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

      {product ? (
        <DesignerRouter
          kind={entry.kind}
          productType={productType}
          product={product}
        />
      ) : (
        <UnavailableNotice />
      )}
    </div>
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

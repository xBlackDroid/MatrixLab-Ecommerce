import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle } from "lucide-react";
import DesignerShell from "@/components/designer/DesignerShell";
import {
  getProductTypeConfig,
  isProductTypeId,
} from "@/lib/designer/printAreas";
import {
  DESIGNER_TYPE_TO_HANDLE,
  getProductByHandle,
} from "@/lib/store/products";
import { buildWhatsAppUrl, whatsappMessages } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

interface DesignerPageProps {
  params: Promise<{ productType: string }>;
}

export async function generateMetadata({
  params,
}: DesignerPageProps): Promise<Metadata> {
  const { productType } = await params;
  if (!isProductTypeId(productType)) return { title: "Diseñador" };
  const config = getProductTypeConfig(productType);
  return {
    title: `Diseña tu ${config.label.toLowerCase()}`,
    description: `Personaliza tu ${config.label.toLowerCase()} en el laboratorio interactivo MatrixLab: sube tu imagen, acomódala y agrégala al carrito.`,
  };
}

export default async function DesignerProductPage({
  params,
}: DesignerPageProps) {
  const { productType } = await params;

  // Whitelist estricta del tipo de producto (playera | gorra | tote).
  if (!isProductTypeId(productType)) notFound();

  const config = getProductTypeConfig(productType);
  const product = await getProductByHandle(
    DESIGNER_TYPE_TO_HANDLE[productType],
  );

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/tienda/disenador"
            className="inline-flex items-center gap-1.5 text-sm text-ml-white/60 transition hover:text-ml-cyan"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Elegir otro producto
          </Link>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
            Diseña tu{" "}
            <span className="text-gradient">{config.label.toLowerCase()}</span>
          </h1>
        </div>
      </div>

      {product ? (
        <DesignerShell productType={productType} product={product} />
      ) : (
        <div className="glass mx-auto max-w-lg rounded-3xl p-12 text-center">
          <h2 className="text-xl font-bold">
            Este producto está en preparación
          </h2>
          <p className="mt-3 text-ml-white/60">
            Estamos configurando el producto base del diseñador. Mientras
            tanto, cuéntanos tu idea por WhatsApp y la producimos contigo.
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
      )}
    </div>
  );
}

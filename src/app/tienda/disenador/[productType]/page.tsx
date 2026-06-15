import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle } from "lucide-react";
import DesignerRouter from "@/components/designer/DesignerRouter";
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

export async function generateMetadata({
  params,
}: DesignerPageProps): Promise<Metadata> {
  const { productType } = await params;
  if (!isDesignerProductType(productType)) return { title: "Laboratorio" };
  const entry = getCatalogEntry(productType);
  return {
    title: `Diseña: ${entry.publicName}`,
    description: entry.shortDescription,
  };
}

export default async function DesignerProductPage({
  params,
}: DesignerPageProps) {
  const { productType } = await params;

  // Whitelist estricta del tipo de diseñador.
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
        <div className="glass mx-auto max-w-lg rounded-3xl p-12 text-center">
          <h2 className="text-xl font-bold">Este laboratorio está en preparación</h2>
          <p className="mt-3 text-ml-white/60">
            Estamos configurando el producto base. Mientras tanto, cuéntanos tu
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
      )}
    </div>
  );
}

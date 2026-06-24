import type { Metadata } from "next";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { ArrowLeft } from "lucide-react";
import SchoolLabelsLab from "@/components/designer/school-labels/SchoolLabelsLab";
import SchoolLabelsGuideHero from "@/components/designer/school-labels/SchoolLabelsGuideHero";
import SchoolLabelsInfoSections from "@/components/designer/school-labels/SchoolLabelsInfoSections";
import { buildWhatsAppUrl, whatsappMessages } from "@/lib/whatsapp";
import { getDesignerBaseProduct } from "@/lib/store/products";

export const metadata: Metadata = {
  title: "Etiquetas Escolares Lab",
  description:
    "Crea tu pack escolar personalizado: nombre, tipografía, colores y tu propia imagen en una experiencia interactiva fiel a la guía MatrixLab. Etiquetas escolares listas para producción.",
  openGraph: {
    title: "Etiquetas Escolares Lab | Tienda MatrixLab",
    description:
      "Arma tu pedido de etiquetas escolares con nombre, tipografía, colores e imagen propia en pocos pasos.",
  },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BASE_HANDLE = "etiquetas-escolares-personalizadas";

export default async function SchoolLabelsPage() {
  // Sin caché: el producto base se resuelve siempre en cada request.
  noStore();

  const product = await getDesignerBaseProduct(BASE_HANDLE);
  const whatsappUrl = buildWhatsAppUrl(whatsappMessages.schoolLabels({}));

  return (
    // Cuerpo claro estilo guía (entre el header y el footer oscuros de MatrixLab).
    <div className="bg-[#f4f2fb] text-slate-800">
      {/* Barra morada superior, como en la guía */}
      <div className="h-1.5 w-full bg-gradient-to-r from-violet-400 via-violet-500 to-violet-400" />

      <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 sm:py-9">
        <Link
          href="/tienda/disenador"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-violet-600"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Volver al laboratorio
        </Link>

        <div className="mt-5 flex flex-col gap-8">
          {/* 1. Guía rápida / portada (páginas 1-2) */}
          <SchoolLabelsGuideHero whatsappUrl={whatsappUrl} />

          {/* 2-6. Wizard interactivo (paquete → preview) */}
          <SchoolLabelsLab product={product} />

          {/* 7. Secciones informativas (páginas 11-13) */}
          <SchoolLabelsInfoSections />
        </div>
      </div>
    </div>
  );
}

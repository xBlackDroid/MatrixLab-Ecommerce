import type { Metadata } from "next";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { ArrowLeft } from "lucide-react";
import SchoolLabelsLab from "@/components/designer/school-labels/SchoolLabelsLab";
import SchoolLabelsGuideHero from "@/components/designer/school-labels/SchoolLabelsGuideHero";
import SchoolLabelsInfoSections from "@/components/designer/school-labels/SchoolLabelsInfoSections";
import { buildWhatsAppUrl, whatsappMessages } from "@/lib/whatsapp";
import { DESIGNER_PRODUCT_HANDLE_MAP } from "@/lib/designer/product-handles";
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

// Handle real del producto base (fuente única: product-handles.ts).
const BASE_HANDLE = DESIGNER_PRODUCT_HANDLE_MAP["etiquetas-escolares"];

export default async function SchoolLabelsPage() {
  // Sin caché: el producto base se resuelve siempre en cada request.
  noStore();

  const product = await getDesignerBaseProduct(BASE_HANDLE, {
    productType: "etiquetas-escolares",
  });
  const whatsappUrl = buildWhatsAppUrl(whatsappMessages.schoolLabels({}));

  return (
    // Cuerpo claro estilo guía (entre el header y el footer oscuros de MatrixLab).
    <div className="bg-[#f4f2fb] text-slate-800">
      {/*
        Fuentes web para el matching visual de las plantillas de tipografía.
        React 19 (App Router) eleva estos <link> al <head>; al estar en esta
        página, solo se cargan al entrar al laboratorio escolar. Si no cargan,
        las plantillas degradan a fuentes seguras del sistema (no se rompen).
      */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      {/* Carga deliberada y scoped a esta página (las plantillas de tipografía
          solo se usan aquí); por eso evitamos next/font global. */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Caveat:wght@600;700&family=Fredoka:wght@500;600;700&family=Graduate&family=Luckiest+Guy&family=Nunito:wght@800;900&family=Pacifico&family=Saira+Condensed:ital,wght@0,700;0,800;1,700;1,800&display=swap"
      />

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

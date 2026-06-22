import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, GraduationCap, MessageCircle } from "lucide-react";
import SchoolLabelsLab from "@/components/designer/school-labels/SchoolLabelsLab";
import { SCHOOL_ORDER_STEPS } from "@/lib/designer/school-labels/config";
import { getProductByHandle } from "@/lib/store/products";
import { buildWhatsAppUrl, whatsappMessages } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Etiquetas Escolares Lab",
  description:
    "Crea tu pack escolar personalizado: nombre, tipografía, colores y temática en un solo pedido. Diseña etiquetas escolares listas para producción.",
  openGraph: {
    title: "Etiquetas Escolares Lab | Tienda MatrixLab",
    description:
      "Arma tu pedido de etiquetas escolares con nombre, tipografía, colores y temática en pocos pasos.",
  },
};

export const dynamic = "force-dynamic";

const BASE_HANDLE = "etiquetas-escolares-personalizadas";

export default async function SchoolLabelsPage() {
  const product = await getProductByHandle(BASE_HANDLE);

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
        <div className="mt-3 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ml-cyan/15 text-ml-cyan">
            <GraduationCap className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">
              Etiquetas <span className="text-gradient">Escolares Lab</span>
            </h1>
            <p className="text-sm text-ml-white/60">
              Crea tu pack escolar personalizado: nombre, tipografía, colores y
              temática en un solo pedido.
            </p>
          </div>
        </div>
      </div>

      {/* Cómo funciona tu pedido */}
      <section className="glass mb-8 rounded-3xl p-6 sm:p-8">
        <h2 className="text-lg font-bold">Cómo funciona tu pedido</h2>
        <ol className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SCHOOL_ORDER_STEPS.map((stepItem, i) => (
            <li
              key={stepItem.title}
              className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ml-violet/20 text-sm font-bold text-ml-violet">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-semibold">{stepItem.title}</p>
                <p className="mt-0.5 text-xs text-ml-white/60">
                  {stepItem.text}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {product ? (
        <SchoolLabelsLab product={product} />
      ) : (
        <UnavailableNotice />
      )}
    </div>
  );
}

function UnavailableNotice() {
  return (
    <div className="glass mx-auto max-w-lg rounded-3xl p-12 text-center">
      <h2 className="text-xl font-bold">
        El producto base aún no está disponible
      </h2>
      <p className="mt-3 text-ml-white/60">
        No encontramos el producto base de etiquetas escolares en el catálogo
        todavía. Aplica el seed (supabase/seed_school_labels.sql) o cuéntanos tu
        idea por WhatsApp y la armamos contigo.
      </p>
      <a
        href={buildWhatsAppUrl(whatsappMessages.schoolLabels({}))}
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

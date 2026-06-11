import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ShoppingBag, Shirt, Sparkles, Wand2 } from "lucide-react";
import { buildWhatsAppUrl, whatsappMessages } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Diseñador T-Shirt Lab",
  description:
    "Sube tu imagen, acomódala y crea una pieza personalizada lista para producir. Playeras, gorras y tote bags desde el laboratorio creativo MatrixLab.",
  openGraph: {
    title: "Diseñador T-Shirt Lab | Tienda MatrixLab",
    description:
      "Crea prendas y accesorios textiles personalizados desde el laboratorio interactivo.",
  },
};

export const revalidate = 3600;

const PRODUCTS = [
  {
    type: "playera",
    label: "Playera",
    description: "Algodón suave, frente y espalda personalizables.",
    icon: Shirt,
  },
  {
    type: "gorra",
    label: "Gorra",
    description: "Estructurada, con tu diseño al frente.",
    icon: Sparkles,
  },
  {
    type: "tote",
    label: "Tote bag",
    description: "Resistente y reutilizable, lista para tu arte.",
    icon: ShoppingBag,
  },
];

export default function DisenadorLandingPage() {
  return (
    <div className="relative overflow-hidden">
      <div className="grid-overlay pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute -top-32 right-1/4 h-96 w-96 rounded-full bg-ml-cyan/10 blur-3xl" />

      <div className="relative mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 sm:py-24">
        <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-ml-cyan">
          <Wand2 className="h-4 w-4" aria-hidden />
          T-Shirt Lab
        </span>
        <h1 className="mt-6 text-4xl font-bold sm:text-5xl">
          Diseña <span className="text-gradient">en el laboratorio</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-ml-white/70">
          Sube tu imagen, acomódala y crea una pieza personalizada lista para
          producir.
        </p>
        <p className="mt-2 text-sm text-ml-white/50">
          Usa imágenes PNG de buena calidad para mejores resultados.
        </p>

        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {PRODUCTS.map((item) => (
            <Link
              key={item.type}
              href={`/tienda/disenador/${item.type}`}
              className="group glass flex flex-col items-center gap-4 rounded-3xl p-8 transition hover:-translate-y-1 hover:border-ml-cyan/50 hover:shadow-glow-cyan"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-ml-violet/15 text-ml-violet transition group-hover:bg-ml-cyan/15 group-hover:text-ml-cyan">
                <item.icon className="h-8 w-8" aria-hidden />
              </span>
              <div>
                <h2 className="text-xl font-bold">{item.label}</h2>
                <p className="mt-1.5 text-sm text-ml-white/60">
                  {item.description}
                </p>
              </div>
              <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-ml-cyan">
                Empezar a diseñar
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden />
              </span>
            </Link>
          ))}
        </div>

        <p className="mt-10 text-sm text-ml-white/50">
          ¿Tienes una idea más compleja?{" "}
          <a
            href={buildWhatsAppUrl(whatsappMessages.quoteDesign())}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-ml-coral hover:underline"
          >
            Prefiero cotizar por WhatsApp →
          </a>
        </p>
      </div>
    </div>
  );
}

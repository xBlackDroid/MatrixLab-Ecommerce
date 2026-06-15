import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  LayoutGrid,
  Repeat,
  Shirt,
  ShoppingBag,
  Sparkles,
  Wand2,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { listLabEntries } from "@/lib/designer/product-catalog";
import type { DesignerBadge } from "@/lib/designer/product-catalog";
import { buildWhatsAppUrl, whatsappMessages } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Laboratorio de diseño",
  description:
    "Diseña prendas, planillas de stickers e imanes y grabados láser desde el laboratorio creativo MatrixLab. Sube tu imagen, acomódala y crea una pieza lista para producir.",
  openGraph: {
    title: "Laboratorio de diseño | Tienda MatrixLab",
    description:
      "Prendas, planillas y láser: crea tu pieza personalizada desde el laboratorio interactivo.",
  },
};

export const revalidate = 3600;

const ICONS: Record<string, LucideIcon> = {
  shirt: Shirt,
  hoodie: Shirt,
  cap: Sparkles,
  bag: ShoppingBag,
  grid: LayoutGrid,
  repeat: Repeat,
  laser: Zap,
};

const BADGE_STYLES: Record<DesignerBadge, string> = {
  Prendas: "border-ml-violet/40 bg-ml-violet/10 text-ml-violet",
  Planillas: "border-ml-cyan/40 bg-ml-cyan/10 text-ml-cyan",
  Láser: "border-ml-coral/40 bg-ml-coral/10 text-ml-coral",
};

export default function LabHomePage() {
  const entries = listLabEntries();

  return (
    <div className="relative overflow-hidden">
      <div className="grid-overlay pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute -top-32 right-1/4 h-96 w-96 rounded-full bg-ml-cyan/10 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="text-center">
          <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-ml-cyan">
            <Wand2 className="h-4 w-4" aria-hidden />
            Laboratorio MatrixLab
          </span>
          <h1 className="mt-6 text-4xl font-bold sm:text-5xl">
            Diseña <span className="text-gradient">en el laboratorio</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-ml-white/70">
            Elige tu lienzo: prendas, planillas de stickers e imanes o grabado
            láser. Sube tu imagen, acomódala y crea una pieza lista para
            producir.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => {
            const Icon = ICONS[entry.iconKey] ?? Wand2;
            return (
              <Link
                key={entry.id}
                href={`/tienda/disenador/${entry.id}`}
                className="group glass flex flex-col gap-4 rounded-3xl p-7 transition hover:-translate-y-1 hover:border-ml-violet/40 hover:shadow-glow-violet"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ml-violet/15 text-ml-violet transition group-hover:bg-ml-cyan/15 group-hover:text-ml-cyan">
                    <Icon className="h-6 w-6" aria-hidden />
                  </span>
                  <div className="flex gap-1.5">
                    {entry.isNew && (
                      <span className="rounded-full border border-white/20 bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-ml-white/70">
                        Nuevo
                      </span>
                    )}
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                        BADGE_STYLES[entry.badge],
                      )}
                    >
                      {entry.badge}
                    </span>
                  </div>
                </div>
                <div>
                  <h2 className="text-lg font-bold">{entry.publicName}</h2>
                  <p className="mt-1.5 text-sm text-ml-white/60">
                    {entry.shortDescription}
                  </p>
                </div>
                <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-ml-cyan">
                  Abrir laboratorio
                  <ArrowRight
                    className="h-4 w-4 transition group-hover:translate-x-1"
                    aria-hidden
                  />
                </span>
              </Link>
            );
          })}
        </div>

        <p className="mt-10 text-center text-sm text-ml-white/50">
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

"use client";

import { useMemo, useState } from "react";
import ThreeDProductGallery from "@/components/store/ThreeDProductGallery";
import { MessageCircle, Sparkles } from "lucide-react";
import type { MatrixLab3dCatalogEntry } from "@/lib/store/products";
import {
  MATRIXLAB_3D_CATEGORY_LABELS,
  MATRIXLAB_3D_CATEGORY_ORDER,
  matchesMatrixLab3dFilter,
  matrixLab3dCategoryCounts,
  matrixLab3dRefLabel,
  type MatrixLab3dCategoryId,
} from "@/lib/store/matrixlab-3d";
import { cn, formatPrice } from "@/lib/utils";

interface ThreeDFilter {
  id: MatrixLab3dCategoryId | null;
  label: string;
  count: number;
}

/** Filtros derivados de las categorías presentes en el inventario. */
function buildFilters(entries: MatrixLab3dCatalogEntry[]): ThreeDFilter[] {
  const counts = matrixLab3dCategoryCounts(entries.map((e) => e.item));
  const filters: ThreeDFilter[] = [
    { id: null, label: "Todas", count: entries.length },
  ];
  for (const category of MATRIXLAB_3D_CATEGORY_ORDER) {
    if (counts[category] > 0) {
      filters.push({
        id: category,
        label: MATRIXLAB_3D_CATEGORY_LABELS[category],
        count: counts[category],
      });
    }
  }
  return filters;
}

export default function MatrixLab3DCatalog({
  entries,
  whatsappUrl,
  customizationWhatsappUrl,
}: {
  entries: MatrixLab3dCatalogEntry[];
  /** CTA de cotización general mientras el precio no esté confirmado. */
  whatsappUrl: string;
  /** CTA específico de las piezas marcadas como personalizables. */
  customizationWhatsappUrl: string;
}) {
  const [filter, setFilter] = useState<MatrixLab3dCategoryId | null>(null);
  const filters = useMemo(() => buildFilters(entries), [entries]);
  const customRequestUrl = new URL(customizationWhatsappUrl);
  customRequestUrl.searchParams.set(
    "text",
    "Hola MatrixLab, tengo una idea para una pieza 3D que no encontré en el catálogo. Quiero contarles qué busco y cotizarla con ustedes.",
  );

  // Orden del Excel, ya resuelto en el servidor.
  const visible = useMemo(
    () => entries.filter((entry) => matchesMatrixLab3dFilter(entry.item, filter)),
    [entries, filter],
  );

  return (
    <div className="mt-10">
      <section
        aria-labelledby="custom-3d-heading"
        className="mb-8 overflow-hidden rounded-2xl border border-ml-violet/40 bg-linear-to-br from-ml-violet/20 via-ml-bg to-ml-cyan/10 p-5 sm:p-8"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-ml-cyan">
              Tu idea también tiene lugar aquí
            </p>
            <h2 id="custom-3d-heading" className="text-2xl font-bold leading-tight text-ml-white sm:text-3xl">
              ¿No lo ves? Lo creamos contigo.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-ml-white/75 sm:text-base">
              Ese regalo, accesorio o detalle que tienes en mente puede ser tu
              próxima pieza favorita. Mándanos una foto, un boceto o cuéntanos
              qué buscas y le damos forma en 3D.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 lg:items-center">
            <a
              href={customRequestUrl.toString()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ml-green px-6 py-3 text-sm font-bold text-ml-bg transition hover:bg-ml-green/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ml-cyan"
            >
              <MessageCircle className="h-5 w-5" aria-hidden />
              Quiero crear mi pieza
            </a>
            <p className="text-center text-xs text-ml-white/60">
              Platiquemos por WhatsApp
            </p>
          </div>
        </div>
      </section>
      <div className="flex flex-wrap gap-2">
        {filters.map((option) => {
          const active = filter === option.id;
          return (
            <button
              key={option.id ?? "todas"}
              type="button"
              onClick={() => setFilter(option.id)}
              aria-pressed={active}
              className={cn(
                "inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition",
                active
                  ? "border-ml-cyan/60 bg-ml-cyan/15 text-ml-cyan"
                  : "border-white/10 bg-white/5 text-ml-white/70 hover:border-white/25 hover:text-ml-white",
              )}
            >
              {option.label}
              <span
                className={cn(
                  "text-xs font-medium",
                  active ? "text-ml-cyan/70" : "text-ml-white/40",
                )}
              >
                ({option.count})
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-sm text-ml-white/50" aria-live="polite">
        {visible.length} de {entries.length} piezas
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
        {visible.map((entry) => (
          <ThreeDCard
            key={entry.handle}
            entry={entry}
            whatsappUrl={whatsappUrl}
            customizationWhatsappUrl={customizationWhatsappUrl}
          />
        ))}
      </div>
    </div>
  );
}

/** Tarjeta con precio del Excel y consulta de la pieza por WhatsApp. */
function ThreeDCard({
  entry,
  whatsappUrl,
  customizationWhatsappUrl,
}: {
  entry: MatrixLab3dCatalogEntry;
  whatsappUrl: string;
  customizationWhatsappUrl: string;
}) {
  const { item } = entry;
  const priceConfirmed = entry.price !== null;
  const contactUrl = new URL(item.customizable ? customizationWhatsappUrl : whatsappUrl);
  contactUrl.searchParams.set("text", `Hola MatrixLab, quiero ${item.customizable ? "personalizar" : "consultar"} ${entry.title} (${item.code}), ${item.salesUnit}.`);

  return (
    <article
      className={cn(
        "glass flex flex-col overflow-hidden rounded-2xl transition",
        item.customizable
          ? "border-ml-violet/40 hover:border-ml-violet/70"
          : "hover:border-ml-violet/40",
      )}
    >
      <div className="relative">
        <ThreeDProductGallery images={entry.images} title={entry.title} />
        <div className="pointer-events-none absolute inset-x-3 top-3 flex flex-wrap items-start justify-between gap-1.5">
        <span className="rounded-full bg-ml-bg/85 px-3 py-1 text-xs font-semibold text-ml-cyan">
          {MATRIXLAB_3D_CATEGORY_LABELS[item.category]}
        </span>
        {item.customizable && (
          <span className="inline-flex items-center gap-1 rounded-full bg-ml-violet px-3 py-1 text-xs font-semibold text-ml-white">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Personalizable
          </span>
        )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-base font-bold leading-snug text-ml-white sm:text-lg">
          {entry.title}
        </h3>

        <p className="text-sm text-ml-white/60">{item.description}</p>

        <p className="text-sm text-ml-white/60">
          {item.usageLabel} · {item.finishLabel}
        </p>

        {priceConfirmed ? (
          <p className="text-xl font-bold text-ml-white">
            {item.priceFrom && "Desde "}{formatPrice(entry.price as number)}
            <span className="block text-xs font-normal text-ml-white/60">
              MXN / {item.salesUnit}
            </span>
          </p>
        ) : (
          <p className="text-sm font-semibold text-ml-white/70">
            Precio por confirmar
          </p>
        )}

        <p className="text-xs text-ml-white/40">
          {matrixLab3dRefLabel(item.code)} · {entry.sku}
        </p>

        <div className="mt-auto pt-2">
          <a
            href={contactUrl.toString()}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition",
              item.customizable
                ? "bg-ml-violet text-ml-white hover:bg-ml-violet/90"
                : "bg-ml-green text-ml-bg hover:bg-ml-green/90",
            )}
          >
            {item.customizable ? (
              <>
                <Sparkles className="h-4 w-4" aria-hidden />
                Consultar personalización
              </>
            ) : (
              <>
                <MessageCircle className="h-4 w-4" aria-hidden />
                {priceConfirmed ? "Pedir por WhatsApp" : "Consultar precio"}
              </>
            )}
          </a>
        </div>
      </div>
    </article>
  );
}

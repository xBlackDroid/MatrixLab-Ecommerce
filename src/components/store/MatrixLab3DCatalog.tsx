"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
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

/**
 * Filtros derivados EXCLUSIVAMENTE del Excel: las 6 categorías reales. Con 7
 * piezas no hace falta buscador, pero el filtro sí aporta (Organizadores
 * agrupa 2). Una categoría sin piezas no se muestra.
 */
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

  // Orden del Excel (3D001 → 3D007), ya resuelto en el servidor.
  const visible = useMemo(
    () => entries.filter((entry) => matchesMatrixLab3dFilter(entry.item, filter)),
    [entries, filter],
  );

  return (
    <div className="mt-10">
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

      <div className="mt-6 grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 sm:gap-6 lg:grid-cols-3">
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

/**
 * Tarjeta de una pieza 3D. Las piezas personalizables del Excel (3D004, 3D005,
 * 3D007) se destacan visualmente y cambian su CTA a "Consultar
 * personalización": el Laboratorio no tiene editor de piezas 3D, así que NO se
 * promete un configurador que no existe.
 */
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

  return (
    <article
      className={cn(
        "glass flex flex-col overflow-hidden rounded-2xl transition",
        item.customizable
          ? "border-ml-violet/40 hover:border-ml-violet/70"
          : "hover:border-ml-violet/40",
      )}
    >
      <div className="relative aspect-square w-full overflow-hidden">
        <Image
          src={entry.image}
          alt={entry.title}
          fill
          sizes="(max-width: 420px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition duration-500 hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full bg-ml-bg/85 px-3 py-1 text-xs font-semibold text-ml-cyan">
          {MATRIXLAB_3D_CATEGORY_LABELS[item.category]}
        </span>
        {item.customizable && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-ml-violet px-3 py-1 text-xs font-semibold text-ml-white">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Personalizable
          </span>
        )}
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
            {formatPrice(entry.price as number)}
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
            href={item.customizable ? customizationWhatsappUrl : whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition",
              item.customizable
                ? "bg-ml-violet text-ml-white hover:bg-ml-violet/90"
                : "bg-ml-green text-ml-bg hover:bg-ml-green/90",
            )}
          >
            {/* Los 7 precios siguen pendientes: el CTA pide precio en vez de
                mostrar una cifra. Las piezas personalizables se atienden por
                WhatsApp en esta versión (no hay configurador 3D). */}
            {item.customizable ? (
              <>
                <Sparkles className="h-4 w-4" aria-hidden />
                Consultar personalización
              </>
            ) : (
              <>
                <MessageCircle className="h-4 w-4" aria-hidden />
                Consultar precio
              </>
            )}
          </a>
        </div>
      </div>
    </article>
  );
}

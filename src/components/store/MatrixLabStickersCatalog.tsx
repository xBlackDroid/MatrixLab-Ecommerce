"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { MessageCircle, Search } from "lucide-react";
import type { MatrixLabStickerCatalogEntry } from "@/lib/store/products";
import {
  MATRIXLAB_STICKER_CATEGORY_LABELS,
  MATRIXLAB_STICKER_CATEGORY_ORDER,
  matchesMatrixLabStickerFilter,
  matchesMatrixLabStickerQuery,
  matrixLabStickerCategoryCounts,
  matrixLabStickerRefLabel,
  type MatrixLabStickerCategoryId,
} from "@/lib/store/matrixlab-stickers";
import { cn, formatPrice } from "@/lib/utils";

interface StickerFilter {
  id: MatrixLabStickerCategoryId | null;
  label: string;
  count: number;
}

/**
 * Filtros derivados EXCLUSIVAMENTE del Excel: las 11 familias temáticas reales
 * con su conteo (10 cada una). Una familia sin diseños no se muestra; no se
 * inventa ninguna otra.
 */
function buildFilters(entries: MatrixLabStickerCatalogEntry[]): StickerFilter[] {
  const counts = matrixLabStickerCategoryCounts(entries.map((e) => e.item));
  const filters: StickerFilter[] = [
    { id: null, label: "Todos", count: entries.length },
  ];
  for (const category of MATRIXLAB_STICKER_CATEGORY_ORDER) {
    if (counts[category] > 0) {
      filters.push({
        id: category,
        label: MATRIXLAB_STICKER_CATEGORY_LABELS[category],
        count: counts[category],
      });
    }
  }
  return filters;
}

export default function MatrixLabStickersCatalog({
  entries,
  whatsappUrl,
}: {
  entries: MatrixLabStickerCatalogEntry[];
  /** CTA de cotización mientras el precio no esté confirmado. */
  whatsappUrl: string;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<MatrixLabStickerCategoryId | null>(null);

  const filters = useMemo(() => buildFilters(entries), [entries]);

  // El orden base es el del Excel (GE001 → LE010, ya viene así del servidor):
  // no se reordena alfabéticamente ni por precio.
  const visible = useMemo(
    () =>
      entries.filter(
        (entry) =>
          matchesMatrixLabStickerFilter(entry.item, filter) &&
          matchesMatrixLabStickerQuery(entry.item, query),
      ),
    [entries, filter, query],
  );

  return (
    <div className="mt-10">
      <div className="flex flex-col gap-4">
        <label className="relative block">
          <span className="sr-only">
            Buscar sticker por código, SKU, nombre o categoría
          </span>
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ml-white/40"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por código, SKU, nombre o categoría (GE001, STK-GE001, Anime…)"
            className="glass h-12 w-full rounded-full border border-white/10 bg-white/5 pl-12 pr-4 text-base text-ml-white placeholder:text-ml-white/40 focus:border-ml-cyan/50 focus:outline-none"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          {filters.map((option) => {
            const active = filter === option.id;
            return (
              <button
                key={option.id ?? "todos"}
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

        <p className="text-sm text-ml-white/50" aria-live="polite">
          {visible.length} de {entries.length} stickers
        </p>
      </div>

      {visible.length === 0 ? (
        <div className="glass mt-6 rounded-2xl p-10 text-center text-ml-white/60">
          No encontramos stickers con esa búsqueda. Prueba con el código o el
          SKU (por ejemplo: GE001 o STK-GE001).
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((entry) => (
            <StickerCard
              key={entry.handle}
              entry={entry}
              whatsappUrl={whatsappUrl}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Tarjeta de un diseño. Jerarquía: foto → nombre → categoría → descripción →
 * disponibilidad → precio (SOLO si está confirmado) → referencia discreta.
 * El código interno nunca compite visualmente con el nombre.
 */
function StickerCard({
  entry,
  whatsappUrl,
}: {
  entry: MatrixLabStickerCatalogEntry;
  whatsappUrl: string;
}) {
  const { item } = entry;
  // Mientras el Excel no traiga precio no hay cifra que mostrar ni carrito que
  // ofrecer: la tarjeta invita a cotizar en vez de inventar un precio.
  const priceConfirmed = entry.price !== null;

  return (
    <article className="glass flex flex-col overflow-hidden rounded-2xl transition hover:border-ml-violet/40">
      <div className="relative aspect-square w-full overflow-hidden">
        <Image
          src={entry.image}
          alt={entry.title}
          fill
          sizes="(max-width: 420px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition duration-500 hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full bg-ml-bg/85 px-3 py-1 text-xs font-semibold text-ml-cyan">
          {MATRIXLAB_STICKER_CATEGORY_LABELS[item.category]}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-base font-bold leading-snug text-ml-white sm:text-lg">
          {entry.title}
        </h3>

        <p className="text-sm text-ml-white/60">{item.description}</p>

        <p
          className={cn(
            "text-sm font-semibold",
            entry.sellable ? "text-ml-cyan" : "text-ml-white/60",
          )}
        >
          {entry.declaredInventory > 0 ? "Disponible" : "Sobre pedido"}
        </p>

        {priceConfirmed ? (
          <p className="text-xl font-bold text-ml-white">
            {formatPrice(entry.price as number)}{" "}
            <span className="text-sm font-medium text-ml-white/50">
              / pieza
            </span>
          </p>
        ) : (
          <p className="text-sm font-semibold text-ml-white/70">
            Precio por confirmar
          </p>
        )}

        <p className="text-xs text-ml-white/40">
          {matrixLabStickerRefLabel(item.code)} · {entry.sku}
        </p>

        <div className="mt-auto pt-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-ml-green px-4 py-2.5 text-sm font-semibold text-ml-bg transition hover:bg-ml-green/90"
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            Cotizar por WhatsApp
          </a>
        </div>
      </div>
    </article>
  );
}

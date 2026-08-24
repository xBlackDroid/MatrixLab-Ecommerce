"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Search } from "lucide-react";
import AddToCartButton from "@/components/store/AddToCartButton";
import type { StickerCatalogEntry } from "@/lib/store/products";
import {
  matchesStickerFilter,
  matchesStickerQuery,
  STICKER_FINISH_LABELS,
  STICKER_FINISH_ORDER,
  stickerFinishCounts,
  stickerRefLabel,
  type StickerFinishId,
} from "@/lib/store/tumbler-stickers";
import { cn, formatPrice } from "@/lib/utils";

interface StickerFilter {
  id: StickerFinishId | null;
  label: string;
  count: number;
}

/**
 * Filtros derivados EXCLUSIVAMENTE del Excel: las cuatro familias reales
 * (24 oz, Holográfico, Glitter, Mini) con su conteo. Una familia sin
 * productos presentes no se muestra; no se inventa ninguna otra.
 */
function buildFilters(entries: StickerCatalogEntry[]): StickerFilter[] {
  const counts = stickerFinishCounts(entries.map((e) => e.item));
  const filters: StickerFilter[] = [
    { id: null, label: "Todos", count: entries.length },
  ];
  for (const finish of STICKER_FINISH_ORDER) {
    if (counts[finish] > 0) {
      filters.push({
        id: finish,
        label: STICKER_FINISH_LABELS[finish],
        count: counts[finish],
      });
    }
  }
  return filters;
}

export default function TumblerStickersCatalog({
  entries,
}: {
  entries: StickerCatalogEntry[];
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StickerFinishId | null>(null);

  const filters = useMemo(() => buildFilters(entries), [entries]);

  // El orden base es el del Excel A001→A209 (ya viene así del servidor): no se
  // reordena alfabéticamente ni por precio.
  const visible = useMemo(
    () =>
      entries.filter(
        (entry) =>
          matchesStickerFilter(entry.item, filter) &&
          matchesStickerQuery(entry.item, query),
      ),
    [entries, filter, query],
  );

  return (
    <div className="mt-10">
      <div className="flex flex-col gap-4">
        <label className="relative block">
          <span className="sr-only">
            Buscar UV Sticker por código, nombre o SKU
          </span>
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ml-white/40"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por código, nombre o SKU (A050, STK-A187…)"
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
          {visible.length} de {entries.length} UV Stickers
        </p>
      </div>

      {visible.length === 0 ? (
        <div className="glass mt-6 rounded-2xl p-10 text-center text-ml-white/60">
          No encontramos UV Stickers con esa búsqueda. Prueba con el código o el
          SKU (por ejemplo: A050 o STK-A050).
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((entry) => (
            <StickerCard key={entry.productId} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Tarjeta de un UV Sticker. Jerarquía: foto grande → nombre → precio →
 * inventario → acabado → referencia discreta. El código interno nunca compite
 * visualmente con el nombre.
 */
function StickerCard({ entry }: { entry: StickerCatalogEntry }) {
  const maxQuantity = Math.max(0, entry.stock);
  const [quantity, setQuantity] = useState(1);
  const soldOut = !entry.sellable || maxQuantity <= 0;

  function step(delta: number) {
    setQuantity((current) =>
      Math.min(Math.max(current + delta, 1), Math.max(1, maxQuantity)),
    );
  }

  return (
    <article className="glass flex flex-col overflow-hidden rounded-2xl transition hover:border-ml-violet/40">
      <Link
        href={`/tienda/producto/${entry.handle}`}
        className="group relative block aspect-square w-full overflow-hidden"
      >
        <Image
          src={entry.image}
          alt={entry.title}
          fill
          sizes="(max-width: 420px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        {soldOut && (
          <span className="absolute left-3 top-3 rounded-full bg-ml-bg/85 px-3 py-1 text-xs font-semibold text-ml-white/80">
            Agotado
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link href={`/tienda/producto/${entry.handle}`}>
          <h3 className="text-base font-bold leading-snug text-ml-white transition hover:text-ml-violet sm:text-lg">
            {entry.title}
          </h3>
        </Link>

        <p className="text-xl font-bold text-ml-white">
          {formatPrice(entry.price)}{" "}
          <span className="text-sm font-medium text-ml-white/50">/ pieza</span>
        </p>

        <p
          className={cn(
            "text-sm font-semibold",
            soldOut ? "text-ml-white/50" : "text-ml-cyan",
          )}
        >
          {soldOut ? "Agotado" : `Disponible: ${maxQuantity}`}
        </p>

        <p className="text-sm text-ml-white/60">{entry.item.finishLabel}</p>

        <p className="text-xs text-ml-white/40">
          {stickerRefLabel(entry.item.code)}
        </p>

        <div className="mt-auto flex flex-col gap-2 pt-2">
          {!soldOut && (
            <div className="flex items-center justify-between gap-2 rounded-full border border-white/10 bg-white/5 p-1">
              <button
                type="button"
                onClick={() => step(-1)}
                disabled={quantity <= 1}
                aria-label="Quitar una unidad"
                className="flex h-11 w-11 items-center justify-center rounded-full text-ml-white/80 transition hover:bg-white/10 disabled:opacity-30"
              >
                <Minus className="h-4 w-4" aria-hidden />
              </button>
              <span className="min-w-8 text-center text-base font-semibold">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => step(1)}
                // Nunca se puede pedir más que el inventario real; el servidor
                // vuelve a validar stock y precio al agregar al carrito.
                disabled={quantity >= maxQuantity}
                aria-label="Agregar una unidad"
                className="flex h-11 w-11 items-center justify-center rounded-full text-ml-white/80 transition hover:bg-white/10 disabled:opacity-30"
              >
                <Plus className="h-4 w-4" aria-hidden />
              </button>
            </div>
          )}
          <AddToCartButton
            productId={entry.productId}
            variantId={entry.variantId}
            quantity={quantity}
            disabled={soldOut}
            label={soldOut ? "Agotado" : "Agregar"}
            className="min-h-11 px-4 py-2.5 text-sm"
          />
        </div>
      </div>
    </article>
  );
}

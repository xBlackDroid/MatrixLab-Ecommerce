"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Search } from "lucide-react";
import AddToCartButton from "@/components/store/AddToCartButton";
import type { SparkleCatalogEntry } from "@/lib/store/products";
import {
  isLimitedEditionCode,
  LIMITED_EDITION_FILTER,
  matchesSparkleFilter,
  matchesSparkleQuery,
  SPARKLE_COLLECTIONS,
  sparkleRefLabel,
  UNCLASSIFIED_FILTER,
} from "@/lib/store/tumbler-sparkles";
import { cn, formatPrice } from "@/lib/utils";

interface SparkleFilter {
  id: string | null;
  label: string;
}

/**
 * Filtros derivados EXCLUSIVAMENTE del Excel: las colecciones que sí existen,
 * "Limited Edition" (agrupada por prefijo LE del código) y un grupo para las
 * filas cuya celda de colección está vacía. No se inventa ninguna colección.
 */
function buildFilters(entries: SparkleCatalogEntry[]): SparkleFilter[] {
  const present = new Set(
    entries.map((e) => e.item.collection).filter(Boolean) as string[],
  );
  const filters: SparkleFilter[] = [{ id: null, label: "Todos" }];
  for (const collection of SPARKLE_COLLECTIONS) {
    if (present.has(collection)) {
      filters.push({ id: collection, label: collection });
    }
  }
  if (entries.some((e) => isLimitedEditionCode(e.item.code))) {
    filters.push({ id: LIMITED_EDITION_FILTER, label: "Limited Edition" });
  }
  if (
    entries.some((e) => !e.item.collection && !isLimitedEditionCode(e.item.code))
  ) {
    filters.push({ id: UNCLASSIFIED_FILTER, label: "Sin colección" });
  }
  return filters;
}

export default function SparklesCatalog({
  entries,
}: {
  entries: SparkleCatalogEntry[];
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string | null>(null);

  const filters = useMemo(() => buildFilters(entries), [entries]);

  // El orden base es el del Excel (ya viene así del servidor): no se reordena.
  const visible = useMemo(
    () =>
      entries.filter(
        (entry) =>
          matchesSparkleFilter(entry.item, filter) &&
          matchesSparkleQuery(entry.item, query),
      ),
    [entries, filter, query],
  );

  return (
    <div className="mt-10">
      <div className="flex flex-col gap-4">
        <label className="relative block">
          <span className="sr-only">Buscar Sparkle por nombre o código</span>
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ml-white/40"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre o código (Dragon, C08R, Glow…)"
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
                  "inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold transition",
                  active
                    ? "border-ml-cyan/60 bg-ml-cyan/15 text-ml-cyan"
                    : "border-white/10 bg-white/5 text-ml-white/70 hover:border-white/25 hover:text-ml-white",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <p className="text-sm text-ml-white/50" aria-live="polite">
          {visible.length} de {entries.length} Sparkles
        </p>
      </div>

      {visible.length === 0 ? (
        <div className="glass mt-6 rounded-2xl p-10 text-center text-ml-white/60">
          No encontramos Sparkles con esa búsqueda. Prueba con el nombre o el
          código (por ejemplo: C08R).
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((entry) => (
            <SparkleCard key={entry.productId} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Tarjeta de un Sparkle. Jerarquía: foto grande → nombre → precio por bote →
 * inventario → referencia discreta. El código nunca compite con el nombre.
 */
function SparkleCard({ entry }: { entry: SparkleCatalogEntry }) {
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
          <h3 className="text-lg font-bold leading-snug text-ml-white transition hover:text-ml-violet">
            {entry.title}
          </h3>
        </Link>

        <p className="text-xl font-bold text-ml-white">
          {formatPrice(entry.price)}{" "}
          <span className="text-sm font-medium text-ml-white/50">/ bote</span>
        </p>

        <p
          className={cn(
            "text-sm font-semibold",
            soldOut ? "text-ml-white/50" : "text-ml-cyan",
          )}
        >
          {soldOut ? "Agotado" : `Disponible: ${maxQuantity}`}
        </p>

        <p className="text-xs text-ml-white/40">
          {sparkleRefLabel(entry.item.code)}
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

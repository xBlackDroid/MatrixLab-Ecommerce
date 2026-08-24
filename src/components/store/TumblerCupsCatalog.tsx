"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus } from "lucide-react";
import AddToCartButton from "@/components/store/AddToCartButton";
import type { CupCatalogEntry } from "@/lib/store/products";
import { cupRefLabel } from "@/lib/store/tumbler-cups";
import { cn, formatPrice } from "@/lib/utils";

/**
 * Catálogo de vasos de MatrixLab Tumbler.
 *
 * Son 5 productos y caben completos en pantalla, así que —a diferencia de
 * Sparkles (46) y UV Stickers (209)— NO lleva buscador ni filtros: con este
 * volumen sólo añadirían ruido, sobre todo en móvil. El orden es el del Excel
 * (V001 → V005) y no se reordena.
 */
export default function TumblerCupsCatalog({
  entries,
}: {
  entries: CupCatalogEntry[];
}) {
  return (
    <div className="mt-10">
      <p className="text-sm text-ml-white/50">
        {entries.length} {entries.length === 1 ? "vaso" : "vasos"} disponibles
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
        {entries.map((entry) => (
          <CupCard key={entry.productId} entry={entry} />
        ))}
      </div>
    </div>
  );
}

/**
 * Tarjeta de un vaso. Jerarquía pedida: foto → nombre → precio → capacidad →
 * stock → referencia discreta → selector → CTA. El código interno nunca
 * compite visualmente con el nombre.
 */
function CupCard({ entry }: { entry: CupCatalogEntry }) {
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

        <p className="text-sm text-ml-white/60">{entry.item.capacity}</p>

        <p
          className={cn(
            "text-sm font-semibold",
            soldOut ? "text-ml-white/50" : "text-ml-cyan",
          )}
        >
          {soldOut ? "Agotado" : `Disponible: ${maxQuantity}`}
        </p>

        <p className="text-xs text-ml-white/40">{cupRefLabel(entry.item.code)}</p>

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

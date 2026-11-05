"use client";

import { useState } from "react";
import Image from "@/components/store/StoreImage";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import AddToCartButton from "@/components/store/AddToCartButton";
import type { CupCatalogEntry } from "@/lib/store/products";
import { cupCatalogKind, cupRefLabel, type CupCatalogKind } from "@/lib/store/tumbler-cups";
import { cn, formatPrice } from "@/lib/utils";

/**
 * Catálogo de vasos de MatrixLab Tumbler.
 *
 * Conserva el orden del catálogo y permite encontrar por separado vasos
 * y termos, también mediante un enlace con ?tipo=termos.
 */
export default function TumblerCupsCatalog({
  entries,
}: {
  entries: CupCatalogEntry[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const rawKind = searchParams.get("tipo");
  const selectedKind: CupCatalogKind | null =
    rawKind === "vasos" || rawKind === "termos" ? rawKind : null;
  const visibleEntries = selectedKind
    ? entries.filter((entry) => cupCatalogKind(entry.item) === selectedKind)
    : entries;
  const filters: { kind: CupCatalogKind | null; label: string; count: number }[] = [
    { kind: null, label: "Todos", count: entries.length },
    { kind: "vasos", label: "Vasos", count: entries.filter((entry) => cupCatalogKind(entry.item) === "vasos").length },
    { kind: "termos", label: "Termos", count: entries.filter((entry) => cupCatalogKind(entry.item) === "termos").length },
  ];
  function selectKind(kind: CupCatalogKind | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (kind) params.set("tipo", kind);
    else params.delete("tipo");
    router.replace(`${pathname}${params.size ? `?${params.toString()}` : ""}`, { scroll: false });
  }
  return (
    <div className="mt-10">
      <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Filtrar vasos y termos">
        {filters.map((filter) => (
          <button key={filter.kind ?? "todos"} type="button"
            aria-pressed={selectedKind === filter.kind}
            onClick={() => selectKind(filter.kind)}
            className={cn("min-h-11 rounded-full border px-4 py-2 text-sm font-semibold transition",
              selectedKind === filter.kind ? "border-ml-cyan bg-ml-cyan/15 text-ml-cyan" : "border-ui-border text-ui-text-muted hover:border-ml-cyan/50")}>
            {filter.label} <span className="ml-1 text-xs opacity-70">{filter.count}</span>
          </button>
        ))}
      </div>
      <p className="text-sm text-ui-text-muted">
        {visibleEntries.length} {visibleEntries.length === 1 ? "producto" : "productos"} disponibles
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 xs:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
        {visibleEntries.map((entry) => (
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
  const [selectedVariantId, setSelectedVariantId] = useState(entry.variants.find(v => v.stock > 0 && v.status === "disponible")?.id ?? entry.variantId);
  const selectedVariant = entry.variants.find(v => v.id === selectedVariantId);
  const maxQuantity = Math.max(0, selectedVariant?.stock ?? entry.stock);
  const [quantity, setQuantity] = useState(1);
  const soldOut = !entry.sellable || maxQuantity <= 0 || selectedVariant?.status === "agotado" || selectedVariant?.status === "oculto";

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

          brand="tumbler"
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
          {formatPrice(selectedVariant?.price ?? entry.price)}{" "}
          <span className="text-sm font-medium text-ui-text-muted">/ pieza</span>
        </p>

        <p className="text-sm text-ml-white/60">{entry.item.capacity}</p>
        {entry.variants.length > 1 && <label className="text-sm text-ml-white/70">Color<select aria-label={`Color de ${entry.title}`} value={selectedVariantId ?? ""} onChange={e => { setSelectedVariantId(e.target.value); setQuantity(1); }} className="mt-2 min-h-11 w-full rounded-xl border border-white/15 bg-ml-bg px-3 text-ml-white">{entry.variants.map(v => <option key={v.id} value={v.id}>{v.color ?? v.title}{v.stock <= 0 ? " · Agotado" : ""}</option>)}</select></label>}

        <p
          className={cn(
            "text-sm font-semibold",
            soldOut ? "text-ui-text-muted" : "text-ml-cyan",
          )}
        >
          {soldOut ? "Agotado" : `Disponible: ${maxQuantity}`}
        </p>

        <p className="text-xs text-ui-text-muted">{cupRefLabel(entry.item.code)}</p>

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
            variantId={selectedVariantId}
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

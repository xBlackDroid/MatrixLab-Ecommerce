"use client";

import ProductDescription from "./ProductDescription";
import CollapsibleCatalogFilters from "./CollapsibleCatalogFilters";

import useUrlState from "@/lib/ui/useUrlState";
import { CatalogSearch, CatalogCount, CatalogEmpty } from "./CatalogControls";
import { useMemo } from "react";
import Image from "@/components/store/StoreImage";
import Link from "next/link";
import { Wand2 } from "lucide-react";
import type { MatrixLabWearCatalogEntry } from "@/lib/store/products";
import {
  MATRIXLAB_WEAR_CATEGORY_LABELS,
  MATRIXLAB_WEAR_CATEGORY_ORDER,
  matchesMatrixLabWearFilter,
  matchesMatrixLabWearQuery,
  matrixLabWearCategoryCounts,
  matrixLabWearDesignerHref,
  matrixLabWearRefLabel,
  type MatrixLabWearCategoryId,
} from "@/lib/store/matrixlab-wear";
import { cn, formatPrice } from "@/lib/utils";

interface WearFilter {
  id: MatrixLabWearCategoryId | null;
  label: string;
  count: number;
}

/**
 * Filtros derivados EXCLUSIVAMENTE del Excel: las 10 familias temáticas reales
 * con su conteo (10 cada una). No se inventa ninguna otra.
 */
function buildFilters(entries: MatrixLabWearCatalogEntry[]): WearFilter[] {
  const counts = matrixLabWearCategoryCounts(entries.map((e) => e.item));
  const filters: WearFilter[] = [
    { id: null, label: "Todos", count: entries.length },
  ];
  for (const category of MATRIXLAB_WEAR_CATEGORY_ORDER) {
    if (counts[category] > 0) {
      filters.push({
        id: category,
        label: MATRIXLAB_WEAR_CATEGORY_LABELS[category],
        count: counts[category],
      });
    }
  }
  return filters;
}

export default function MatrixLabWearCatalog({
  entries,
}: {
  entries: MatrixLabWearCatalogEntry[];
}) {
  const [query, setQuery] = useUrlState<string>("q", "", undefined, "replace");
  const [filter, setFilter] = useUrlState<MatrixLabWearCategoryId | null>("filtro", null, MATRIXLAB_WEAR_CATEGORY_ORDER);

  const filters = useMemo(() => buildFilters(entries), [entries]);

  // El orden base es el del Excel (GE001 → MU010, ya viene así del servidor).
  const visible = useMemo(
    () =>
      entries.filter(
        (entry) =>
          matchesMatrixLabWearFilter(entry.item, filter) &&
          matchesMatrixLabWearQuery(entry.item, query),
      ),
    [entries, filter, query],
  );

  return (
    <div className="mt-10">
      {/* La talla y el color NO se eligen aquí: el Excel los declara "Por
          definir" y el modelo real vive en el Laboratorio. Decirlo de frente
          evita que el cliente espere un selector que no existe todavía. */}
      <div className="glass hidden rounded-2xl border border-ml-violet/25 p-4 text-sm text-ml-white/70 sm:block">
        Estos son los <strong className="text-ml-white">diseños</strong> de
        MatrixLab Wear. Elige el que te guste y personalízalo en el
        Laboratorio: ahí eliges talla, color y confirmas el precio de tu
        playera.
      </div>

      <div className="mt-6 flex flex-col gap-4">
        <CollapsibleCatalogFilters label="Filtrar diseños Wear" selected={filters.find(option => option.id === filter)?.label ?? "Todos"}><div className="catalog-filters flex flex-wrap gap-2">
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
                    active ? "text-ml-cyan/70" : "text-ui-text-muted",
                  )}
                >
                  ({option.count})
                </span>
              </button>
            );
          })}
        </div></CollapsibleCatalogFilters>

        <CatalogSearch label="Buscar diseño por código, SKU, nombre o categoría" value={query} onChange={setQuery} placeholder="Buscar por código, SKU, nombre o categoría (GE001, WEAR-GE001, Gamer…)" />

        <CatalogCount visible={visible.length} total={entries.length} noun="diseños" />
      </div>

      {visible.length === 0 ? (
        <CatalogEmpty
          emptyCatalog={entries.length === 0}
          message="No encontramos diseños con esa búsqueda. Prueba con el código o el SKU (por ejemplo: GE001 o WEAR-GE001)."
          onClear={() => { setQuery(""); setFilter(null); }}
        />
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 xs:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((entry) => (
            <WearCard key={entry.handle} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Tarjeta de un diseño de playera. El CTA es "Personalizar" y lleva al
 * Laboratorio existente: NO se agrega al carrito desde aquí porque la talla y
 * el color todavía no están resueltos (el Excel los declara "Por definir") y
 * un artículo sin esos datos sería un pedido incompleto.
 */
function WearCard({ entry }: { entry: MatrixLabWearCatalogEntry }) {
  const { item } = entry;
  const priceConfirmed = entry.price !== null;

  return (
    <article className="glass flex flex-col overflow-hidden rounded-2xl transition hover:border-ml-violet/40">
      <div className="relative aspect-square w-full overflow-hidden">
        <Image

          brand="wear"
          src={entry.image}
          alt={entry.title}
          fill
          sizes="(max-width: 420px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition duration-500 hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full bg-ml-bg/85 px-3 py-1 text-xs font-semibold text-ml-cyan">
          {MATRIXLAB_WEAR_CATEGORY_LABELS[item.category]}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-base font-bold leading-snug text-ml-white sm:text-lg">
          {entry.title}
        </h3>

        <ProductDescription><p className="text-sm text-ml-white/60">{item.description}</p></ProductDescription>

        <p className="text-sm text-ml-white/60">{item.garmentType}</p>

        {priceConfirmed ? (
          <p className="text-xl font-bold text-ml-white">
            {formatPrice(entry.price as number)}
          </p>
        ) : (
          <p className="text-sm font-semibold text-ml-white/70">
            {/* Ni precio, ni talla, ni color inventados: se resuelven en el
                Laboratorio, que es donde ya existe ese modelo. */}
            Talla, color y precio se eligen al personalizar
          </p>
        )}

        <p className="text-xs text-ui-text-muted">
          {matrixLabWearRefLabel(item.code)} · {entry.sku}
        </p>

        <div className="mt-auto pt-2">
          {/* Conserva el diseño elegido (?design=wear-ge001). El Laboratorio
              lo valida contra la allowlist y lo muestra como referencia. */}
          <Link
            href={matrixLabWearDesignerHref(item.code)}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-ml-violet px-4 py-2.5 text-sm font-semibold text-ml-white transition hover:bg-ml-violet/90"
          >
            <Wand2 className="h-4 w-4" aria-hidden />
            Personalizar
          </Link>
        </div>
      </div>
    </article>
  );
}

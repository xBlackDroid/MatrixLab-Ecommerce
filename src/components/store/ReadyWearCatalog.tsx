"use client";
import { useId, useMemo, useState } from "react";
import Link from "next/link";
import ProductGrid from "./ProductGrid";
import {
  countReadyWearTypes,
  EMPTY_READY_WEAR_FILTERS,
  filterReadyWearListings,
  normalizeReadyWearFilters,
  READY_WEAR_QUERY_MAX_LENGTH,
  READY_WEAR_TYPES,
  readyWearCollectionsFor,
  writeReadyWearFilters,
  type ReadyWearFilters,
  type ReadyWearListing,
} from "@/lib/store/ready-wear";
import { cn } from "@/lib/utils";

const chip = (active: boolean) =>
  cn(
    "inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold",
    active
      ? "border-ml-cyan/60 bg-ml-cyan/15 text-ml-cyan"
      : "border-white/15 bg-white/5 text-ml-white/70",
  );

/**
 * Filtros independientes que se combinan: tipo de prenda, colección y
 * búsqueda. El estado inicial llega del servidor (`?tipo=`, `?coleccion=`,
 * `?q=`), así que el HTML y la hidratación coinciden; cada cambio reescribe la
 * URL sin navegar, para que el enlace se pueda compartir tal cual.
 */
export default function ReadyWearCatalog({
  products,
  initialFilters = EMPTY_READY_WEAR_FILTERS,
}: {
  products: ReadyWearListing[];
  initialFilters?: ReadyWearFilters;
}) {
  const id = useId();
  const [filters, setFilters] = useState(() =>
    normalizeReadyWearFilters(products, initialFilters),
  );
  const visible = useMemo(() => {
    const priority = new Map<string, number>(READY_WEAR_TYPES.map((type, index) => [type.id, index]));
    // La prioridad comercial agrupa tipos y conserva el orden dentro de cada uno.
    return filterReadyWearListings(products, filters).sort((a, b) =>
      (priority.get(a.readyWearType ?? "") ?? priority.size) -
      (priority.get(b.readyWearType ?? "") ?? priority.size),
    );
  }, [products, filters]);
  const collections = useMemo(
    () => readyWearCollectionsFor(products, filters.type),
    [products, filters.type],
  );
  const typeCounts = useMemo(() => countReadyWearTypes(products), [products]);
  const selectedType = READY_WEAR_TYPES.find((t) => t.id === filters.type);

  function update(next: ReadyWearFilters) {
    // Cambiar de tipo suelta una colección que no convive con él.
    const normalized = normalizeReadyWearFilters(products, next);
    setFilters(normalized);
    const url = new URL(window.location.href);
    writeReadyWearFilters(url.searchParams, normalized);
    window.history.replaceState(null, "", url.toString());
  }

  return <div className="space-y-6">
    <label className="block max-w-lg text-sm text-ml-white/70">Buscar prenda o tote<input type="search" value={filters.query} maxLength={READY_WEAR_QUERY_MAX_LENGTH} onChange={e => update({ ...filters, query: e.target.value })} placeholder="Buscar por nombre o diseño" className="mt-2 min-h-11 w-full rounded-xl border border-white/15 bg-white/5 px-4 text-base text-ml-white" /></label>

    <div role="group" aria-labelledby={`${id}-tipo`} className="space-y-2">
      <p id={`${id}-tipo`} className="text-sm font-medium text-ml-white/70">Tipo de prenda</p>
      <div className="flex flex-wrap gap-2">
        {[{ id: null, label: "Todos los tipos" }, ...READY_WEAR_TYPES].map(type => <button key={type.id ?? "todos"} type="button" aria-pressed={filters.type === type.id} onClick={() => update({ ...filters, type: type.id })} className={chip(filters.type === type.id)}>{type.label}<span className="text-xs font-medium opacity-70">({type.id ? typeCounts[type.id] : products.length})</span></button>)}
      </div>
    </div>

    <div role="group" aria-labelledby={`${id}-coleccion`} className="space-y-2">
      <p id={`${id}-coleccion`} className="text-sm font-medium text-ml-white/70">Colección</p>
      <div className="flex flex-wrap gap-2">
        {[{ id: null, label: "Todas" }, ...collections].map(collection => <button key={collection.id ?? "todas"} type="button" aria-pressed={filters.collection === collection.id} onClick={() => update({ ...filters, collection: collection.id })} className={chip(filters.collection === collection.id)}>{collection.label}</button>)}
      </div>
    </div>

    <p role="status" className="text-sm text-ml-white/60">{visible.length} {visible.length === 1 ? "producto disponible" : "productos disponibles"}</p>
    {visible.length > 0 ? <ProductGrid products={visible} /> : selectedType && typeCounts[selectedType.id] === 0 ? (
      // Tipo sin ninguna prenda con foto (hoy, gorras): se dice tal cual.
      <div className="glass rounded-2xl p-10 text-center text-ml-white/60">
        <p>Por ahora no hay {selectedType.label.toLowerCase()} disponibles en prendas listas.</p>
        <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button type="button" onClick={() => update(EMPTY_READY_WEAR_FILTERS)} className={chip(false)}>Ver todas las prendas</button>
          <Link href={selectedType.designerHref} className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold text-ml-violet hover:text-ml-white">Diseñar en el Laboratorio</Link>
        </div>
      </div>
    ) : (
      <div className="glass rounded-2xl p-10 text-center text-ml-white/60">
        <p>No hay productos disponibles para esta búsqueda.</p>
        <button type="button" onClick={() => update(EMPTY_READY_WEAR_FILTERS)} className={cn(chip(false), "mt-5")}>Limpiar filtros</button>
      </div>
    )}
  </div>;
}

"use client";
import { useMemo } from "react";
import type { ProductRow } from "@/lib/db/types";
import ProductGrid from "./ProductGrid";
import { READY_WEAR_COLLECTIONS, READY_WEAR_TYPES, READY_WEAR_TYPE_IDS, readyWearTypeOf, orderReadyWearProducts } from "@/lib/store/ready-wear";
import useUrlState, { updateUrlState } from "@/lib/ui/useUrlState";
import { Shirt } from "lucide-react";
import { CapIcon, HoodieIcon, ToteIcon } from "@/components/icons/GarmentIcons";
import styles from "./CatalogNavigation.module.css";

const collectionIds = READY_WEAR_COLLECTIONS.map(({ id }) => id);
const garmentIcons = { sudaderas: HoodieIcon, playeras: Shirt, gorras: CapIcon, totes: ToteIcon };

export default function ReadyWearCatalog({ products }: { products: ProductRow[] }) {
  const [type] = useUrlState<string>("tipo", "", READY_WEAR_TYPE_IDS);
  const [category, setCategory] = useUrlState<string>("coleccion", "", collectionIds);
  const [query, setQuery] = useUrlState<string>("q", "", undefined, "replace");
  const typeProducts = useMemo(() => products.filter(product => !type || readyWearTypeOf(product) === type), [products, type]);
  const visible = useMemo(() => orderReadyWearProducts(products.filter(product =>
    (!type || readyWearTypeOf(product) === type) &&
    (!category || product.tags.includes("coleccion:" + category)) &&
    (!query.trim() || (product.title + " " + product.handle).toLocaleLowerCase("es").includes(query.trim().toLocaleLowerCase("es")))
  )), [products, type, category, query]);
  const collections = READY_WEAR_COLLECTIONS.filter(collection => typeProducts.some(product => product.tags.includes("coleccion:" + collection.id)));
  const selectedType = READY_WEAR_TYPES.find(item => item.id === type);
  return <div className="space-y-4 sm:space-y-6">
    <div className={`${styles.navigation} ${styles.wear}`} role="group" aria-label="Tipos de prenda">
      {READY_WEAR_TYPES.map(item => {
        const Icon = garmentIcons[item.id];
        return <button key={item.id} type="button" aria-pressed={type === item.id} onClick={() => updateUrlState({ tipo: item.id, coleccion: null, q: null })} className={styles.item}><Icon className={styles.symbol} strokeWidth={1.65} aria-hidden /><span className={styles.label}>{item.label}</span></button>;
      })}
    </div>
    <div className="flex items-center justify-between gap-3">
      <p role="status" aria-live="polite" className="text-sm text-ui-text-muted">{visible.length} {visible.length === 1 ? "producto" : "productos"}{selectedType ? ` en ${selectedType.label.toLowerCase()}` : " disponibles"}</p>
      {type && <button type="button" className="min-h-11 shrink-0 text-sm font-semibold text-ml-cyan" onClick={() => updateUrlState({ tipo: null, coleccion: null, q: null })}>Ver todas</button>}
    </div>
    <label className="block max-w-lg text-sm text-ui-text-muted"><span className="sr-only">Buscar {selectedType ? selectedType.label.toLowerCase() : "prenda o tote"}</span><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por nombre o diseño" className="min-h-12 w-full rounded-xl border border-ui-control-border bg-ui-surface px-4 text-base text-ui-text" /></label>
    {collections.length > 1 && <details className="rounded-xl border border-ui-border px-3">
      <summary className="flex min-h-11 cursor-pointer items-center text-sm text-ui-text-muted">Filtrar por colección{category ? `: ${READY_WEAR_COLLECTIONS.find(item => item.id === category)?.label ?? category}` : ""}</summary>
      <div className={`${styles.navigation} ${styles.wear} ${styles.collections} pb-3`} role="group" aria-label="Colecciones de prendas">
        {[{ id: "", label: "Todas" }, ...collections].map(collection => <button key={collection.id} type="button" aria-pressed={category === collection.id} onClick={() => setCategory(collection.id)} className={styles.item}>{collection.label}</button>)}
      </div>
    </details>}
    <ProductGrid products={visible} brandContext="wear" emptyMessage={query || category ? "No hay productos para esta búsqueda. Prueba otro nombre o limpia los filtros." : "No hay prendas disponibles de este tipo por el momento."} />
  </div>;
}

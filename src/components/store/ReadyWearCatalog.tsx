"use client";
import { useMemo, useState } from "react";
import type { ProductRow } from "@/lib/db/types";
import ProductGrid from "./ProductGrid";
import { READY_WEAR_COLLECTIONS } from "@/lib/store/ready-wear";
import { cn } from "@/lib/utils";

export default function ReadyWearCatalog({ products }: { products: ProductRow[] }) {
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");
  const visible = useMemo(() => products.filter(product =>
    (!category || product.tags.includes("coleccion:" + category)) &&
    (!query.trim() || (product.title + " " + product.handle).toLocaleLowerCase("es").includes(query.trim().toLocaleLowerCase("es")))
  ), [products, category, query]);
  return <div className="space-y-6">
    <label className="block max-w-lg text-sm text-ml-white/70">Buscar prenda o tote<input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por nombre o diseño" className="mt-2 min-h-11 w-full rounded-xl border border-white/15 bg-white/5 px-4 text-ml-white" /></label>
    <div className="flex flex-wrap gap-2" aria-label="Categorías de prendas">
      {[{ id: "", label: "Todas" }, ...READY_WEAR_COLLECTIONS].map(collection => <button key={collection.id} type="button" aria-pressed={category === collection.id} onClick={() => setCategory(collection.id)} className={cn("min-h-11 rounded-full border px-4 text-sm font-semibold", category === collection.id ? "border-ml-cyan/60 bg-ml-cyan/15 text-ml-cyan" : "border-white/15 bg-white/5 text-ml-white/70")}>{collection.label}</button>)}
    </div>
    <p role="status" className="text-sm text-ml-white/60">{visible.length} productos disponibles</p>
    <ProductGrid products={visible} emptyMessage="No hay productos disponibles para esta búsqueda." />
  </div>;
}

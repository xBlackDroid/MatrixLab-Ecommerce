"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
import StatusBadge from "@/components/admin/StatusBadge";
import ProductEditor, {
  type ProductWithRelations,
} from "@/components/admin/ProductEditor";
import type { CategoryRow } from "@/lib/db/types";
import { formatPrice } from "@/lib/utils";
import records from "./admin-records.module.css";

interface ProductsAdminClientProps {
  products: ProductWithRelations[];
  categories: CategoryRow[];
  csrf: string;
}

export default function ProductsAdminClient({
  products,
  categories,
  csrf,
}: ProductsAdminClientProps) {
  const router = useRouter();
  const [editing, setEditing] = useState<ProductWithRelations | null>(null);
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");
  const visibleProducts = useMemo(() => { const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es"); const text = normalize(query.trim()); return text ? products.filter(product => normalize(`${product.title} ${product.handle} ${product.categories?.title ?? ""} ${(product.product_variants ?? []).map(variant => variant.sku ?? "").join(" ")}`).includes(text)) : products; }, [products, query]);

  function handleSaved() {
    setEditing(null);
    setCreating(false);
    router.refresh();
  }

  return (
    <>
      <div className="mb-5 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <label className="grid min-w-0 flex-1 gap-2 text-sm text-ui-text-muted sm:max-w-sm">Buscar producto<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Nombre, SKU o categoría" className="min-h-12 w-full min-w-0 rounded-xl border border-ui-control-border bg-ui-surface px-3 text-base text-ui-text" /></label>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 rounded-full bg-ml-violet px-5 py-2.5 text-sm font-semibold text-ml-bg transition hover:bg-ml-violet/90"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Nuevo producto
        </button>
      </div>

      <p role="status" className="mb-3 text-xs text-ui-text-muted">{visibleProducts.length} de {products.length} productos</p>
      <div className={`${records.tableWrap} glass overflow-x-auto rounded-2xl`}>
        <table role="table" className={`${records.table} ui-responsive w-full text-left text-sm`}><caption className="sr-only">Productos del catálogo · precios en MXN</caption>
          <thead className="border-b border-white/10 text-xs uppercase text-ui-text-muted">
            <tr>
              <th scope="col" className="px-5 py-3.5">Producto</th>
              <th scope="col" className="px-5 py-3.5">Categoría</th>
              <th scope="col" className="px-5 py-3.5">Precio</th>
              <th scope="col" className="px-5 py-3.5">Variantes</th>
              <th scope="col" className="px-5 py-3.5">Estado</th>
              <th scope="col" className="px-5 py-3.5">Personalizable</th>
              <th scope="col" className="px-5 py-3.5"><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {visibleProducts.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-ui-text-muted">
                  {query ? "No encontramos productos con esa búsqueda." : "Sin productos todavía. Usa «Nuevo producto» para crear el primero."}
                </td>
              </tr>
            )}
            {visibleProducts.map((product) => (
              <tr key={product.id} className="hover:bg-white/[0.03]">
                <td data-label="Producto" className="px-5 py-3.5">
                  <p className="font-semibold">{product.title}</p>
                  <p className="text-xs text-ui-text-muted">/{product.handle}</p>
                </td>
                <td data-label="Categoría" className="px-5 py-3.5 text-ml-white/70">
                  {product.categories?.title ?? "—"}
                </td>
                <td data-label="Precio" className="px-5 py-3.5 font-semibold">
                  {formatPrice(product.base_price)}
                </td>
                <td data-label="Variantes" className="px-5 py-3.5 text-ml-white/70">
                  {product.product_variants?.length ?? 0}
                </td>
                <td data-label="Estado" className="px-5 py-3.5">
                  <StatusBadge status={product.status} />
                </td>
                <td data-label="Personalizable" className="px-5 py-3.5 text-ml-white/70">
                  {product.is_customizable ? "Sí" : "No"}
                </td>
                <td data-label="Acciones" className="px-5 py-3.5 text-right">
                  <button
                    type="button"
                    onClick={() => setEditing(product)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3.5 py-1.5 text-xs font-semibold transition hover:border-ml-violet/50 hover:text-ml-violet"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden />
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(creating || editing) && (
        <ProductEditor
          product={editing}
          categories={categories}
          csrf={csrf}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}

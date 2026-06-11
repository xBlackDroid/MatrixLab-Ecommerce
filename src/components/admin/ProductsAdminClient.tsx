"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
import StatusBadge from "@/components/admin/StatusBadge";
import ProductEditor, {
  type ProductWithRelations,
} from "@/components/admin/ProductEditor";
import type { CategoryRow } from "@/lib/db/types";
import { formatPrice } from "@/lib/utils";

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

  function handleSaved() {
    setEditing(null);
    setCreating(false);
    router.refresh();
  }

  return (
    <>
      <div className="mb-5 flex justify-end">
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 rounded-full bg-ml-violet px-5 py-2.5 text-sm font-semibold text-ml-bg transition hover:bg-ml-violet/90"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Nuevo producto
        </button>
      </div>

      <div className="glass overflow-x-auto rounded-2xl">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase text-ml-white/45">
            <tr>
              <th className="px-5 py-3.5">Producto</th>
              <th className="px-5 py-3.5">Categoría</th>
              <th className="px-5 py-3.5">Precio</th>
              <th className="px-5 py-3.5">Variantes</th>
              <th className="px-5 py-3.5">Estado</th>
              <th className="px-5 py-3.5">Personalizable</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {products.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-ml-white/50">
                  Sin productos todavía. Crea el primero o corre el seed
                  (supabase/seed.sql).
                </td>
              </tr>
            )}
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-white/[0.03]">
                <td className="px-5 py-3.5">
                  <p className="font-semibold">{product.title}</p>
                  <p className="text-xs text-ml-white/45">/{product.handle}</p>
                </td>
                <td className="px-5 py-3.5 text-ml-white/70">
                  {product.categories?.title ?? "—"}
                </td>
                <td className="px-5 py-3.5 font-semibold">
                  {formatPrice(product.base_price)}
                </td>
                <td className="px-5 py-3.5 text-ml-white/70">
                  {product.product_variants?.length ?? 0}
                </td>
                <td className="px-5 py-3.5">
                  <StatusBadge status={product.status} />
                </td>
                <td className="px-5 py-3.5 text-ml-white/70">
                  {product.is_customizable ? "Sí" : "No"}
                </td>
                <td className="px-5 py-3.5 text-right">
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

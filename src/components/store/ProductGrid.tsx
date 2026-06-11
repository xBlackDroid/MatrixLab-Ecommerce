import type { ProductRow } from "@/lib/db/types";
import ProductCard from "@/components/store/ProductCard";

export default function ProductGrid({
  products,
  emptyMessage = "Aún no hay productos en esta categoría. Pregúntanos por WhatsApp: seguro podemos crearlo.",
}: {
  products: ProductRow[];
  emptyMessage?: string;
}) {
  if (products.length === 0) {
    return (
      <div className="glass rounded-2xl p-10 text-center text-ml-white/60">
        {emptyMessage}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

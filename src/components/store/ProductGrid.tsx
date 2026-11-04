import type { ProductRow } from "@/lib/db/types";
import ProductCard from "@/components/store/ProductCard";
import EmptyState from "@/components/ui/EmptyState";
import { buildWhatsAppUrl, whatsappMessages } from "@/lib/whatsapp";

export default function ProductGrid({
  products,
  brandContext,
  emptyMessage = "Aún no hay productos en esta categoría. Pregúntanos por WhatsApp: seguro podemos crearlo.",
}: {
  products: ProductRow[];
  brandContext?: string;
  emptyMessage?: string;
}) {
  if (products.length === 0) {
    return (
      <EmptyState
        title="Aún no hay productos"
        action={
          <a
            href={buildWhatsAppUrl(whatsappMessages.customRequest())}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-ui-control-border px-4 py-2 text-sm font-semibold text-ui-accent transition-colors hover:bg-ui-surface-raised"
          >
            Consultar por WhatsApp
          </a>
        }
      >
        {emptyMessage}
      </EmptyState>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} brandContext={brandContext} />
      ))}
    </div>
  );
}

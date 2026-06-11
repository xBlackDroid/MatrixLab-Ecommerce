import Image from "next/image";
import Link from "next/link";
import type { ProductRow } from "@/lib/db/types";
import { formatPrice } from "@/lib/utils";
import InventoryBadge, {
  CustomizableBadge,
} from "@/components/store/InventoryBadge";
import ProductImagePlaceholder from "@/components/store/ProductImagePlaceholder";

export default function ProductCard({ product }: { product: ProductRow }) {
  const image = Array.isArray(product.images) ? product.images[0] : null;

  return (
    <Link
      href={`/tienda/producto/${product.handle}`}
      className="group glass flex flex-col overflow-hidden rounded-2xl transition hover:-translate-y-1 hover:border-ml-violet/40 hover:shadow-glow-violet"
    >
      <div className="relative aspect-square w-full overflow-hidden">
        {image ? (
          <Image
            src={image}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <ProductImagePlaceholder title={product.title} />
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <InventoryBadge status={product.status} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-semibold leading-snug text-ml-white group-hover:text-ml-violet">
          {product.title}
        </h3>
        <div className="mt-auto flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-ml-white">
              {formatPrice(product.base_price)}
            </span>
            {product.compare_at_price &&
              Number(product.compare_at_price) > Number(product.base_price) && (
                <span className="text-sm text-ml-white/40 line-through">
                  {formatPrice(product.compare_at_price)}
                </span>
              )}
          </div>
          {product.is_customizable && <CustomizableBadge />}
        </div>
      </div>
    </Link>
  );
}

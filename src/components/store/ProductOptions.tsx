"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Clock, MessageCircle, Minus, Plus, Wand2 } from "lucide-react";
import type {
  DesignerProductType,
  ProductVariantRow,
  ProductWithVariants,
} from "@/lib/db/types";
import { cn, formatPrice } from "@/lib/utils";
import { buildWhatsAppUrl, whatsappMessages } from "@/lib/whatsapp";
import AddToCartButton from "@/components/store/AddToCartButton";
import InventoryBadge, {
  CustomizableBadge,
  VolumeBadge,
} from "@/components/store/InventoryBadge";

interface ProductOptionsProps {
  product: ProductWithVariants;
  /** Tipo de diseñador si este producto se personaliza en el laboratorio. */
  designerType: DesignerProductType | null;
}

/** Selección de variantes + cantidad + acciones de compra. */
export default function ProductOptions({
  product,
  designerType,
}: ProductOptionsProps) {
  const variants = product.variants;
  const hasColorSize = variants.some((v) => v.color || v.size);
  const colors = useMemo(
    () => [...new Set(variants.map((v) => v.color).filter(Boolean))] as string[],
    [variants],
  );
  const sizes = useMemo(
    () => [...new Set(variants.map((v) => v.size).filter(Boolean))] as string[],
    [variants],
  );

  const [selectedColor, setSelectedColor] = useState<string | null>(
    colors[0] ?? null,
  );
  const [selectedSize, setSelectedSize] = useState<string | null>(
    sizes[0] ?? null,
  );
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    !hasColorSize && variants.length > 0 ? variants[0]!.id : null,
  );
  const [quantity, setQuantity] = useState(product.min_quantity);

  const selectedVariant: ProductVariantRow | null = useMemo(() => {
    if (variants.length === 0) return null;
    if (!hasColorSize) {
      return variants.find((v) => v.id === selectedVariantId) ?? null;
    }
    return (
      variants.find(
        (v) =>
          (colors.length === 0 || v.color === selectedColor) &&
          (sizes.length === 0 || v.size === selectedSize),
      ) ?? null
    );
  }, [variants, hasColorSize, selectedVariantId, selectedColor, selectedSize, colors.length, sizes.length]);

  const unitPrice =
    selectedVariant?.price !== null && selectedVariant?.price !== undefined
      ? Number(selectedVariant.price)
      : Number(product.base_price);

  const productSellable = ["disponible", "sobre_pedido"].includes(
    product.status,
  );
  const variantBlocked =
    selectedVariant !== null &&
    ["agotado", "oculto"].includes(selectedVariant.status);
  const onDemand =
    product.status === "sobre_pedido" ||
    selectedVariant?.status === "sobre_pedido";
  const stockLimited =
    !onDemand && selectedVariant !== null && product.status === "disponible";
  const maxByStock = stockLimited
    ? Math.max(0, selectedVariant.stock)
    : product.max_quantity;
  const maxQuantity = Math.min(product.max_quantity, maxByStock || 0);
  const needsVariant = variants.length > 0 && selectedVariant === null;
  const isOutOfStock =
    product.status === "agotado" ||
    variantBlocked ||
    (stockLimited && selectedVariant.stock <= 0);
  const canBuy =
    productSellable && !isOutOfStock && !needsVariant && quantity >= 1;

  function step(delta: number) {
    setQuantity((current) => {
      const next = current + delta;
      const upper = Math.max(product.min_quantity, maxQuantity || product.max_quantity);
      return Math.min(Math.max(next, product.min_quantity), upper);
    });
  }

  const effectiveStatus = variantBlocked
    ? selectedVariant.status
    : onDemand && product.status !== "agotado"
      ? "sobre_pedido"
      : product.status;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <InventoryBadge status={effectiveStatus} />
        {product.is_customizable && <CustomizableBadge />}
        {product.max_quantity >= 100 && <VolumeBadge />}
      </div>

      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold">{formatPrice(unitPrice)}</span>
        {product.compare_at_price &&
          Number(product.compare_at_price) > unitPrice && (
            <span className="text-lg text-ml-white/40 line-through">
              {formatPrice(product.compare_at_price)}
            </span>
          )}
        <span className="text-sm text-ml-white/50">MXN</span>
      </div>

      {colors.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-ml-white/70">Color</p>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setSelectedColor(color)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm transition",
                  selectedColor === color
                    ? "border-ml-violet bg-ml-violet/15 text-ml-violet"
                    : "border-white/15 bg-white/5 text-ml-white/75 hover:border-white/30",
                )}
              >
                {color}
              </button>
            ))}
          </div>
        </div>
      )}

      {sizes.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-ml-white/70">Talla</p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setSelectedSize(size)}
                className={cn(
                  "min-w-12 rounded-full border px-4 py-2 text-sm transition",
                  selectedSize === size
                    ? "border-ml-violet bg-ml-violet/15 text-ml-violet"
                    : "border-white/15 bg-white/5 text-ml-white/75 hover:border-white/30",
                )}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {!hasColorSize && variants.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-ml-white/70">Opciones</p>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => (
              <button
                key={variant.id}
                type="button"
                onClick={() => setSelectedVariantId(variant.id)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm transition",
                  selectedVariantId === variant.id
                    ? "border-ml-violet bg-ml-violet/15 text-ml-violet"
                    : "border-white/15 bg-white/5 text-ml-white/75 hover:border-white/30",
                  variant.status === "agotado" && "opacity-45",
                )}
              >
                {variant.option_label ?? variant.title}
                {variant.price !== null &&
                  Number(variant.price) !== Number(product.base_price) &&
                  ` · ${formatPrice(variant.price)}`}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <p className="text-sm font-medium text-ml-white/70">Cantidad</p>
        <div className="glass flex items-center rounded-full">
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Disminuir cantidad"
            className="flex h-11 w-11 items-center justify-center rounded-l-full text-ml-white/70 transition hover:text-ml-violet"
          >
            <Minus className="h-4 w-4" aria-hidden />
          </button>
          <span className="min-w-10 text-center font-semibold">{quantity}</span>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Aumentar cantidad"
            className="flex h-11 w-11 items-center justify-center rounded-r-full text-ml-white/70 transition hover:text-ml-violet"
          >
            <Plus className="h-4 w-4" aria-hidden />
          </button>
        </div>
        {stockLimited && selectedVariant.stock > 0 && (
          <span className="text-xs text-ml-white/50">
            {selectedVariant.stock} disponibles
          </span>
        )}
      </div>

      {onDemand && !isOutOfStock && (
        <p className="glass rounded-xl px-4 py-3 text-sm text-ml-violet">
          Este producto se prepara sobre pedido.
        </p>
      )}

      {product.production_time && (
        <p className="flex items-center gap-2 text-sm text-ml-white/60">
          <Clock className="h-4 w-4 text-ml-cyan" aria-hidden />
          Tiempo estimado de producción: {product.production_time}
        </p>
      )}

      <div className="flex flex-col gap-3">
        {isOutOfStock ? (
          <>
            <AddToCartButton
              productId={product.id}
              variantId={selectedVariant?.id}
              quantity={quantity}
              disabled
              label="Agotado"
            />
            <a
              href={buildWhatsAppUrl(whatsappMessages.outOfStock(product.title))}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-ml-coral/40 bg-ml-coral/10 px-6 py-3.5 font-semibold text-ml-coral transition hover:bg-ml-coral/20"
            >
              <MessageCircle className="h-5 w-5" aria-hidden />
              Preguntar disponibilidad por WhatsApp
            </a>
          </>
        ) : (
          <AddToCartButton
            productId={product.id}
            variantId={selectedVariant?.id}
            quantity={quantity}
            disabled={!canBuy}
          />
        )}

        {product.is_customizable && designerType && (
          <Link
            href={`/tienda/disenador/${designerType}`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-ml-cyan/40 bg-ml-cyan/10 px-6 py-3.5 font-semibold text-ml-cyan transition hover:bg-ml-cyan/20"
          >
            <Wand2 className="h-5 w-5" aria-hidden />
            Personalizar en el laboratorio
          </Link>
        )}
        {product.is_customizable && !designerType && !isOutOfStock && (
          <a
            href={buildWhatsAppUrl(whatsappMessages.customizeProduct(product.title))}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-ml-cyan/40 bg-ml-cyan/10 px-6 py-3.5 font-semibold text-ml-cyan transition hover:bg-ml-cyan/20"
          >
            <Wand2 className="h-5 w-5" aria-hidden />
            Personalizar este producto
          </a>
        )}

        <a
          href={buildWhatsAppUrl(whatsappMessages.product(product.title))}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3.5 font-semibold text-ml-white/85 transition hover:border-white/30"
        >
          <MessageCircle className="h-5 w-5" aria-hidden />
          Pregúntanos por WhatsApp
        </a>
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Clock, MessageCircle, Minus, Plus } from "lucide-react";
import type { ProductVariantRow, ProductWithVariants } from "@/lib/db/types";
import { cn, formatPrice } from "@/lib/utils";
import { buildWhatsAppUrl, whatsappMessages } from "@/lib/whatsapp";
import {
  DEFAULT_READY_WEAR_COLOR,
  READY_WEAR_COLORS,
  readyWearColorImage,
  readyWearColorImages,
  readyWearColorSlug,
  type ReadyWearColor,
} from "@/lib/store/ready-wear-colors";
import AddToCartButton from "@/components/store/AddToCartButton";
import InventoryBadge, {
  CustomizableBadge,
  VolumeBadge,
} from "@/components/store/InventoryBadge";
import ProductImagePlaceholder from "@/components/store/ProductImagePlaceholder";

const CUTS = ["Hombre", "Mujer"] as const;
const SIZES = ["Chica", "Mediana", "Grande"] as const;
type Cut = (typeof CUTS)[number];
type Size = (typeof SIZES)[number];

const same = (a: string | null, b: string) =>
  (a ?? "").trim().toLowerCase() === b.toLowerCase();

function findVariant(
  variants: ProductVariantRow[],
  color: ReadyWearColor,
  size: Size,
  cut: Cut,
): ProductVariantRow | null {
  return (
    variants.find(
      (v) =>
        v.status !== "oculto" &&
        same(v.color, color) &&
        same(v.size, size) &&
        same(v.option_label, cut),
    ) ?? null
  );
}

interface ReadyWearProductProps {
  product: ProductWithVariants;
  /**
   * Color leído en servidor de `?color=`; así el HTML del servidor y la
   * hidratación arrancan con la misma foto.
   */
  initialColor?: ReadyWearColor | null;
}

/** Ficha de playera lista: galería por color + color/corte/talla + compra. */
export default function ReadyWearProduct({
  product,
  initialColor,
}: ReadyWearProductProps) {
  const variants = product.variants;
  const [color, setColor] = useState<ReadyWearColor>(
    initialColor ?? DEFAULT_READY_WEAR_COLOR,
  );
  const [cut, setCut] = useState<Cut>("Hombre");
  const [size, setSize] = useState<Size>("Mediana");
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(product.min_quantity);

  const images = useMemo(
    () => readyWearColorImages(product.handle, color),
    [product.handle, color],
  );
  const shownImage = images[Math.min(activeImage, images.length - 1)];

  const selectedVariant = useMemo(
    () => findVariant(variants, color, size, cut),
    [variants, color, size, cut],
  );

  const unitPrice =
    selectedVariant?.price !== null && selectedVariant?.price !== undefined
      ? Number(selectedVariant.price)
      : Number(product.base_price);

  // Mismas reglas que checkAvailability en servidor.
  const productSellable = ["disponible", "sobre_pedido"].includes(
    product.status,
  );
  const variantBlocked =
    selectedVariant !== null &&
    ["agotado", "oculto"].includes(selectedVariant.status);
  const onDemand =
    product.status === "sobre_pedido" ||
    selectedVariant?.status === "sobre_pedido";
  const stock = selectedVariant ? Math.max(0, selectedVariant.stock) : 0;
  const maxQuantity = onDemand
    ? product.max_quantity
    : Math.min(product.max_quantity, stock);
  const isOutOfStock =
    product.status === "agotado" ||
    variantBlocked ||
    (!onDemand && selectedVariant !== null && stock <= 0);
  const missingVariant = selectedVariant === null;
  const blocked = missingVariant || isOutOfStock;
  // Cantidad efectiva siempre dentro de [mínimo, máximo] para la variante.
  const effectiveQuantity = Math.min(
    Math.max(quantity, product.min_quantity),
    Math.max(product.min_quantity, maxQuantity),
  );
  const canBuy =
    productSellable &&
    !blocked &&
    maxQuantity >= product.min_quantity &&
    effectiveQuantity >= 1;

  const effectiveStatus = missingVariant || isOutOfStock
    ? "agotado"
    : onDemand && product.status !== "agotado"
      ? "sobre_pedido"
      : product.status;

  function selectColor(next: ReadyWearColor) {
    setColor(next);
    setActiveImage(0);
    // Actualiza ?color= sin navegar ni mover el scroll.
    const url = new URL(window.location.href);
    url.searchParams.set("color", readyWearColorSlug(next));
    window.history.replaceState(null, "", url.toString());
  }

  function step(delta: number) {
    const upper = Math.max(product.min_quantity, maxQuantity);
    setQuantity(
      Math.min(Math.max(effectiveQuantity + delta, product.min_quantity), upper),
    );
  }

  function sizeUnavailable(option: Size): boolean {
    const v = findVariant(variants, color, option, cut);
    if (!v || ["agotado", "oculto"].includes(v.status)) return true;
    const vOnDemand =
      product.status === "sobre_pedido" || v.status === "sobre_pedido";
    return !vOnDemand && v.stock <= 0;
  }

  const choiceLabel = `${cut} / ${size} / ${color}`;
  const whatsappText = `${whatsappMessages.product(product.title)} — ${choiceLabel}`;

  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-2">
      <div className="flex min-w-0 flex-col gap-3">
        <div className="glass relative aspect-square w-full overflow-hidden rounded-2xl">
          {shownImage ? (
            <Image
              key={shownImage}
              src={shownImage}
              alt={`${product.title} — playera color ${color}${
                images.length > 1
                  ? `, foto ${Math.min(activeImage, images.length - 1) + 1} de ${images.length}`
                  : ""
              }`}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          ) : (
            <ProductImagePlaceholder
              title={product.title}
              iconClassName="h-24 w-24"
            />
          )}
        </div>

        {images.length > 1 && (
          <div
            className="flex gap-2 overflow-x-auto pb-1"
            role="group"
            aria-label={`Fotos de la playera ${color}`}
          >
            {images.map((image, index) => (
              <button
                key={image}
                type="button"
                onClick={() => setActiveImage(index)}
                aria-label={`Ver foto ${index + 1} de la playera ${color}`}
                aria-pressed={index === activeImage}
                className={cn(
                  "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border transition",
                  index === activeImage
                    ? "border-ml-violet"
                    : "border-white/10 opacity-60 hover:opacity-100",
                )}
              >
                <Image
                  src={image}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="min-w-0">
        <h1 className="text-3xl font-bold sm:text-4xl">{product.title}</h1>
        <div className="mt-6 flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-2">
            <InventoryBadge status={effectiveStatus} />
            {product.is_customizable && <CustomizableBadge />}
            {product.max_quantity >= 100 && <VolumeBadge />}
          </div>

          <div className="flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-bold">{formatPrice(unitPrice)}</span>
            {product.compare_at_price &&
              Number(product.compare_at_price) > unitPrice && (
                <span className="text-lg text-ml-white/40 line-through">
                  {formatPrice(product.compare_at_price)}
                </span>
              )}
            <span className="text-sm text-ml-white/50">MXN</span>
          </div>

          <fieldset>
            <legend className="mb-3 text-sm font-medium text-ml-white/70">
              Color: <span className="text-ml-white">{color}</span>
            </legend>
            <div className="flex flex-wrap gap-4">
              {READY_WEAR_COLORS.map(({ label, slug }) => {
                const thumb = readyWearColorImage(product.handle, label);
                const checked = color === label;
                return (
                  <label
                    key={slug}
                    className="flex cursor-pointer flex-col items-center gap-1.5"
                  >
                    <input
                      type="radio"
                      name={`color-${product.id}`}
                      value={slug}
                      checked={checked}
                      onChange={() => selectColor(label)}
                      aria-label={`Color ${label}`}
                      className="peer sr-only"
                    />
                    <span
                      className={cn(
                        "relative block h-14 w-14 overflow-hidden rounded-full border-2 bg-white/5 ring-offset-2 ring-offset-ml-bg transition peer-focus-visible:ring-2 peer-focus-visible:ring-ml-cyan",
                        checked
                          ? "border-ml-violet ring-2 ring-ml-violet"
                          : "border-white/15 hover:border-white/40",
                      )}
                    >
                      {thumb && (
                        <Image
                          src={thumb}
                          alt=""
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      )}
                    </span>
                    <span
                      aria-hidden
                      className={cn(
                        "text-xs",
                        checked ? "font-semibold text-ml-violet" : "text-ml-white/70",
                      )}
                    >
                      {label}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <OptionGroup
            legend="Corte"
            name={`corte-${product.id}`}
            options={CUTS}
            value={cut}
            onChange={setCut}
          />

          <OptionGroup
            legend="Talla"
            name={`talla-${product.id}`}
            options={SIZES}
            value={size}
            onChange={setSize}
            isUnavailable={sizeUnavailable}
          />

          <div className="flex flex-wrap items-center gap-4">
            <p id={`cantidad-${product.id}`} className="text-sm font-medium text-ml-white/70">
              Cantidad
            </p>
            <div
              className="glass flex items-center rounded-full"
              role="group"
              aria-labelledby={`cantidad-${product.id}`}
            >
              <button
                type="button"
                onClick={() => step(-1)}
                disabled={blocked || effectiveQuantity <= product.min_quantity}
                aria-label="Disminuir cantidad"
                className="flex h-11 w-11 items-center justify-center rounded-l-full text-ml-white/70 transition hover:text-ml-violet disabled:opacity-40"
              >
                <Minus className="h-4 w-4" aria-hidden />
              </button>
              <span className="min-w-10 text-center font-semibold" aria-live="polite">
                {effectiveQuantity}
              </span>
              <button
                type="button"
                onClick={() => step(1)}
                disabled={blocked || effectiveQuantity >= maxQuantity}
                aria-label="Aumentar cantidad"
                className="flex h-11 w-11 items-center justify-center rounded-r-full text-ml-white/70 transition hover:text-ml-violet disabled:opacity-40"
              >
                <Plus className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <span className="text-xs text-ml-white/50" aria-live="polite">
              {missingVariant
                ? "Combinación no disponible"
                : isOutOfStock
                  ? "Agotado"
                  : onDemand
                    ? "Sobre pedido"
                    : `${stock} disponibles`}
            </span>
          </div>

          {onDemand && !blocked && (
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
            <AddToCartButton
              productId={product.id}
              variantId={selectedVariant?.id}
              quantity={effectiveQuantity}
              disabled={!canBuy}
              label={
                missingVariant
                  ? "Combinación no disponible"
                  : isOutOfStock
                    ? "Agotado"
                    : undefined
              }
            />
            <a
              href={buildWhatsAppUrl(whatsappText)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Preguntar por WhatsApp por ${product.title}, ${choiceLabel}`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3.5 text-center font-semibold text-ml-white/85 transition hover:border-white/30"
            >
              <MessageCircle className="h-5 w-5 shrink-0" aria-hidden />
              Pregúntanos por WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function OptionGroup<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
  isUnavailable,
}: {
  legend: string;
  name: string;
  options: readonly T[];
  value: T;
  onChange: (next: T) => void;
  isUnavailable?: (option: T) => boolean;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-ml-white/70">
        {legend}: <span className="text-ml-white">{value}</span>
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const checked = option === value;
          const unavailable = isUnavailable?.(option) ?? false;
          return (
            <label key={option} className="cursor-pointer">
              <input
                type="radio"
                name={name}
                value={option}
                checked={checked}
                onChange={() => onChange(option)}
                aria-label={unavailable ? `${option} (agotado)` : option}
                className="peer sr-only"
              />
              <span
                className={cn(
                  "inline-flex min-h-11 min-w-12 items-center justify-center rounded-full border px-4 py-2 text-sm transition peer-focus-visible:ring-2 peer-focus-visible:ring-ml-cyan",
                  checked
                    ? "border-ml-violet bg-ml-violet/15 text-ml-violet"
                    : "border-white/15 bg-white/5 text-ml-white/75 hover:border-white/30",
                  unavailable && "line-through opacity-45",
                )}
              >
                {option}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

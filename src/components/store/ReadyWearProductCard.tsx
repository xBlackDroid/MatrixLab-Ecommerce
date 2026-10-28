"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ProductRow } from "@/lib/db/types";
import { cn, formatPrice } from "@/lib/utils";
import {
  DEFAULT_READY_WEAR_COLOR,
  getDefaultReadyWearColor,
  getReadyWearColors,
  readyWearColorImage,
  readyWearProductHref,
  type ReadyWearColor,
} from "@/lib/store/ready-wear-colors";
import InventoryBadge, {
  CustomizableBadge,
} from "@/components/store/InventoryBadge";
import ProductImagePlaceholder from "@/components/store/ProductImagePlaceholder";

/** Más colores que esto ya no caben en una fila de muestras de 44 px. */
const SINGLE_ROW_COLORS = 4;

/**
 * Tarjeta de prenda lista (playera o sudadera). Igual que ProductCard, con
 * selector de color debajo de la foto. Los botones quedan FUERA de los
 * enlaces (foto y título son enlaces hermanos) para no anidar elementos
 * interactivos.
 */
export default function ReadyWearProductCard({
  product,
}: {
  product: ProductRow;
}) {
  const colors = getReadyWearColors(product.handle);
  const [color, setColor] = useState<ReadyWearColor>(
    getDefaultReadyWearColor(product.handle) ?? DEFAULT_READY_WEAR_COLOR,
  );
  const image =
    readyWearColorImage(product.handle, color) ??
    (Array.isArray(product.images) ? product.images[0] : null);
  const href = readyWearProductHref(product.handle, color);
  // Playeras: 3 muestras de 44 px en una fila, como siempre. Sudaderas: 9 en
  // una rejilla de 5 columnas (5 + 4) que escala de 24 a 44 px con la
  // tarjeta, sin desbordar ni a 320 px.
  const grid = colors.length > SINGLE_ROW_COLORS;

  return (
    <div className="group glass flex flex-col overflow-hidden rounded-2xl transition hover:-translate-y-1 hover:border-ml-violet/40 hover:shadow-glow-violet">
      <Link
        href={href}
        tabIndex={-1}
        aria-hidden
        className="relative block aspect-square w-full overflow-hidden"
      >
        {image ? (
          <Image
            key={image}
            src={image}
            alt=""
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
      </Link>

      <div
        className={cn(
          "px-2 pt-2",
          grid
            ? "grid grid-cols-3 justify-items-center gap-y-1 sm:grid-cols-4 xl:grid-cols-5"
            : "flex flex-wrap justify-center gap-1",
        )}
        role="group"
        aria-label={`Color de ${product.title}`}
      >
        {colors.map(({ label, slug }) => {
          const thumb = readyWearColorImage(product.handle, label);
          const selected = color === label;
          return (
            <button
              key={slug}
              type="button"
              onClick={() => setColor(label)}
              aria-pressed={selected}
              aria-label={`Ver ${product.title} en color ${label}`}
              title={label}
              className={cn(
                "flex items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ml-cyan",
                grid ? "aspect-square w-full max-w-11" : "h-11 w-11",
              )}
            >
              <span
                className={cn(
                  "relative block overflow-hidden rounded-full border-2 bg-white/5 transition",
                  grid ? "aspect-square w-[78%]" : "h-8 w-8",
                  selected
                    ? "border-ml-violet ring-2 ring-ml-violet/60"
                    : "border-white/20 hover:border-white/50",
                )}
              >
                {thumb && (
                  <Image
                    src={thumb}
                    alt=""
                    fill
                    sizes="32px"
                    className="object-cover"
                  />
                )}
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-center text-xs text-ml-white/60">Color: {color}</p>
      <Link
        href={href}
        className="flex flex-1 flex-col gap-2 p-4 pt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ml-violet"
      >
        <h3 className="font-semibold leading-snug text-ml-white group-hover:text-ml-violet">
          {product.title}
          <span className="sr-only">, color {color}</span>
        </h3>
        <div className="mt-auto flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-ml-white">
              {product.tags.includes("precio-cotizacion") ? "Por cotización" : formatPrice(product.base_price)}
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
      </Link>
    </div>
  );
}

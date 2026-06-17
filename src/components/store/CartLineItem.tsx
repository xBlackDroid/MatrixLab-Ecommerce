"use client";

import Image from "next/image";
import Link from "next/link";
import { Loader2, Minus, Plus, Trash2, Wand2 } from "lucide-react";
import type { CartLineView } from "@/lib/db/types";
import { cn, formatPrice } from "@/lib/utils";
import ProductImagePlaceholder from "@/components/store/ProductImagePlaceholder";

interface CartLineItemProps {
  line: CartLineView;
  busy: boolean;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
}

export default function CartLineItem({
  line,
  busy,
  onUpdateQuantity,
  onRemove,
}: CartLineItemProps) {
  const image = line.designPreviewUrl ?? line.image;
  const displayTitle = line.customTitle ?? line.title;

  return (
    <div className="glass flex gap-4 rounded-2xl p-4">
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-white/10">
        {image ? (
          <Image
            src={image}
            alt={displayTitle}
            fill
            sizes="96px"
            unoptimized={Boolean(line.designPreviewUrl)}
            className="object-cover"
          />
        ) : (
          <ProductImagePlaceholder title={line.title} iconClassName="h-8 w-8" />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/tienda/producto/${line.productHandle}`}
              className="block truncate font-semibold hover:text-ml-violet"
            >
              {displayTitle}
            </Link>
            {line.variantTitle && (
              <p className="text-sm text-ml-white/55">{line.variantTitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onRemove(line.id)}
            disabled={busy}
            aria-label="Eliminar del carrito"
            className="text-ml-white/40 transition hover:text-ml-coral disabled:opacity-40"
          >
            <Trash2 className="h-4.5 w-4.5" aria-hidden />
          </button>
        </div>

        {line.isCustom && (
          <p className="flex items-center gap-1.5 text-xs text-ml-cyan">
            <Wand2 className="h-3.5 w-3.5" aria-hidden />
            Tu diseño fue guardado correctamente y se enviará junto con el
            pedido.
          </p>
        )}

        {line.availability !== "ok" && (
          <p className="text-xs text-ml-coral">
            {line.availability === "stock_insuficiente"
              ? "Quedan menos piezas disponibles. Ajusta la cantidad."
              : "Este producto ya no está disponible. Elimínalo para continuar."}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 pt-1">
          <div
            className={cn(
              "flex items-center rounded-full border border-white/10 bg-white/5",
              busy && "opacity-60",
            )}
          >
            <button
              type="button"
              onClick={() => onUpdateQuantity(line.id, line.quantity - 1)}
              disabled={busy || line.quantity <= line.minQuantity}
              aria-label="Disminuir cantidad"
              className="flex h-9 w-9 items-center justify-center text-ml-white/70 transition hover:text-ml-violet disabled:opacity-40"
            >
              <Minus className="h-3.5 w-3.5" aria-hidden />
            </button>
            <span className="min-w-8 text-center text-sm font-semibold">
              {busy ? (
                <Loader2 className="mx-auto h-3.5 w-3.5 animate-spin" aria-hidden />
              ) : (
                line.quantity
              )}
            </span>
            <button
              type="button"
              onClick={() => onUpdateQuantity(line.id, line.quantity + 1)}
              disabled={busy || line.quantity >= line.maxQuantity}
              aria-label="Aumentar cantidad"
              className="flex h-9 w-9 items-center justify-center text-ml-white/70 transition hover:text-ml-violet disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
          <div className="text-right">
            <p className="font-bold">{formatPrice(line.lineTotal)}</p>
            {line.quantity > 1 && (
              <p className="text-xs text-ml-white/45">
                {formatPrice(line.unitPrice)} c/u
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

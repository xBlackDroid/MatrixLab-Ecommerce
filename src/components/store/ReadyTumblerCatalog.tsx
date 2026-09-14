"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CupSoda, Minus, Plus, ShieldCheck, Truck } from "lucide-react";
import AddToCartButton from "@/components/store/AddToCartButton";
import ProductPhotoGallery from "./ProductPhotoGallery";
import { READY_TUMBLER_PLACEHOLDER, readyTumblerSku } from "@/lib/store/tumbler-ready";
import type { ReadyTumblerCatalogEntry } from "@/lib/store/products";
import { cn, formatPrice } from "@/lib/utils";

/**
 * Vitrina de vasos terminados. A diferencia del resto de MatrixLab Tumbler
 * —que vende insumos para crear— aquí la pieza ya está lista, así que la
 * tarjeta se comporta como cualquier producto comprable de la tienda: precio
 * y stock reales, selector de cantidad y "Agregar al carrito" contra
 * `/api/cart/items`. No hay WhatsApp ni cotización en estas tarjetas.
 */
export default function ReadyTumblerCatalog({
  items,
}: {
  items: readonly ReadyTumblerCatalogEntry[];
}) {
  const [collection, setCollection] = useState("");
  const collections = useMemo(
    () => [...new Set(items.map((entry) => entry.item.collection).filter(Boolean))],
    [items],
  );
  const visible = items.filter(
    (entry) => !collection || entry.item.collection === collection,
  );
  const availablePieces = items.reduce(
    (total, entry) => total + (entry.sellable ? Math.max(0, entry.stock) : 0),
    0,
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <Link
        href="/tienda/categoria/matrixlab-tumbler"
        className="inline-flex min-h-11 items-center gap-2 text-sm text-ml-white/65 transition hover:text-ml-cyan"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> MatrixLab Tumbler
      </Link>

      <header className="relative mt-5 overflow-hidden rounded-3xl border border-ml-coral/25 bg-linear-to-br from-ml-coral/15 via-ml-bg to-ml-violet/15 p-6 shadow-glow-coral sm:p-10">
        <CupSoda
          className="pointer-events-none absolute -bottom-10 -right-8 h-64 w-64 text-ml-coral/10"
          aria-hidden
        />
        <div className="relative max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ml-coral">
            MatrixLab Tumbler · Colección lista para llevar
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-5xl">
            Vasos listos
          </h1>
          <p className="mt-4 text-xl font-semibold text-ml-white sm:text-2xl">
            Elige tu favorito. Ya le pusimos la magia.
          </p>
          <p className="mt-3 max-w-xl leading-relaxed text-ml-white/70">
            Cada vaso está decorado a mano, fotografiado tal como te llega y
            listo para salir hoy mismo. Elige el diseño, define la cantidad y
            agrégalo al carrito: sin esperas de producción ni cotizaciones.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <HeaderChip icon={CupSoda}>
              {items.length} {items.length === 1 ? "diseño" : "diseños"}
            </HeaderChip>
            {availablePieces > 0 && (
              <HeaderChip icon={Truck}>
                {availablePieces} piezas listas para enviar
              </HeaderChip>
            )}
            <HeaderChip icon={ShieldCheck}>Pago seguro en la tienda</HeaderChip>
          </div>
        </div>
      </header>

      {items.length === 0 ? (
        <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8">
          <h2 className="text-xl font-bold">Se vienen tus próximos favoritos</h2>
          <p className="mt-3 max-w-2xl text-ml-white/65">
            Estamos preparando la colección. Vuelve pronto para descubrir los
            nuevos vasos listos.
          </p>
          <Link
            href="/tienda"
            className="mt-5 inline-flex min-h-12 items-center justify-center rounded-full bg-ml-cyan px-6 py-3 font-semibold text-ml-bg"
          >
            Ver la tienda
          </Link>
        </section>
      ) : (
        <>
          {collections.length > 1 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {["", ...collections].map((name) => (
                <button
                  key={name}
                  type="button"
                  aria-pressed={collection === name}
                  onClick={() => setCollection(name)}
                  className={cn(
                    "min-h-11 rounded-full border px-4 text-sm font-semibold transition",
                    collection === name
                      ? "border-ml-cyan/60 bg-ml-cyan/15 text-ml-cyan"
                      : "border-white/15 text-ml-white/65 hover:border-white/30 hover:text-ml-white",
                  )}
                >
                  {name || "Todos"}
                </button>
              ))}
            </div>
          )}

          <p className="mt-6 text-sm text-ml-white/60" aria-live="polite">
            {visible.length} de {items.length} diseños
          </p>

          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {visible.map((entry) => (
              <ReadyTumblerCard key={entry.item.code} entry={entry} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function HeaderChip({
  icon: Icon,
  children,
}: {
  icon: typeof CupSoda;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3.5 py-2 text-xs font-semibold text-ml-white/75">
      <Icon className="h-4 w-4 text-ml-coral" aria-hidden />
      {children}
    </span>
  );
}

/**
 * Tarjeta de un vaso listo. Jerarquía: galería → colección → nombre →
 * descripción → precio → stock → SKU discreto → cantidad → CTA.
 *
 * El selector de cantidad se renderiza siempre (deshabilitado si está
 * agotado) para que todas las tarjetas de una fila midan lo mismo.
 */
function ReadyTumblerCard({ entry }: { entry: ReadyTumblerCatalogEntry }) {
  const maxQuantity = Math.max(0, entry.stock);
  const [quantity, setQuantity] = useState(1);
  // Sin producto y variante reales no hay compra posible: el servidor valida
  // precio y stock, así que el cliente nunca inventa ids.
  const purchaseConfigured = Boolean(entry.productId && entry.variantId);
  const soldOut = !entry.sellable || maxQuantity <= 0;
  const purchaseDisabled = soldOut || !purchaseConfigured;

  function step(delta: number) {
    setQuantity((current) =>
      Math.min(Math.max(current + delta, 1), Math.max(1, maxQuantity)),
    );
  }

  return (
    <article
      className={cn(
        "glass flex flex-col overflow-hidden rounded-2xl border border-white/10 transition",
        purchaseDisabled
          ? "hover:border-white/20"
          : "hover:border-ml-coral/45 hover:shadow-glow-coral",
      )}
    >
      <div className="relative">
        <ProductPhotoGallery
          images={entry.imagePaths}
          title={entry.title}
          placeholder={READY_TUMBLER_PLACEHOLDER}
          aspectClass="aspect-[4/5]"
          variant="overlay"
          sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
        />
        {purchaseConfigured && soldOut && (
          <span className="absolute left-3 top-3 rounded-full bg-ml-bg/85 px-3 py-1 text-xs font-semibold text-ml-white/80">
            Agotado
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ml-coral">
          {entry.item.collection || "Vasos listos"}
        </p>

        <h2 className="text-lg font-bold leading-snug text-ml-white">
          {entry.title}
        </h2>

        <p className="line-clamp-3 text-sm leading-relaxed text-ml-white/65">
          {entry.item.description}
        </p>

        {(entry.item.capacity || entry.item.finish) && (
          <p className="text-sm text-ml-white/55">
            {[entry.item.capacity, entry.item.finish].filter(Boolean).join(" · ")}
          </p>
        )}

        <p className="mt-1 text-2xl font-bold text-ml-white">
          {entry.price === null ? (
            <span className="text-base font-semibold text-ml-white/70">
              Precio por confirmar
            </span>
          ) : (
            <>
              {formatPrice(entry.price)}{" "}
              <span className="text-sm font-medium text-ml-white/50">
                MXN / pieza
              </span>
            </>
          )}
        </p>

        <p
          className={cn(
            "text-sm font-semibold",
            purchaseDisabled ? "text-ml-white/50" : "text-ml-cyan",
          )}
        >
          {!purchaseConfigured
            ? "Disponible muy pronto"
            : soldOut
              ? "Agotado por ahora"
              : `Disponible: ${maxQuantity}`}
        </p>

        <p className="text-xs text-ml-white/40">
          Ref. {entry.item.code} · {entry.sku || readyTumblerSku(entry.item.code)}
        </p>

        <div className="mt-auto flex flex-col gap-2.5 pt-3">
          <div className="flex items-center justify-between gap-2 rounded-full border border-white/10 bg-white/5 p-1">
            <button
              type="button"
              onClick={() => step(-1)}
              disabled={purchaseDisabled || quantity <= 1}
              aria-label="Quitar una unidad"
              className="flex h-11 w-11 items-center justify-center rounded-full text-ml-white/80 transition hover:bg-white/10 disabled:opacity-30"
            >
              <Minus className="h-4 w-4" aria-hidden />
            </button>
            <span className="min-w-8 text-center text-base font-semibold">
              {quantity}
            </span>
            <button
              type="button"
              // Nunca se puede pedir más que el inventario real; el servidor
              // vuelve a validar stock y precio al agregar al carrito.
              onClick={() => step(1)}
              disabled={purchaseDisabled || quantity >= maxQuantity}
              aria-label="Agregar una unidad"
              className="flex h-11 w-11 items-center justify-center rounded-full text-ml-white/80 transition hover:bg-white/10 disabled:opacity-30"
            >
              <Plus className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <AddToCartButton
            productId={entry.productId ?? ""}
            variantId={entry.variantId}
            quantity={quantity}
            disabled={purchaseDisabled}
            label={
              !purchaseConfigured
                ? "Disponible muy pronto"
                : soldOut
                  ? "Agotado"
                  : "Agregar al carrito"
            }
          />
        </div>
      </div>
    </article>
  );
}

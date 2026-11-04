"use client";

import CollapsibleCatalogFilters from "./CollapsibleCatalogFilters";
import ProductDescription from "./ProductDescription";

import useUrlState from "@/lib/ui/useUrlState";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, CupSoda, Minus, Plus, ShieldCheck, Truck, X } from "lucide-react";
import AddToCartButton from "@/components/store/AddToCartButton";
import ProductPhotoGallery from "./ProductPhotoGallery";
import { READY_TUMBLER_PLACEHOLDER, readyTumblerSku } from "@/lib/store/tumbler-ready";
import type { ReadyTumblerCatalogEntry } from "@/lib/store/products";
import { cn, formatPrice } from "@/lib/utils";
import TumblerSubcategoryNav from "./TumblerSubcategoryNav";
import styles from "./TumblerCatalog.module.css";

/**
 * Vitrina de vasos terminados. A diferencia del resto de MatrixLab Tumbler
 * —que vende insumos para crear— aquí la pieza ya está lista, así que la
 * tarjeta se comporta como cualquier producto comprable de la tienda: precio
 * y stock reales, selector de cantidad y "Agregar al carrito" contra
 * `/api/cart/items`. No hay WhatsApp ni cotización en estas tarjetas.
 */
export default function ReadyTumblerCatalog({
  items,
  embedded = false,
}: {
  items: readonly ReadyTumblerCatalogEntry[];
  embedded?: boolean;
}) {
  const [collection, setCollection] = useUrlState<string>("coleccion", "");
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
    <div className={embedded ? "min-w-0" : "mobile-catalog-page mx-auto max-w-7xl px-4 py-12 sm:px-6"}>
      {!embedded && <>
      <Link
        href="/tienda/categoria/matrixlab-tumbler"
        className="inline-flex min-h-11 items-center gap-2 text-sm text-ml-white/65 transition hover:text-ml-cyan"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> MatrixLab Tumbler
      </Link>

      <header className="ready-tumbler-intro relative mt-5 overflow-hidden rounded-3xl border border-ml-coral/25 bg-linear-to-br from-ml-coral/15 via-ml-bg to-ml-violet/15 p-6 shadow-glow-coral sm:p-10">
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
          <TumblerSubcategoryNav selected="vasos-listos" />
          <p className="mt-4 text-xl font-semibold text-ml-white sm:text-2xl">
            Elige tu favorito. Ya le pusimos la magia.
          </p>
          <p className="mobile-catalog-description mt-3 max-w-xl leading-relaxed text-ml-white/70">
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
      </>}

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
            <CollapsibleCatalogFilters label="Filtrar vasos listos" selected={collection || "Todos"}><div className={`catalog-filters mt-8 flex flex-wrap gap-2 ${styles.filters}`} role="group" aria-label="Colecciones de vasos">
              {["", ...collections].map((name) => (
                <button
                  key={name}
                  type="button"
                  aria-pressed={collection === name}
                  onClick={() => setCollection(name)}
                  className={cn(
                    `min-h-11 rounded-full border px-4 text-sm font-semibold transition ${styles.filter}`,
                    collection === name
                      ? "border-ml-cyan/60 bg-ml-cyan/15 text-ml-cyan"
                      : "border-white/15 text-ml-white/65 hover:border-white/30 hover:text-ml-white",
                  )}
                >
                  {name || "Todos"}
                  {collection === name && <Check aria-hidden className={styles.check} />}
                </button>
              ))}
            </div></CollapsibleCatalogFilters>
          )}

          <div className={cn(styles.resultRow, !collection && styles.resultRowQuiet)}>
          <p className={cn("text-sm text-ui-text-muted", !collection && "max-sm:sr-only")} role="status" aria-live="polite" aria-atomic="true">
            {visible.length} de {items.length} diseños
          </p>
          {collection && <button type="button" className={styles.clear} onClick={() => setCollection("")}><X aria-hidden />Limpiar filtro</button>}
          </div>

          <div className={`mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 ${styles.products}`}>
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
  // Con producto real, foto y título llevan a su ficha.
  const productHref = entry.productId ? `/tienda/producto/${entry.handle}` : undefined;
  const titleHeading = (
    <h2 className={`text-lg font-bold leading-snug text-ml-white ${styles.cardTitle}`}>
      {entry.title}
    </h2>
  );

  function step(delta: number) {
    setQuantity((current) =>
      Math.min(Math.max(current + delta, 1), Math.max(1, maxQuantity)),
    );
  }

  return (
    <article
      className={cn(
        `glass flex flex-col overflow-hidden rounded-2xl border border-white/10 transition ${styles.card}`,
        purchaseDisabled
          ? "hover:border-white/20"
          : "hover:border-ml-coral/45 hover:shadow-glow-coral",
      )}
    >
      <div className="relative">
        <ProductPhotoGallery
          brand="tumbler"
          images={entry.imagePaths}
          title={entry.title}
          placeholder={READY_TUMBLER_PLACEHOLDER}
          aspectClass={`aspect-[4/5] ${styles.productPhoto}`}
          variant="overlay"
          compactOnMobile
          sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
          href={productHref}
        />
        {purchaseConfigured && soldOut && (
          <span className="absolute left-3 top-3 rounded-full bg-ml-bg/85 px-3 py-1 text-xs font-semibold text-ml-white/80">
            Agotado
          </span>
        )}
      </div>

      <div className={`flex flex-1 flex-col gap-2.5 p-5 ${styles.cardContent}`}>
        <p className={`text-xs font-semibold uppercase tracking-[0.12em] text-ml-coral ${styles.mobileHidden}`}>
          {entry.item.collection || "Vasos listos"}
        </p>

        {productHref ? <Link href={productHref} className={styles.titleLink}>{titleHeading}</Link> : titleHeading}

        <ProductDescription><p className="text-sm leading-relaxed text-ml-white/65 sm:line-clamp-3">
          {entry.item.description}
        </p></ProductDescription>

        {(entry.item.capacity || entry.item.finish) && (
          <p className={`text-sm text-ml-white/55 ${styles.mobileHidden}`}>
            {[entry.item.capacity, entry.item.finish].filter(Boolean).join(" · ")}
          </p>
        )}

        {/* En escritorio `priceRow` es transparente y la compra rápida no se muestra. */}
        <div className={styles.priceRow}>
          <p className={`mt-1 text-2xl font-bold text-ml-white ${styles.cardPrice}`}>
            {entry.price === null ? (
              <span className="text-base font-semibold text-ml-white/70">
                Precio por confirmar
              </span>
            ) : (
              <>
                {formatPrice(entry.price)}{" "}
                <span className="text-sm font-medium text-ui-text-muted">
                  MXN / pieza
                </span>
              </>
            )}
          </p>
          {/* Móvil: una pieza, independiente del selector de cantidad de escritorio. */}
          <AddToCartButton
            productId={entry.productId ?? ""}
            variantId={entry.variantId}
            quantity={1}
            disabled={purchaseDisabled}
            iconOnly
            label={
              !purchaseConfigured
                ? `${entry.title}: disponible muy pronto`
                : soldOut
                  ? `${entry.title}: agotado`
                  : `Agregar ${entry.title} al carrito`
            }
            className={styles.quickAdd}
          />
        </div>

        <p
          className={cn(
            `text-sm font-semibold ${styles.stock}`,
            purchaseDisabled ? "text-ui-text-muted" : `text-ml-cyan ${styles.stockAvailable}`,
          )}
        >
          {!purchaseConfigured
            ? "Disponible muy pronto"
            : soldOut
              ? "Agotado por ahora"
              : `Disponible: ${maxQuantity}`}
        </p>

        <p className={`text-xs text-ui-text-muted ${styles.mobileHidden}`}>
          Ref. {entry.item.code} · {entry.sku || readyTumblerSku(entry.item.code)}
        </p>

        <div className={`mt-auto flex flex-col gap-2.5 pt-3 ${styles.actions}`}>
          <div className={`flex items-center justify-between gap-2 rounded-full border border-white/10 bg-white/5 p-1 ${styles.quantity}`}>
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
            compactLabel={purchaseDisabled ? undefined : "Agregar"}
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

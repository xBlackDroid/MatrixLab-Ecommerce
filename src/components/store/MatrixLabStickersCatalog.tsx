"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { MessageCircle, Minus, Plus, Search } from "lucide-react";
import AddToCartButton from "@/components/store/AddToCartButton";
import type { MatrixLabStickerCatalogEntry } from "@/lib/store/products";
import {
  MATRIXLAB_STICKER_CATEGORY_LABELS,
  MATRIXLAB_STICKER_CATEGORY_ORDER,
  MATRIXLAB_STICKERS_SHEET_CONTENTS_COPY,
  MATRIXLAB_STICKERS_UNIT_LABEL,
  MATRIXLAB_STICKERS_UNIT_LABEL_PLURAL,
  matchesMatrixLabStickerFilter,
  matchesMatrixLabStickerQuery,
  matrixLabStickerCategoryCounts,
  matrixLabStickerRefLabel,
  type MatrixLabStickerCategoryId,
} from "@/lib/store/matrixlab-stickers";
import { cn, formatPrice } from "@/lib/utils";

/**
 * Tope de PLANILLAS por pedido cuando el producto es "sobre pedido" (sin
 * inventario que descontar). El servidor vuelve a validar cantidad y precio al
 * agregar al carrito; esto sólo evita un stepper bloqueado en la tarjeta.
 */
const ON_DEMAND_MAX_QUANTITY = 99;

interface StickerFilter {
  id: MatrixLabStickerCategoryId | null;
  label: string;
  count: number;
}

/**
 * Filtros derivados EXCLUSIVAMENTE del Excel: las 11 familias temáticas reales
 * con su conteo (10 planillas cada una). Una familia sin diseños no se
 * muestra; no se inventa ninguna otra.
 */
function buildFilters(entries: MatrixLabStickerCatalogEntry[]): StickerFilter[] {
  const counts = matrixLabStickerCategoryCounts(entries.map((e) => e.item));
  const filters: StickerFilter[] = [
    { id: null, label: "Todos", count: entries.length },
  ];
  for (const category of MATRIXLAB_STICKER_CATEGORY_ORDER) {
    if (counts[category] > 0) {
      filters.push({
        id: category,
        label: MATRIXLAB_STICKER_CATEGORY_LABELS[category],
        count: counts[category],
      });
    }
  }
  return filters;
}

export default function MatrixLabStickersCatalog({
  entries,
  whatsappUrl,
}: {
  entries: MatrixLabStickerCatalogEntry[];
  /** CTA de cotización mientras la planilla no exista como producto en base. */
  whatsappUrl: string;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<MatrixLabStickerCategoryId | null>(null);

  const filters = useMemo(() => buildFilters(entries), [entries]);

  // El orden base es el del Excel (GE001 → LE010, ya viene así del servidor):
  // no se reordena alfabéticamente ni por precio. Cada entrada es UNA planilla
  // completa, no un sticker suelto.
  const visible = useMemo(
    () =>
      entries.filter(
        (entry) =>
          matchesMatrixLabStickerFilter(entry.item, filter) &&
          matchesMatrixLabStickerQuery(entry.item, query),
      ),
    [entries, filter, query],
  );

  return (
    <div className="mt-10">
      <div className="flex flex-col gap-4">
        <label className="relative block">
          <span className="sr-only">
            Buscar planilla por código, SKU, nombre o categoría
          </span>
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ml-white/40"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por código, SKU, nombre o categoría (GE001, STK-GE001, Anime…)"
            className="glass h-12 w-full rounded-full border border-white/10 bg-white/5 pl-12 pr-4 text-base text-ml-white placeholder:text-ml-white/40 focus:border-ml-cyan/50 focus:outline-none"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          {filters.map((option) => {
            const active = filter === option.id;
            return (
              <button
                key={option.id ?? "todos"}
                type="button"
                onClick={() => setFilter(option.id)}
                aria-pressed={active}
                className={cn(
                  "inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition",
                  active
                    ? "border-ml-cyan/60 bg-ml-cyan/15 text-ml-cyan"
                    : "border-white/10 bg-white/5 text-ml-white/70 hover:border-white/25 hover:text-ml-white",
                )}
              >
                {option.label}
                <span
                  className={cn(
                    "text-xs font-medium",
                    active ? "text-ml-cyan/70" : "text-ml-white/40",
                  )}
                >
                  ({option.count})
                </span>
              </button>
            );
          })}
        </div>

        <p className="text-sm text-ml-white/50" aria-live="polite">
          {visible.length} de {entries.length} diseños de planilla
        </p>
      </div>

      {visible.length === 0 ? (
        <div className="glass mt-6 rounded-2xl p-10 text-center text-ml-white/60">
          No encontramos planillas con esa búsqueda. Prueba con el código o el
          SKU (por ejemplo: GE001 o STK-GE001).
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((entry) => (
            <StickerCard
              key={entry.handle}
              entry={entry}
              whatsappUrl={whatsappUrl}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Tarjeta de una PLANILLA. Jerarquía: foto → nombre → categoría → descripción →
 * disponibilidad → precio por planilla → qué trae la planilla → referencia
 * discreta. El código interno nunca compite visualmente con el nombre.
 *
 * La unidad comercial se dice explícitamente ("/ planilla", "Planilla de
 * stickers", "15 a 21 stickers aprox.") para que $85 no pueda leerse como el
 * precio de un sticker individual.
 */
function StickerCard({
  entry,
  whatsappUrl,
}: {
  entry: MatrixLabStickerCatalogEntry;
  whatsappUrl: string;
}) {
  const { item } = entry;
  // El precio por planilla está confirmado ($85). Si aun así llegara sin
  // resolver (línea futura sin precio), la tarjeta lo dice en vez de inventar
  // una cifra.
  const priceConfirmed = entry.price !== null;
  // Una planilla "sobre pedido" es vendible con stock 0: no hay inventario que
  // contar, pero sí se puede pedir. Sin este caso el "+" quedaría bloqueado y
  // la tarjeta diría "Disponible: 0" junto a un botón de agregar activo.
  const onDemand = entry.sellable && (entry.stock ?? 0) <= 0;
  const maxQuantity = onDemand
    ? ON_DEMAND_MAX_QUANTITY
    : Math.max(0, entry.stock ?? 0);
  const [quantity, setQuantity] = useState(1);

  function step(delta: number) {
    setQuantity((current) =>
      Math.min(Math.max(current + delta, 1), Math.max(1, maxQuantity)),
    );
  }

  return (
    <article className="glass flex flex-col overflow-hidden rounded-2xl transition hover:border-ml-violet/40">
      <div className="relative aspect-square w-full overflow-hidden">
        <Image
          src={entry.image}
          alt={`${entry.title} — planilla de stickers`}
          fill
          sizes="(max-width: 420px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition duration-500 hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full bg-ml-bg/85 px-3 py-1 text-xs font-semibold text-ml-cyan">
          {MATRIXLAB_STICKER_CATEGORY_LABELS[item.category]}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-base font-bold leading-snug text-ml-white sm:text-lg">
          {entry.title}
        </h3>

        <p className="text-sm text-ml-white/60">{item.description}</p>

        {/* La disponibilidad sale SIEMPRE de la variante real, nunca de la
            columna H del Excel (que es 99 en las 110 filas y afirmaría "hay
            stock" incluso sin producto en base). Mientras no exista variante
            no se afirma nada: se declara pendiente, igual que el precio. */}
        <p
          className={cn(
            "text-sm font-semibold",
            entry.stock === null
              ? "text-ml-white/70"
              : entry.sellable
                ? "text-ml-cyan"
                : "text-ml-white/50",
          )}
        >
          {entry.stock === null
            ? "Disponibilidad por confirmar"
            : onDemand
              ? "Sobre pedido"
              : entry.sellable
                ? `Disponible: ${entry.stock} ${
                    entry.stock === 1
                      ? MATRIXLAB_STICKERS_UNIT_LABEL
                      : MATRIXLAB_STICKERS_UNIT_LABEL_PLURAL
                  }`
                : "Agotado"}
        </p>

        {priceConfirmed ? (
          <p className="text-xl font-bold text-ml-white">
            {formatPrice(entry.price as number)}{" "}
            <span className="text-sm font-medium text-ml-white/50">
              / {MATRIXLAB_STICKERS_UNIT_LABEL}
            </span>
          </p>
        ) : (
          <p className="text-sm font-semibold text-ml-white/70">
            Precio por confirmar
          </p>
        )}

        {/* Qué se lleva el cliente por ese precio. El rango es declarado para
            toda la línea: hoy NO existe el conteo exacto por colección y no se
            inventa uno por SKU. */}
        <p className="text-sm font-semibold text-ml-white/75">
          Planilla de stickers
          <span className="block text-xs font-medium text-ml-white/50">
            {MATRIXLAB_STICKERS_SHEET_CONTENTS_COPY}
          </span>
        </p>

        <p className="text-xs text-ml-white/40">
          {matrixLabStickerRefLabel(item.code)} · {entry.sku}
        </p>

        {/* Cantidad = PLANILLAS completas: 1 = 1 planilla, 2 = 2 planillas.
            Se agrega al carrito SÓLO cuando el producto existe de verdad en
            base y es vendible; el servidor vuelve a resolver precio y stock al
            agregar. Mientras el seed no se haya ejecutado no hay producto que
            agregar, así que la tarjeta cotiza por WhatsApp. */}
        <div className="mt-auto flex flex-col gap-2 pt-2">
          {entry.sellable && entry.productId ? (
            <>
              <div className="flex items-center justify-between gap-2 rounded-full border border-white/10 bg-white/5 p-1">
                <button
                  type="button"
                  onClick={() => step(-1)}
                  disabled={quantity <= 1}
                  aria-label="Quitar una planilla"
                  className="flex h-11 w-11 items-center justify-center rounded-full text-ml-white/80 transition hover:bg-white/10 disabled:opacity-30"
                >
                  <Minus className="h-4 w-4" aria-hidden />
                </button>
                <span className="min-w-8 text-center text-base font-semibold">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => step(1)}
                  disabled={quantity >= maxQuantity}
                  aria-label="Agregar una planilla"
                  className="flex h-11 w-11 items-center justify-center rounded-full text-ml-white/80 transition hover:bg-white/10 disabled:opacity-30"
                >
                  <Plus className="h-4 w-4" aria-hidden />
                </button>
              </div>
              <AddToCartButton
                productId={entry.productId}
                variantId={entry.variantId}
                quantity={quantity}
                label="Agregar"
                className="min-h-11 px-4 py-2.5 text-sm"
              />
            </>
          ) : (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-ml-green px-4 py-2.5 text-sm font-semibold text-ml-bg transition hover:bg-ml-green/90"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              Cotizar por WhatsApp
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

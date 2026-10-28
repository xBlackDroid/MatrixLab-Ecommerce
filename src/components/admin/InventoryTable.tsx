"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ImageOff, Loader2, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import type { InventoryMovementRow, ProductVariantRow } from "@/lib/db/types";
import {
  INVENTORY_BLOCKS,
  NO_INVENTORY_BLOCK_LABEL,
  inventorySearchText,
  normalizeInventorySearch,
  type InventoryBlockId,
  type InventoryRow,
} from "@/lib/store/commercial-blocks";
import { VARIANT_STATUSES } from "@/lib/validation/store";

const CSRF_HEADER = "x-ml-csrf";

export type { InventoryRow };

export type MovementRow = InventoryMovementRow & {
  product_variants: Pick<ProductVariantRow, "title" | "sku"> | null;
};

/** "all" = todos; "none" = variantes sin bloque. */
type BlockFilter = "all" | "none" | InventoryBlockId;

const columnHelper = createColumnHelper<InventoryRow>();

/** Nombre de la fila para lectores de pantalla: "Producto · Variante". */
function rowName(row: InventoryRow): string {
  const product = row.display.productTitle ?? "Variante sin producto";
  return `${product} · ${row.title}`;
}

/** En móvil la tabla se apila en tarjetas: cada dato lleva su etiqueta. */
function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-semibold uppercase text-ml-white/45 sm:hidden">
      {children}
    </span>
  );
}

/** Miniatura con fallback intencional: nunca un icono de imagen rota. */
function Thumbnail({ src, alt }: { src: string | null; alt: string }) {
  const [failed, setFailed] = useState(false);
  const box =
    "flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] sm:h-14 sm:w-14";
  if (!src || failed) {
    return (
      <span
        data-testid="inventory-thumb"
        className={`${box} flex-col gap-0.5 text-ml-white/40`}
      >
        <ImageOff className="h-4 w-4" aria-hidden />
        <span className="text-[10px] leading-none">Sin imagen</span>
      </span>
    );
  }
  return (
    <span data-testid="inventory-thumb" className={box}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        width={64}
        height={64}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className="h-full w-full object-contain"
      />
    </span>
  );
}

export default function InventoryTable({
  inventory,
  movements,
  csrf,
  readOnly = false,
}: {
  inventory: InventoryRow[];
  movements: MovementRow[];
  csrf: string;
  /** Vista de muestra: muestra los controles pero nunca llama a la API. */
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState("");
  const [block, setBlock] = useState<BlockFilter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function adjust(
    variantId: string,
    payload: { delta?: number; status?: string },
  ) {
    if (readOnly) {
      toast.info("Vista de muestra: solo lectura, no se modificó nada.");
      return;
    }
    setBusyId(variantId);
    try {
      const res = await fetch("/api/admin/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", [CSRF_HEADER]: csrf },
        body: JSON.stringify({ variantId, ...payload }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        toast.error(data?.error ?? "No pudimos ajustar el inventario.");
        return;
      }
      toast.success("Inventario actualizado");
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  const blockCounts = useMemo(() => {
    const counts = new Map<BlockFilter, number>();
    for (const row of inventory) {
      const key: BlockFilter = row.display.block ?? "none";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }, [inventory]);

  const rowsInBlock = useMemo(
    () =>
      block === "all"
        ? inventory
        : inventory.filter((row) => (row.display.block ?? "none") === block),
    [inventory, block],
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor((row) => row.display.productTitle ?? "—", {
        id: "product",
        header: "Producto",
        cell: (info) => {
          const row = info.row.original;
          return (
            <span className="flex min-w-0 items-center gap-3">
              <Thumbnail
                key={row.display.thumbnail ?? "none"}
                src={row.display.thumbnail}
                alt={`Foto de ${rowName(row)}`}
              />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="break-words font-semibold">
                  {info.getValue()}
                </span>
                {row.display.categoryTitle && (
                  <span className="break-words text-xs text-ml-white/45">
                    {row.display.categoryTitle}
                  </span>
                )}
              </span>
            </span>
          );
        },
      }),
      columnHelper.accessor((row) => row.display.blockLabel, {
        id: "block",
        header: "Bloque",
        cell: (info) => {
          const row = info.row.original;
          return (
            <>
              <CardLabel>Bloque</CardLabel>
              <span
                className={
                  row.display.block
                    ? "inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-ml-white/80"
                    : "inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-ml-white/45"
                }
              >
                <span
                  aria-hidden
                  className={
                    row.display.block
                      ? "h-1.5 w-1.5 rounded-full bg-ml-violet"
                      : "h-1.5 w-1.5 rounded-full border border-ml-white/40"
                  }
                />
                {info.getValue()}
              </span>
            </>
          );
        },
      }),
      columnHelper.accessor("title", {
        header: "Variante",
        cell: (info) => (
          <>
            <CardLabel>Variante</CardLabel>
            <span className="break-words max-sm:text-right">
              {info.getValue()}
            </span>
          </>
        ),
      }),
      columnHelper.accessor("sku", {
        header: "SKU",
        cell: (info) => (
          <>
            <CardLabel>SKU</CardLabel>
            <span className="break-all font-mono text-xs text-ml-white/55 max-sm:text-right">
              {info.getValue() ?? "—"}
            </span>
          </>
        ),
      }),
      columnHelper.accessor("stock", {
        header: "Stock",
        cell: (info) => {
          const row = info.row.original;
          const busy = busyId === row.id;
          const name = rowName(row);
          return (
            <>
              <CardLabel>Stock</CardLabel>
              <span className="inline-flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={busy || row.stock <= 0}
                  aria-disabled={readOnly || undefined}
                  onClick={() => adjust(row.id, { delta: -1 })}
                  aria-label={`Restar 1 a ${name}`}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-ml-white/60 transition hover:border-ml-coral/50 hover:text-ml-coral focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ml-violet disabled:opacity-30 sm:h-7 sm:w-7 pointer-coarse:h-11 pointer-coarse:w-11"
                >
                  <Minus className="h-3.5 w-3.5" aria-hidden />
                </button>
                <span className="min-w-9 text-center font-bold">
                  {busy ? (
                    <Loader2 className="mx-auto h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    row.stock
                  )}
                </span>
                <button
                  type="button"
                  disabled={busy}
                  aria-disabled={readOnly || undefined}
                  onClick={() => adjust(row.id, { delta: 1 })}
                  aria-label={`Sumar 1 a ${name}`}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-ml-white/60 transition hover:border-ml-cyan/50 hover:text-ml-cyan focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ml-violet disabled:opacity-30 sm:h-7 sm:w-7 pointer-coarse:h-11 pointer-coarse:w-11"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden />
                </button>
              </span>
            </>
          );
        },
      }),
      columnHelper.accessor("status", {
        header: "Estado",
        cell: (info) => {
          const row = info.row.original;
          return (
            <>
              <CardLabel>Estado</CardLabel>
              <select
                value={row.status}
                disabled={busyId === row.id}
                aria-disabled={readOnly || undefined}
                aria-label={`Estado de ${rowName(row)}`}
                onChange={(event) =>
                  adjust(row.id, { status: event.target.value })
                }
                className="min-h-11 rounded-full border border-white/15 bg-ml-bg px-3 [color-scheme:dark] py-1.5 text-base outline-none transition focus:border-ml-violet focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ml-violet sm:min-h-0 sm:text-xs pointer-coarse:min-h-11 pointer-coarse:text-base"
              >
                {VARIANT_STATUSES.map((status) => (
                  <option key={status} value={status} className="bg-ml-bg">
                    {status}
                  </option>
                ))}
              </select>
            </>
          );
        },
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [busyId, csrf, readOnly],
  );

  const table = useReactTable({
    data: rowsInBlock,
    columns,
    // Id estable por variante: al filtrar, cada fila conserva su propio estado
    // (p. ej. el fallback de una foto que no cargó) en lugar del de su índice.
    getRowId: (row) => row.id,
    state: { globalFilter: filter },
    onGlobalFilterChange: setFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, _columnId, filterValue) =>
      inventorySearchText(row.original).includes(
        normalizeInventorySearch(String(filterValue)),
      ),
  });

  const visibleRows = table.getRowModel().rows;
  const hasFilters = filter.trim() !== "" || block !== "all";
  const noneCount = blockCounts.get("none") ?? 0;

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex w-full flex-col gap-1.5 sm:max-w-sm">
          <label
            htmlFor="inventory-search"
            className="text-xs font-semibold uppercase text-ml-white/45"
          >
            Buscar
          </label>
          <input
            id="inventory-search"
            type="search"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Producto, variante, SKU o bloque…"
            className="min-h-11 w-full rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-base outline-none transition placeholder:text-ml-white/35 focus:border-ml-violet sm:text-sm pointer-coarse:text-base"
          />
        </div>
        <div className="flex w-full flex-col gap-1.5 sm:w-auto">
          <label
            htmlFor="inventory-block"
            className="text-xs font-semibold uppercase text-ml-white/45"
          >
            Bloque
          </label>
          <select
            id="inventory-block"
            value={block}
            onChange={(event) => setBlock(event.target.value as BlockFilter)}
            className="min-h-11 w-full rounded-full border border-white/15 bg-ml-bg px-4 [color-scheme:dark] py-2.5 text-base outline-none transition focus:border-ml-violet sm:w-auto sm:text-sm pointer-coarse:text-base"
          >
            <option value="all">Todos los bloques ({inventory.length})</option>
            {INVENTORY_BLOCKS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label} ({blockCounts.get(item.id) ?? 0})
              </option>
            ))}
            {noneCount > 0 && (
              <option value="none">
                {NO_INVENTORY_BLOCK_LABEL} ({noneCount})
              </option>
            )}
          </select>
        </div>
        <p
          aria-live="polite"
          className="text-xs text-ml-white/50 sm:ml-auto sm:pb-3"
        >
          {visibleRows.length} de {inventory.length} variantes
        </p>
      </div>

      <div className="glass rounded-2xl sm:overflow-x-auto">
        <table className="w-full text-left text-sm max-sm:block">
          <thead className="border-b border-white/10 text-xs uppercase text-ml-white/45 max-sm:sr-only">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3.5 lg:px-5">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-white/5 max-sm:block">
            {visibleRows.length === 0 && (
              <tr className="max-sm:block">
                <td
                  colSpan={6}
                  className="px-5 py-10 text-center text-ml-white/50 max-sm:block"
                >
                  {inventory.length === 0 ? (
                    "Sin variantes registradas."
                  ) : (
                    <span className="flex flex-col items-center gap-3">
                      Ninguna variante coincide con los filtros.
                      {hasFilters && (
                        <button
                          type="button"
                          onClick={() => {
                            setFilter("");
                            setBlock("all");
                          }}
                          className="min-h-11 rounded-full border border-white/15 px-4 text-sm text-ml-white/80 transition hover:border-ml-violet focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ml-violet"
                        >
                          Limpiar filtros
                        </button>
                      )}
                    </span>
                  )}
                </td>
              </tr>
            )}
            {visibleRows.map((row) => (
              <tr
                key={row.id}
                data-testid="inventory-row"
                className="hover:bg-white/[0.03] max-sm:flex max-sm:flex-col max-sm:gap-2 max-sm:px-4 max-sm:py-4"
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={
                      cell.column.id === "product"
                        ? "px-4 py-3 align-middle lg:px-5 max-sm:p-0 max-sm:pb-1"
                        : "px-4 py-3 align-middle lg:px-5 max-sm:flex max-sm:min-h-11 max-sm:items-center max-sm:justify-between max-sm:gap-3 max-sm:p-0"
                    }
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="glass mt-8 rounded-2xl p-6">
        <h2 className="mb-4 text-lg font-semibold">
          Movimientos recientes de inventario
        </h2>
        {movements.length === 0 ? (
          <p className="text-sm text-ml-white/55">
            Aquí verás ventas, ajustes y reposiciones.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-white/5 text-sm">
            {movements.map((movement) => (
              <li
                key={movement.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2.5"
              >
                <span className="text-ml-white/70">
                  {movement.product_variants?.title ?? "Variante"}
                  {movement.product_variants?.sku && (
                    <span className="ml-2 font-mono text-xs text-ml-white/40">
                      {movement.product_variants.sku}
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-3">
                  <span className="text-xs text-ml-white/45">
                    {movement.movement_type}
                    {movement.reason ? ` · ${movement.reason}` : ""}
                  </span>
                  <span
                    className={
                      movement.quantity >= 0
                        ? "font-bold text-ml-cyan"
                        : "font-bold text-ml-coral"
                    }
                  >
                    {movement.quantity > 0 ? "+" : ""}
                    {movement.quantity}
                  </span>
                  <span className="text-xs text-ml-white/40">
                    {new Date(movement.created_at).toLocaleString("es-MX")}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

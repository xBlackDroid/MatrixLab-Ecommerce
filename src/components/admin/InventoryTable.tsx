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
import { Loader2, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import type {
  InventoryMovementRow,
  ProductRow,
  ProductVariantRow,
} from "@/lib/db/types";
import { VARIANT_STATUSES } from "@/lib/validation/store";

const CSRF_HEADER = "x-ml-csrf";

export type InventoryRow = ProductVariantRow & {
  products: Pick<ProductRow, "title" | "handle"> | null;
};

export type MovementRow = InventoryMovementRow & {
  product_variants: Pick<ProductVariantRow, "title" | "sku"> | null;
};

const columnHelper = createColumnHelper<InventoryRow>();

export default function InventoryTable({
  inventory,
  movements,
  csrf,
}: {
  inventory: InventoryRow[];
  movements: MovementRow[];
  csrf: string;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function adjust(
    variantId: string,
    payload: { delta?: number; status?: string },
  ) {
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

  const columns = useMemo(
    () => [
      columnHelper.accessor((row) => row.products?.title ?? "—", {
        id: "product",
        header: "Producto",
        cell: (info) => (
          <span className="font-semibold">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("title", {
        header: "Variante",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("sku", {
        header: "SKU",
        cell: (info) => (
          <span className="font-mono text-xs text-ml-white/55">
            {info.getValue() ?? "—"}
          </span>
        ),
      }),
      columnHelper.accessor("stock", {
        header: "Stock",
        cell: (info) => {
          const row = info.row.original;
          const busy = busyId === row.id;
          return (
            <span className="inline-flex items-center gap-1.5">
              <button
                type="button"
                disabled={busy || row.stock <= 0}
                onClick={() => adjust(row.id, { delta: -1 })}
                aria-label="Restar 1"
                className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-ml-white/60 transition hover:border-ml-coral/50 hover:text-ml-coral disabled:opacity-30"
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
                onClick={() => adjust(row.id, { delta: 1 })}
                aria-label="Sumar 1"
                className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-ml-white/60 transition hover:border-ml-cyan/50 hover:text-ml-cyan disabled:opacity-30"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden />
              </button>
            </span>
          );
        },
      }),
      columnHelper.accessor("status", {
        header: "Estado",
        cell: (info) => {
          const row = info.row.original;
          return (
            <select
              value={row.status}
              disabled={busyId === row.id}
              onChange={(event) =>
                adjust(row.id, { status: event.target.value })
              }
              className="rounded-full border border-white/15 bg-ml-bg px-3 py-1.5 text-xs outline-none transition focus:border-ml-violet"
            >
              {VARIANT_STATUSES.map((status) => (
                <option key={status} value={status} className="bg-ml-bg">
                  {status}
                </option>
              ))}
            </select>
          );
        },
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [busyId, csrf],
  );

  const table = useReactTable({
    data: inventory,
    columns,
    state: { globalFilter: filter },
    onGlobalFilterChange: setFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, _columnId, filterValue) => {
      const value = String(filterValue).toLowerCase();
      const target = `${row.original.products?.title ?? ""} ${row.original.title} ${row.original.sku ?? ""}`;
      return target.toLowerCase().includes(value);
    },
  });

  return (
    <>
      <div className="mb-4">
        <input
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Buscar por producto, variante o SKU…"
          className="w-full max-w-sm rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm outline-none transition placeholder:text-ml-white/35 focus:border-ml-violet"
        />
      </div>

      <div className="glass overflow-x-auto rounded-2xl">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase text-ml-white/45">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-5 py-3.5">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-white/5">
            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-ml-white/50">
                  Sin variantes registradas.
                </td>
              </tr>
            )}
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-white/[0.03]">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-5 py-3">
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

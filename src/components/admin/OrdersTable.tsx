"use client";

import { Fragment, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Palette } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import StatusBadge from "@/components/admin/StatusBadge";
import type { OrderItemRow, OrderRow, OrderStatus } from "@/lib/db/types";
import ShippingAddressBlock from "@/components/admin/ShippingAddressBlock";
import { cn, formatPrice } from "@/lib/utils";
import { ORDER_STATUSES } from "@/lib/validation/store";

import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Pagination from "@/components/ui/Pagination";
import { statusLabel, paymentProviderLabel } from "@/lib/ui/status";
import CollapsibleCatalogFilters from "@/components/store/CollapsibleCatalogFilters";
import records from "./admin-records.module.css";

const CSRF_HEADER = "x-ml-csrf";
const ORDER_COLUMNS = ["Pedido", "Fecha", "Cliente", "Total", "Pago", "Estado", "Acciones"] as const;

export type OrderWithItems = OrderRow & { order_items: OrderItemRow[] | null };

export default function OrdersTable({
  orders,
  csrf,
  currentFilter,
}: {
  orders: OrderWithItems[];
  csrf: string;
  currentFilter: string | null;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const inFlight = useRef(false);
  const [page, setPage] = useState(0);
  const [review, setReview] = useState<{ order: OrderWithItems; status: OrderStatus } | null>(null);
  const currentPage = Math.min(page, Math.max(0, Math.ceil(orders.length / 25) - 1));

  async function updateStatus(orderId: string, status: OrderStatus) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusyId(orderId);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", [CSRF_HEADER]: csrf },
        body: JSON.stringify({ orderId, status }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        toast.error(data?.error ?? "No pudimos actualizar el pedido.");
        return;
      }
      toast.success("Estado actualizado");
      setReview(null);
      router.refresh();
    } catch { toast.error("No pudimos confirmar el cambio. Actualiza los datos antes de reintentarlo.");
    } finally {
      inFlight.current = false;
      setBusyId(null);
    }
  }

  return (
    <>
      {/* Filtro por estado (whitelist) */}
      <CollapsibleCatalogFilters label="Filtrar pedidos" selected={currentFilter ? statusLabel(currentFilter) : "Todos"}><div className={`${records.filterChoices} catalog-filters mb-5 flex flex-wrap gap-2`} onClick={event => { if ((event.target as Element).closest("a")) { const details = event.currentTarget.closest("details"); if (details) { details.open = false; details.querySelector("summary")?.focus(); } } }}>
        <Link
          href="/admin/pedidos"
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition",
            !currentFilter
              ? "border-ml-violet bg-ml-violet/15 text-ml-violet"
              : "border-white/15 text-ml-white/60 hover:border-white/30",
          )}
        >
          Todos
        </Link>
        {ORDER_STATUSES.map((status) => (
          <Link
            key={status}
            href={`/admin/pedidos?status=${status}`}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition",
              currentFilter === status
                ? "border-ml-violet bg-ml-violet/15 text-ml-violet"
                : "border-white/15 text-ml-white/60 hover:border-white/30",
            )}
          >
            {statusLabel(status)}
          </Link>
        ))}
      </div></CollapsibleCatalogFilters>

      <div className={`${records.tableWrap} glass overflow-x-auto rounded-2xl`}>
        <table role="table" className={`${records.table} ui-responsive w-full text-left text-sm`}><caption className="sr-only">Pedidos · importes en MXN</caption>
          <thead className="border-b border-white/10 text-xs uppercase text-ui-text-muted">
            <tr>
              {ORDER_COLUMNS.map(column => <th scope="col" key={column} className="px-5 py-3.5">{column === "Acciones" ? <span className="sr-only">{column}</span> : column}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {orders.length === 0 && (
              <tr>
                <td colSpan={ORDER_COLUMNS.length} className="px-5 py-10 text-center text-ui-text-muted">
                  No hay pedidos con este filtro.
                </td>
              </tr>
            )}
            {orders.slice(currentPage * 25, (currentPage + 1) * 25).map((order) => {
              const isOpen = expanded === order.id;
              const items = order.order_items ?? [];
              return (
                <Fragment key={order.id}>
                  <tr className="hover:bg-white/[0.03]">
                    <td data-label="Pedido" className="px-5 py-3.5 font-mono text-ml-violet">
                      {order.order_number}
                    </td>
                    <td data-label="Fecha" className="px-5 py-3.5 text-ml-white/60">
                      {new Date(order.created_at).toLocaleString("es-MX", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                    <td data-label="Cliente" className="px-5 py-3.5">{order.customer_name}</td>
                    <td data-label="Total" className="px-5 py-3.5 font-semibold">
                      {formatPrice(order.total)}
                    </td>
                    <td data-label="Pago" className="px-5 py-3.5">
                      <StatusBadge status={order.payment_status} />
                    </td>
                    <td data-label="Estado" className="px-5 py-3.5">
                      <select
                        value={order.status}
                        disabled={busyId !== null}
                        aria-label={`Estado del pedido ${order.order_number}`}
                        onChange={event => setReview({ order, status: event.target.value as OrderStatus })}
                        className="rounded-full border border-white/15 bg-ml-bg px-3 py-1.5 text-xs outline-none transition focus:border-ml-violet"
                      >
                        {ORDER_STATUSES.map((status) => (
                          <option key={status} value={status} className="bg-ml-bg">
                            {statusLabel(status)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td data-label="Acciones" className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={`order-detail-${order.id}`}
                        aria-label={`${isOpen ? "Cerrar" : "Ver"} detalle del pedido ${order.order_number}`}
                        onClick={() => setExpanded(isOpen ? null : order.id)}
                        className="inline-flex items-center gap-1 rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold transition hover:border-ml-violet/50"
                      >
                        Detalle
                        {isOpen ? (
                          <ChevronUp className="h-3.5 w-3.5" aria-hidden />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                        )}
                      </button>
                    </td>
                  </tr>

                  {isOpen && (
                    <tr id={`order-detail-${order.id}`} data-order-detail className="bg-white/[0.02]">
                      <td colSpan={ORDER_COLUMNS.length} className="px-5 py-5">
                        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                          <div>
                            <h3 className="mb-2 text-xs font-bold uppercase text-ui-text-muted">
                              Productos
                            </h3>
                            <ul className="flex flex-col gap-2">
                              {items.map((item) => (
                                <li
                                  key={item.id}
                                  className="flex items-center justify-between gap-3 rounded-lg bg-white/5 px-3.5 py-2.5"
                                >
                                  <span>
                                    {item.quantity}× {item.title_snapshot}
                                    {item.variant_snapshot && (
                                      <span className="text-ml-white/55">
                                        {" "}
                                        ({item.variant_snapshot})
                                      </span>
                                    )}
                                    {item.is_custom && (
                                      <Link
                                        href="/admin/disenos"
                                        className="ml-2 inline-flex items-center gap-1 rounded-full border border-ml-cyan/40 bg-ml-cyan/10 px-2 py-0.5 text-[11px] font-semibold text-ml-cyan"
                                      >
                                        <Palette className="h-3 w-3" aria-hidden />
                                        Personalizado
                                      </Link>
                                    )}
                                  </span>
                                  <span className="shrink-0 font-semibold">
                                    {formatPrice(item.total)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                            <p className="mt-3 text-right text-sm">
                              Subtotal {formatPrice(order.subtotal)} · Envío{" "}
                              {formatPrice(order.shipping)} ·{" "}
                              <span className="font-bold">
                                Total {formatPrice(order.total)}
                              </span>
                            </p>
                          </div>

                          <div className="flex flex-col gap-3 text-sm">
                            <h3 className="text-xs font-bold uppercase text-ui-text-muted">
                              Contacto y pago
                            </h3>
                            <p>
                              <span className="text-ui-text-muted">Cliente:</span>{" "}
                              {order.customer_name}
                            </p>
                            {order.customer_phone && (
                              <p>
                                <span className="text-ui-text-muted">Teléfono:</span>{" "}
                                {order.customer_phone}
                              </p>
                            )}
                            {order.customer_email && (
                              <p>
                                <span className="text-ui-text-muted">Correo:</span>{" "}
                                {order.customer_email}
                              </p>
                            )}
                            <p>
                              <span className="text-ui-text-muted">
                                Proveedor de pago:
                              </span>{" "}
                              {paymentProviderLabel(order.payment_provider)}
                            </p>
                            {order.payment_reference && (
                              <p>
                                <span className="text-ui-text-muted">
                                  Referencia de pago:
                                </span>{" "}
                                <span className="font-mono text-xs">
                                  {order.payment_reference}
                                </span>
                              </p>
                            )}
                            {order.paid_at && (
                              <p>
                                <span className="text-ui-text-muted">Pagado:</span>{" "}
                                {new Date(order.paid_at).toLocaleString("es-MX")}
                              </p>
                            )}
                            {order.notes && (
                              <p className="rounded-lg bg-white/5 px-3.5 py-2.5 text-ml-white/70">
                                <span className="text-ui-text-muted">Notas:</span>{" "}
                                {order.notes}
                              </p>
                            )}
                          </div>

                          {/* A dónde se envía. Sólo aquí, dentro del admin
                              autenticado: la dirección es PII y no aparece en
                              ninguna vista pública. */}
                          <ShippingAddressBlock
                            address={order.shipping_address}
                          />
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination page={currentPage} total={orders.length} pageSize={25} onChange={setPage} label="Páginas de pedidos cargados" />
      <ConfirmDialog open={Boolean(review)} title="Revisar cambio de estado" busy={busyId !== null} onCancel={() => setReview(null)} onConfirm={() => { if (review) void updateStatus(review.order.id, review.status); }}><p>Pedido <strong>{review?.order.order_number}</strong></p><p className="mt-2">{review ? statusLabel(review.order.status) : ""} → {review ? statusLabel(review.status) : ""}</p><p className="mt-3">Este cambio modifica el estado operativo del pedido. No confirma un cobro ni ejecuta un reembolso. Revisa la operación antes de confirmarla.</p></ConfirmDialog>
    </>
  );
}

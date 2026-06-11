"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Palette } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import StatusBadge from "@/components/admin/StatusBadge";
import type { OrderItemRow, OrderRow, OrderStatus } from "@/lib/db/types";
import { cn, formatPrice } from "@/lib/utils";
import { ORDER_STATUSES } from "@/lib/validation/store";

const CSRF_HEADER = "x-ml-csrf";

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

  async function updateStatus(orderId: string, status: OrderStatus) {
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
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      {/* Filtro por estado (whitelist) */}
      <div className="mb-5 flex flex-wrap gap-2">
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
            {status.replaceAll("_", " ")}
          </Link>
        ))}
      </div>

      <div className="glass overflow-x-auto rounded-2xl">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase text-ml-white/45">
            <tr>
              <th className="px-5 py-3.5">Pedido</th>
              <th className="px-5 py-3.5">Fecha</th>
              <th className="px-5 py-3.5">Cliente</th>
              <th className="px-5 py-3.5">Total</th>
              <th className="px-5 py-3.5">Pago</th>
              <th className="px-5 py-3.5">Estado</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-ml-white/50">
                  No hay pedidos con este filtro.
                </td>
              </tr>
            )}
            {orders.map((order) => {
              const isOpen = expanded === order.id;
              const items = order.order_items ?? [];
              return (
                <Fragment key={order.id}>
                  <tr className="hover:bg-white/[0.03]">
                    <td className="px-5 py-3.5 font-mono text-ml-violet">
                      {order.order_number}
                    </td>
                    <td className="px-5 py-3.5 text-ml-white/60">
                      {new Date(order.created_at).toLocaleString("es-MX", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="px-5 py-3.5">{order.customer_name}</td>
                    <td className="px-5 py-3.5 font-semibold">
                      {formatPrice(order.total)}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={order.payment_status} />
                    </td>
                    <td className="px-5 py-3.5">
                      <select
                        value={order.status}
                        disabled={busyId === order.id}
                        onChange={(event) =>
                          updateStatus(
                            order.id,
                            event.target.value as OrderStatus,
                          )
                        }
                        className="rounded-full border border-white/15 bg-ml-bg px-3 py-1.5 text-xs outline-none transition focus:border-ml-violet"
                      >
                        {ORDER_STATUSES.map((status) => (
                          <option key={status} value={status} className="bg-ml-bg">
                            {status.replaceAll("_", " ")}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
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
                    <tr className="bg-white/[0.02]">
                      <td colSpan={7} className="px-5 py-5">
                        <div className="grid gap-6 lg:grid-cols-2">
                          <div>
                            <h3 className="mb-2 text-xs font-bold uppercase text-ml-white/45">
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
                            <h3 className="text-xs font-bold uppercase text-ml-white/45">
                              Contacto y pago
                            </h3>
                            <p>
                              <span className="text-ml-white/50">Cliente:</span>{" "}
                              {order.customer_name}
                            </p>
                            {order.customer_phone && (
                              <p>
                                <span className="text-ml-white/50">Teléfono:</span>{" "}
                                {order.customer_phone}
                              </p>
                            )}
                            {order.customer_email && (
                              <p>
                                <span className="text-ml-white/50">Correo:</span>{" "}
                                {order.customer_email}
                              </p>
                            )}
                            <p>
                              <span className="text-ml-white/50">
                                Proveedor de pago:
                              </span>{" "}
                              {order.payment_provider}
                            </p>
                            {order.payment_reference && (
                              <p>
                                <span className="text-ml-white/50">
                                  Referencia de pago:
                                </span>{" "}
                                <span className="font-mono text-xs">
                                  {order.payment_reference}
                                </span>
                              </p>
                            )}
                            {order.paid_at && (
                              <p>
                                <span className="text-ml-white/50">Pagado:</span>{" "}
                                {new Date(order.paid_at).toLocaleString("es-MX")}
                              </p>
                            )}
                            {order.notes && (
                              <p className="rounded-lg bg-white/5 px-3.5 py-2.5 text-ml-white/70">
                                <span className="text-ml-white/50">Notas:</span>{" "}
                                {order.notes}
                              </p>
                            )}
                          </div>
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
    </>
  );
}

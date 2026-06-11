import type { Metadata } from "next";
import Link from "next/link";
import {
  Boxes,
  Package,
  Palette,
  ShoppingCart,
  TriangleAlert,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import StatusBadge from "@/components/admin/StatusBadge";
import { getServiceClient } from "@/lib/db/admin";
import type { OrderRow } from "@/lib/db/types";
import { requireAdminPage } from "@/lib/security/admin-auth";
import { isSupabaseConfigured } from "@/lib/security/env";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Resumen | MatrixLab Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

async function loadStats() {
  const client = getServiceClient();
  if (!client) return null;

  const [products, pendingOrders, paidOrders, designs, recentOrders] =
    await Promise.all([
      client.from("products").select("id", { count: "exact", head: true }),
      client
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "pendiente_pago"),
      client
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "pagado"),
      client
        .from("design_projects")
        .select("id", { count: "exact", head: true })
        .eq("status", "production_ready"),
      client
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(6),
    ]);

  return {
    products: products.count ?? 0,
    pendingOrders: pendingOrders.count ?? 0,
    paidOrders: paidOrders.count ?? 0,
    designsReady: designs.count ?? 0,
    recentOrders: (recentOrders.data ?? []) as OrderRow[],
  };
}

export default async function AdminDashboardPage() {
  await requireAdminPage();
  const stats = isSupabaseConfigured() ? await loadStats() : null;

  return (
    <AdminLayout
      title="Resumen"
      description="Estado general de MatrixLab Store Core."
    >
      {!stats ? (
        <div className="glass flex items-start gap-3 rounded-2xl p-6 text-sm text-ml-coral">
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <p>
            Base de datos no configurada. Define SUPABASE_URL y
            SUPABASE_SERVICE_ROLE_KEY, corre las migraciones de
            supabase/migrations y vuelve a cargar.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "Productos",
                value: stats.products,
                icon: Package,
                href: "/admin/productos",
              },
              {
                label: "Pedidos por pagar",
                value: stats.pendingOrders,
                icon: ShoppingCart,
                href: "/admin/pedidos",
              },
              {
                label: "Pedidos pagados",
                value: stats.paidOrders,
                icon: Boxes,
                href: "/admin/pedidos",
              },
              {
                label: "Diseños listos p/ producción",
                value: stats.designsReady,
                icon: Palette,
                href: "/admin/disenos",
              },
            ].map((card) => (
              <Link
                key={card.label}
                href={card.href}
                className="glass rounded-2xl p-5 transition hover:border-ml-violet/40"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ml-violet/15 text-ml-violet">
                  <card.icon className="h-5 w-5" aria-hidden />
                </span>
                <p className="mt-4 text-3xl font-bold">{card.value}</p>
                <p className="mt-1 text-sm text-ml-white/60">{card.label}</p>
              </Link>
            ))}
          </div>

          <section className="glass mt-8 rounded-2xl p-6">
            <h2 className="mb-4 text-lg font-semibold">Pedidos recientes</h2>
            {stats.recentOrders.length === 0 ? (
              <p className="text-sm text-ml-white/55">
                Todavía no hay pedidos. Cuando un cliente complete el checkout
                aparecerán aquí.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase text-ml-white/45">
                    <tr>
                      <th className="pb-3 pr-4">Pedido</th>
                      <th className="pb-3 pr-4">Cliente</th>
                      <th className="pb-3 pr-4">Total</th>
                      <th className="pb-3 pr-4">Pago</th>
                      <th className="pb-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {stats.recentOrders.map((order) => (
                      <tr key={order.id}>
                        <td className="py-3 pr-4 font-mono text-ml-violet">
                          {order.order_number}
                        </td>
                        <td className="py-3 pr-4">{order.customer_name}</td>
                        <td className="py-3 pr-4 font-semibold">
                          {formatPrice(order.total)}
                        </td>
                        <td className="py-3 pr-4">
                          <StatusBadge status={order.payment_status} />
                        </td>
                        <td className="py-3">
                          <StatusBadge status={order.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </AdminLayout>
  );
}

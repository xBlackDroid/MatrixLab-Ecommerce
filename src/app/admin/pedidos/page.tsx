import type { Metadata } from "next";
import { TriangleAlert } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import OrdersTable, {
  type OrderWithItems,
} from "@/components/admin/OrdersTable";
import { getServiceClient } from "@/lib/db/admin";
import { requireAdminPage } from "@/lib/security/admin-auth";
import { ORDER_STATUSES } from "@/lib/validation/store";

export const metadata: Metadata = {
  title: "Pedidos | MatrixLab Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const admin = await requireAdminPage();
  const { status } = await searchParams;

  // Filtro por whitelist; valores extraños se ignoran.
  const statusFilter =
    status && (ORDER_STATUSES as readonly string[]).includes(status)
      ? status
      : null;

  const client = getServiceClient();
  let orders: OrderWithItems[] = [];
  if (client) {
    let query = client
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (statusFilter) query = query.eq("status", statusFilter);
    const { data } = await query;
    orders = (data ?? []) as OrderWithItems[];
  }

  return (
    <AdminLayout
      title="Pedidos"
      description="Pagos vía Mercado Pago, estados de producción y datos de contacto."
    >
      {!client ? (
        <div className="glass flex items-start gap-3 rounded-2xl p-6 text-sm text-ml-coral">
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          Base de datos no configurada.
        </div>
      ) : (
        <OrdersTable
          orders={orders}
          csrf={admin.csrf}
          currentFilter={statusFilter}
        />
      )}
    </AdminLayout>
  );
}

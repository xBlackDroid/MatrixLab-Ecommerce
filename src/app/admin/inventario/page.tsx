import type { Metadata } from "next";
import { TriangleAlert } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import InventoryTable, {
  type InventoryRow,
  type MovementRow,
} from "@/components/admin/InventoryTable";
import { requireAdminPage } from "@/lib/security/admin-auth";
import { isSupabaseConfigured } from "@/lib/security/env";
import { listInventory, listMovements } from "@/lib/store/inventory";

export const metadata: Metadata = {
  title: "Inventario | MatrixLab Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminInventarioPage() {
  const admin = await requireAdminPage();

  let inventory: InventoryRow[] = [];
  let movements: MovementRow[] = [];
  const configured = isSupabaseConfigured();
  if (configured) {
    [inventory, movements] = await Promise.all([
      listInventory() as Promise<InventoryRow[]>,
      listMovements(60) as Promise<MovementRow[]>,
    ]);
  }

  return (
    <AdminLayout
      title="Inventario"
      description="Stock por variante, estados y movimientos auditados."
    >
      {!configured ? (
        <div className="glass flex items-start gap-3 rounded-2xl p-6 text-sm text-ml-coral">
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          Base de datos no configurada.
        </div>
      ) : (
        <InventoryTable
          inventory={inventory}
          movements={movements}
          csrf={admin.csrf}
        />
      )}
    </AdminLayout>
  );
}

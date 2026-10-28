import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/security/admin-auth";
import { requireFeature } from "@/lib/consignments/server";
import AdminLayout from "@/components/admin/AdminLayout";
import Directory from "@/components/consignments/Directory";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Distribuidores | MatrixLab", robots: { index: false, follow: false } };
export default async function Page() {
  requireFeature(); const s = await requireAdminPage();
  return <AdminLayout title="Distribuidores" description="Consignaciones, ventas y pagos. Alta gradual de las piezas que entregas."><Directory csrf={s.csrf} /></AdminLayout>;
}

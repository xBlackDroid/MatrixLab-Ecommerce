import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/security/admin-auth";
import AdminLayout from "@/components/admin/AdminLayout";
import BazarWorkspace from "@/components/bazar/BazarWorkspace";
import { mexicoDate } from "@/lib/bazar/domain";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Bazar | MatrixLab", robots: { index: false, follow: false } };
export default async function Page() {
  const session = await requireAdminPage();
  return <AdminLayout title="Bazar" description="Lo que llevamos, lo que vendemos y lo que queda. Todos los importes en MXN."><BazarWorkspace csrf={session.csrf} today={mexicoDate()} /></AdminLayout>;
}

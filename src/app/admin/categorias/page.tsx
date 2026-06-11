import type { Metadata } from "next";
import { TriangleAlert } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import CategoriesAdminClient from "@/components/admin/CategoriesAdminClient";
import { getServiceClient } from "@/lib/db/admin";
import type { CategoryRow } from "@/lib/db/types";
import { requireAdminPage } from "@/lib/security/admin-auth";

export const metadata: Metadata = {
  title: "Categorías | MatrixLab Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminCategoriasPage() {
  const admin = await requireAdminPage();
  const client = getServiceClient();

  let categories: CategoryRow[] = [];
  if (client) {
    const { data } = await client
      .from("categories")
      .select("*")
      .order("sort_order");
    categories = (data ?? []) as CategoryRow[];
  }

  return (
    <AdminLayout
      title="Categorías"
      description="Organiza el catálogo de la tienda."
    >
      {!client ? (
        <div className="glass flex items-start gap-3 rounded-2xl p-6 text-sm text-ml-coral">
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          Base de datos no configurada.
        </div>
      ) : (
        <CategoriesAdminClient categories={categories} csrf={admin.csrf} />
      )}
    </AdminLayout>
  );
}

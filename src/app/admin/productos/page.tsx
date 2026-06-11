import type { Metadata } from "next";
import { TriangleAlert } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import ProductsAdminClient from "@/components/admin/ProductsAdminClient";
import type { ProductWithRelations } from "@/components/admin/ProductEditor";
import { getServiceClient } from "@/lib/db/admin";
import type { CategoryRow } from "@/lib/db/types";
import { requireAdminPage } from "@/lib/security/admin-auth";

export const metadata: Metadata = {
  title: "Productos | MatrixLab Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminProductosPage() {
  const admin = await requireAdminPage();
  const client = getServiceClient();

  let products: ProductWithRelations[] = [];
  let categories: CategoryRow[] = [];
  if (client) {
    const [productsRes, categoriesRes] = await Promise.all([
      client
        .from("products")
        .select("*, product_variants(*), categories(id, title, handle)")
        .order("created_at", { ascending: false }),
      client.from("categories").select("*").order("sort_order"),
    ]);
    products = (productsRes.data ?? []) as ProductWithRelations[];
    categories = (categoriesRes.data ?? []) as CategoryRow[];
  }

  return (
    <AdminLayout
      title="Productos"
      description="Catálogo completo: crea, edita, controla estados y variantes."
    >
      {!client ? (
        <div className="glass flex items-start gap-3 rounded-2xl p-6 text-sm text-ml-coral">
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          Base de datos no configurada.
        </div>
      ) : (
        <ProductsAdminClient
          products={products}
          categories={categories}
          csrf={admin.csrf}
        />
      )}
    </AdminLayout>
  );
}

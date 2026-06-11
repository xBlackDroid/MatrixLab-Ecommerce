import type { Metadata } from "next";
import { TriangleAlert } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import DesignProjectCard, {
  type AdminDesignView,
} from "@/components/admin/DesignProjectCard";
import { getServiceClient } from "@/lib/db/admin";
import { BUCKETS, createSignedUrl } from "@/lib/db/storage";
import type { DesignProjectRow } from "@/lib/db/types";
import { requireAdminPage } from "@/lib/security/admin-auth";

export const metadata: Metadata = {
  title: "Diseños | MatrixLab Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminDisenosPage() {
  const admin = await requireAdminPage();
  const client = getServiceClient();

  let views: AdminDesignView[] = [];
  if (client) {
    const { data } = await client
      .from("design_projects")
      .select("*, orders(order_number)")
      .neq("status", "draft")
      .order("updated_at", { ascending: false })
      .limit(60);

    const designs = (data ?? []) as Array<
      DesignProjectRow & { orders: { order_number: string } | null }
    >;

    // URLs firmadas de corta duración para preview y archivo original.
    views = await Promise.all(
      designs.map(async (row) => {
        const { orders, ...design } = row;
        const [previewSignedUrl, originalSignedUrl] = await Promise.all([
          createSignedUrl(BUCKETS.designPreviews, design.preview_url, 3600),
          createSignedUrl(BUCKETS.designAssets, design.uploaded_asset_url, 3600),
        ]);
        return {
          design: design as DesignProjectRow,
          previewSignedUrl,
          originalSignedUrl,
          orderNumber: orders?.order_number ?? null,
        };
      }),
    );
  }

  return (
    <AdminLayout
      title="Diseños personalizados"
      description="Previews, archivos originales, coordenadas y estados de producción."
    >
      {!client ? (
        <div className="glass flex items-start gap-3 rounded-2xl p-6 text-sm text-ml-coral">
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          Base de datos no configurada.
        </div>
      ) : views.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center text-ml-white/55">
          Aún no hay diseños de clientes. Cuando alguien guarde un diseño en el
          laboratorio aparecerá aquí.
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {views.map((view) => (
            <DesignProjectCard key={view.design.id} view={view} csrf={admin.csrf} />
          ))}
        </div>
      )}
    </AdminLayout>
  );
}

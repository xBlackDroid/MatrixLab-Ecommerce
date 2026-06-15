import type { Metadata } from "next";
import { TriangleAlert } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import DesignProjectCard, {
  type AdminDesignAsset,
  type AdminDesignView,
} from "@/components/admin/DesignProjectCard";
import { getServiceClient } from "@/lib/db/admin";
import { BUCKETS, createSignedUrl } from "@/lib/db/storage";
import type { DesignProjectRow, UploadedAssetRow } from "@/lib/db/types";
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
      .limit(80);

    const designs = (data ?? []) as Array<
      DesignProjectRow & { orders: { order_number: string } | null }
    >;

    // Archivos originales por diseño (v2 puede tener varios).
    const ids = designs.map((d) => d.id);
    const assetsByDesign = new Map<string, UploadedAssetRow[]>();
    if (ids.length > 0) {
      const { data: assetData } = await client
        .from("uploaded_assets")
        .select("*")
        .in("design_project_id", ids);
      for (const asset of (assetData ?? []) as UploadedAssetRow[]) {
        const list = assetsByDesign.get(asset.design_project_id) ?? [];
        list.push(asset);
        assetsByDesign.set(asset.design_project_id, list);
      }
    }

    views = await Promise.all(
      designs.map(async (row) => {
        const { orders, ...design } = row;
        const rawAssets = assetsByDesign.get(design.id) ?? [];
        const [previewSignedUrl, assets] = await Promise.all([
          createSignedUrl(BUCKETS.designPreviews, design.preview_url, 3600),
          Promise.all(
            rawAssets.map(async (asset) => ({
              id: asset.id,
              fileName: asset.original_file_name,
              signedUrl: await createSignedUrl(
                BUCKETS.designAssets,
                asset.original_file_url,
                3600,
              ),
            })),
          ),
        ]);
        // Respaldo: si no hay assets en la tabla, usa el del diseño (v1).
        const fallbackOriginal =
          assets.length === 0
            ? await createSignedUrl(
                BUCKETS.designAssets,
                design.uploaded_asset_url,
                3600,
              )
            : null;
        return {
          design: design as DesignProjectRow,
          previewSignedUrl,
          assets: assets as AdminDesignAsset[],
          fallbackOriginalUrl: fallbackOriginal,
          orderNumber: orders?.order_number ?? null,
        };
      }),
    );
  }

  return (
    <AdminLayout
      title="Diseños personalizados"
      description="Prendas, planillas y láser: previews, archivos originales, datos de producción y estados."
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

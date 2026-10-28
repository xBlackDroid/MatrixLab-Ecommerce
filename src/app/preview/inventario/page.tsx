import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Eye } from "lucide-react";
import InventoryTable from "@/components/admin/InventoryTable";
import { presentInventoryEntries } from "@/lib/store/inventory-presentation";
import {
  isInventoryPreviewEnabled,
  SAMPLE_INVENTORY_ENTRIES,
  SAMPLE_MOVEMENTS,
} from "./sample";

export const metadata: Metadata = {
  title: "Vista previa · Inventario | MatrixLab Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Vista previa de Inventario con DATOS DE MUESTRA. No lee base, no usa la
 * service role, no tiene sesión admin ni token CSRF: la tabla va en modo
 * `readOnly` y nunca llama a la API. `/admin/inventario` sigue protegido.
 */
export default function InventarioPreviewPage() {
  if (!isInventoryPreviewEnabled()) notFound();

  const inventory = presentInventoryEntries(SAMPLE_INVENTORY_ENTRIES);

  return (
    <div className="min-h-screen">
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <p
          role="status"
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-ml-violet/40 bg-ml-violet/10 px-4 py-2 text-sm font-medium text-ml-violet"
        >
          <Eye className="h-4 w-4 shrink-0" aria-hidden />
          Datos de muestra · Solo lectura
        </p>
        <div className="mb-7">
          <h1 className="text-2xl font-bold sm:text-3xl">Inventario</h1>
          <p className="mt-1.5 text-sm text-ml-white/60">
            Stock por variante, estados y movimientos auditados.
          </p>
        </div>
        <InventoryTable
          inventory={inventory}
          movements={SAMPLE_MOVEMENTS}
          csrf=""
          readOnly
        />
      </main>
    </div>
  );
}

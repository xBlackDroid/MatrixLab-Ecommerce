"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Download, ImageOff } from "lucide-react";
import { toast } from "sonner";
import StatusBadge from "@/components/admin/StatusBadge";
import type { DesignProjectRow } from "@/lib/db/types";
import { ADMIN_DESIGN_STATUSES } from "@/lib/validation/admin";

const CSRF_HEADER = "x-ml-csrf";

export interface AdminDesignView {
  design: DesignProjectRow;
  previewSignedUrl: string | null;
  originalSignedUrl: string | null;
  orderNumber: string | null;
}

export default function DesignProjectCard({
  view,
  csrf,
}: {
  view: AdminDesignView;
  csrf: string;
}) {
  const router = useRouter();
  const { design } = view;
  const [busy, setBusy] = useState(false);

  async function updateStatus(status: string) {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/designs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", [CSRF_HEADER]: csrf },
        body: JSON.stringify({ designId: design.id, status }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        toast.error(data?.error ?? "No pudimos actualizar el diseño.");
        return;
      }
      toast.success("Estado del diseño actualizado");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="glass flex flex-col overflow-hidden rounded-2xl">
      <div className="relative aspect-square w-full bg-white/5">
        {view.previewSignedUrl ? (
          <Image
            src={view.previewSignedUrl}
            alt={`Diseño ${design.product_type}`}
            fill
            unoptimized
            sizes="(max-width: 640px) 100vw, 320px"
            className="object-contain"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-ml-white/30">
            <ImageOff className="h-10 w-10" aria-hidden />
          </div>
        )}
        <span className="absolute left-3 top-3">
          <StatusBadge status={design.status} />
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4 text-sm">
        <div className="flex items-center justify-between gap-2">
          <p className="font-bold capitalize">{design.product_type}</p>
          <p className="font-mono text-xs text-ml-white/45">
            {design.id.slice(0, 8)}
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-ml-white/65">
          {design.base_color && (
            <>
              <dt className="text-ml-white/40">Color</dt>
              <dd>{design.base_color}</dd>
            </>
          )}
          {design.selected_size && (
            <>
              <dt className="text-ml-white/40">Talla</dt>
              <dd>{design.selected_size}</dd>
            </>
          )}
          <dt className="text-ml-white/40">Zona</dt>
          <dd>{design.print_zone}</dd>
          <dt className="text-ml-white/40">Posición</dt>
          <dd>
            x {Number(design.position_x).toFixed(0)} · y{" "}
            {Number(design.position_y).toFixed(0)}
          </dd>
          <dt className="text-ml-white/40">Escala</dt>
          <dd>{Number(design.scale).toFixed(2)}×</dd>
          <dt className="text-ml-white/40">Rotación</dt>
          <dd>{Number(design.rotation).toFixed(0)}°</dd>
          {view.orderNumber && (
            <>
              <dt className="text-ml-white/40">Pedido</dt>
              <dd className="font-mono text-ml-violet">{view.orderNumber}</dd>
            </>
          )}
        </dl>

        {design.customer_notes && (
          <p className="rounded-lg bg-white/5 px-3 py-2 text-xs text-ml-white/70">
            <span className="text-ml-white/45">Notas del cliente:</span>{" "}
            {design.customer_notes}
          </p>
        )}

        <div className="mt-auto flex flex-col gap-2 pt-1">
          {view.originalSignedUrl && (
            <a
              href={view.originalSignedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-ml-cyan/40 bg-ml-cyan/10 px-4 py-2 text-xs font-semibold text-ml-cyan transition hover:bg-ml-cyan/20"
            >
              <Download className="h-3.5 w-3.5" aria-hidden />
              Descargar archivo original
            </a>
          )}
          <select
            value={design.status}
            disabled={busy}
            onChange={(event) => updateStatus(event.target.value)}
            className="w-full rounded-full border border-white/15 bg-ml-bg px-3 py-2 text-xs outline-none transition focus:border-ml-violet"
          >
            {/* El estado actual puede no estar en la whitelist asignable */}
            {!(ADMIN_DESIGN_STATUSES as readonly string[]).includes(
              design.status,
            ) && (
              <option value={design.status} className="bg-ml-bg" disabled>
                {design.status}
              </option>
            )}
            {ADMIN_DESIGN_STATUSES.map((status) => (
              <option key={status} value={status} className="bg-ml-bg">
                {status === "in_review"
                  ? "revisando"
                  : status === "in_production"
                    ? "producción"
                    : status === "completed"
                      ? "listo"
                      : "listo p/ producción"}
              </option>
            ))}
          </select>
        </div>
      </div>
    </article>
  );
}

"use client";

import { Fragment, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronDown, Code2, Download, ImageOff } from "lucide-react";
import { toast } from "sonner";
import StatusBadge from "@/components/admin/StatusBadge";
import type { DesignProjectRow } from "@/lib/db/types";
import { getDesignerDisplayName } from "@/lib/designer/product-catalog";
import { ADMIN_DESIGN_STATUSES } from "@/lib/validation/admin";

const CSRF_HEADER = "x-ml-csrf";

export interface AdminDesignAsset {
  id: string;
  fileName: string;
  signedUrl: string | null;
}

export interface AdminDesignView {
  design: DesignProjectRow;
  previewSignedUrl: string | null;
  assets: AdminDesignAsset[];
  fallbackOriginalUrl: string | null;
  orderNumber: string | null;
}

const FAMILY_LABELS: Record<string, string> = {
  garment: "Prenda",
  sheet: "Planilla",
  laser: "Láser",
};

/**
 * Extrae datos de producción legibles del design_json para el admin, sin
 * confiar en su forma exacta (los diseños v1 y v2 conviven). Devuelve filas
 * [etiqueta, valor] que se muestran junto a color/perfil/talla.
 */
function extractProductionDetails(
  json: Record<string, unknown> | null,
): Array<[string, string]> {
  if (!json || typeof json !== "object") return [];
  const rows: Array<[string, string]> = [];
  const designerType = json.designerType;

  if (designerType === "laser") {
    const w = Number(json.widthCm);
    const h = Number(json.heightCm);
    if (Number.isFinite(w) && Number.isFinite(h)) {
      rows.push(["Dimensiones", `${w} × ${h} cm`]);
    }
    if (typeof json.templateId === "string") {
      rows.push(["Plantilla", json.templateId]);
    }
  } else if (designerType === "sheet") {
    if (json.mode === "free" && Array.isArray(json.assets)) {
      rows.push(["Piezas", String(json.assets.length)]);
    } else if (json.mode === "repeat") {
      if (typeof json.shape === "string") rows.push(["Forma", json.shape]);
      const size = json.pieceSizeCm as
        | { width?: number; height?: number }
        | undefined;
      if (size && Number.isFinite(size.width) && Number.isFinite(size.height)) {
        rows.push(["Tamaño", `${size.width} × ${size.height} cm`]);
      }
      if (Number.isFinite(Number(json.count))) {
        rows.push(["Piezas", String(json.count)]);
      }
    }
  } else if (designerType === "garment") {
    const views = json.views as
      | { front?: { assets?: unknown[] }; back?: { assets?: unknown[] } }
      | undefined;
    const front = views?.front?.assets?.length ?? 0;
    const back = views?.back?.assets?.length ?? 0;
    if (front || back) rows.push(["Frente/Espalda", `${front} / ${back}`]);
  }
  return rows;
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
  const [showJson, setShowJson] = useState(false);

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

  const family = design.designer_type
    ? (FAMILY_LABELS[design.designer_type] ?? design.designer_type)
    : "Diseño";
  const downloads = view.assets.filter((a) => a.signedUrl);
  const displayName =
    getDesignerDisplayName(design.product_type) ??
    design.product_type.replace(/-/g, " ");
  const productionDetails = extractProductionDetails(design.design_json);

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
        <span className="absolute right-3 top-3 rounded-full border border-white/20 bg-ml-bg/80 px-2 py-0.5 text-[11px] font-semibold text-ml-white/75">
          {family}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4 text-sm">
        <div className="flex items-center justify-between gap-2">
          <p className="font-bold">{displayName}</p>
          <p className="font-mono text-xs text-ml-white/45">
            {design.id.slice(0, 8)}
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-ml-white/65">
          {design.base_color && (
            <>
              <dt className="text-ml-white/40">Color</dt>
              <dd className="capitalize">{design.base_color.replace(/-/g, " ")}</dd>
            </>
          )}
          {design.profile && (
            <>
              <dt className="text-ml-white/40">Perfil</dt>
              <dd className="capitalize">{design.profile}</dd>
            </>
          )}
          {design.selected_size && (
            <>
              <dt className="text-ml-white/40">Talla</dt>
              <dd>{design.selected_size}</dd>
            </>
          )}
          {productionDetails.map(([label, value]) => (
            <Fragment key={label}>
              <dt className="text-ml-white/40">{label}</dt>
              <dd className="capitalize">{value}</dd>
            </Fragment>
          ))}
          <dt className="text-ml-white/40">Archivos</dt>
          <dd>{downloads.length || (view.fallbackOriginalUrl ? 1 : 0)}</dd>
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
          {downloads.map((asset) => (
            <a
              key={asset.id}
              href={asset.signedUrl ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 truncate rounded-full border border-ml-cyan/40 bg-ml-cyan/10 px-4 py-2 text-xs font-semibold text-ml-cyan transition hover:bg-ml-cyan/20"
            >
              <Download className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="truncate">{asset.fileName}</span>
            </a>
          ))}
          {downloads.length === 0 && view.fallbackOriginalUrl && (
            <a
              href={view.fallbackOriginalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-ml-cyan/40 bg-ml-cyan/10 px-4 py-2 text-xs font-semibold text-ml-cyan transition hover:bg-ml-cyan/20"
            >
              <Download className="h-3.5 w-3.5" aria-hidden />
              Descargar archivo original
            </a>
          )}

          {design.design_json && (
            <div>
              <button
                type="button"
                onClick={() => setShowJson((v) => !v)}
                className="inline-flex w-full items-center justify-between gap-1.5 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-ml-white/70 transition hover:border-white/30"
              >
                <span className="inline-flex items-center gap-1.5">
                  <Code2 className="h-3.5 w-3.5" aria-hidden />
                  JSON de producción
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 transition ${showJson ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </button>
              {showJson && (
                <pre className="mt-2 max-h-56 overflow-auto rounded-lg bg-black/40 p-3 text-[10px] leading-relaxed text-ml-white/70">
                  {JSON.stringify(design.design_json, null, 2)}
                </pre>
              )}
            </div>
          )}

          <select
            value={design.status}
            disabled={busy}
            onChange={(event) => updateStatus(event.target.value)}
            className="w-full rounded-full border border-white/15 bg-ml-bg px-3 py-2 text-xs outline-none transition focus:border-ml-violet"
          >
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

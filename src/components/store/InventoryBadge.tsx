import { cn } from "@/lib/utils";
import type { ProductStatus, VariantStatus } from "@/lib/db/types";

const BADGE_STYLES: Record<string, { label: string; className: string }> = {
  disponible: {
    label: "Disponible",
    className: "border-ml-cyan/40 bg-ml-cyan/10 text-ml-cyan",
  },
  agotado: {
    label: "Agotado",
    className: "border-ml-coral/40 bg-ml-coral/10 text-ml-coral",
  },
  sobre_pedido: {
    label: "Sobre pedido",
    className: "border-ml-violet/40 bg-ml-violet/10 text-ml-violet",
  },
  proximamente: {
    label: "Próximamente",
    className: "border-white/20 bg-white/5 text-ml-white/70",
  },
};

export default function InventoryBadge({
  status,
  className,
}: {
  status: ProductStatus | VariantStatus;
  className?: string;
}) {
  const badge = BADGE_STYLES[status];
  if (!badge) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        badge.className,
        className,
      )}
    >
      {badge.label}
    </span>
  );
}

export function CustomizableBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-ml-violet/40 bg-ml-violet/10 px-2.5 py-0.5 text-xs font-medium text-ml-violet",
        className,
      )}
    >
      Personalizable
    </span>
  );
}

export function VolumeBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-xs font-medium text-ml-white/70",
        className,
      )}
    >
      Volumen disponible
    </span>
  );
}

import StatusBadge from "@/components/ui/StatusBadge";
import Badge from "@/components/ui/Badge";
import type { ProductStatus, VariantStatus } from "@/lib/db/types";

export default function InventoryBadge({
  status,
  className,
}: {
  status: ProductStatus | VariantStatus;
  className?: string;
}) {
  return <StatusBadge status={status} className={className} />;
}

export function CustomizableBadge({ className }: { className?: string }) {
  return (
    <Badge tone="accent" className={className}>
      Personalizable
    </Badge>
  );
}

export function VolumeBadge({ className }: { className?: string }) {
  return (
    <Badge className={className}>
      Volumen disponible
    </Badge>
  );
}

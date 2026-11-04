import Badge from "@/components/ui/Badge";
import { presentStatus } from "@/lib/ui/status";
import { cn } from "@/lib/utils";

/** Presentation for existing statuses; allowed transitions belong to the domain. */
export default function StatusBadge({ status, className }: { status: string; className?: string }) {
  const { label, tone } = presentStatus(status);
  return (
    <Badge tone={tone} className={cn("whitespace-nowrap", className)}>
      {label}
    </Badge>
  );
}

import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

/** Long copy is available inside its own item, without filling the mobile catalog. */
export default function ProductDescription({ children }: { children: ReactNode }) {
  return <><details className="product-description sm:hidden"><summary className="flex min-h-11 cursor-pointer items-center justify-between gap-2 text-xs font-medium text-ui-text-muted">Detalles<ChevronDown aria-hidden className="h-3.5 w-3.5" /></summary><div className="space-y-2 pb-2 text-sm leading-relaxed text-ui-text-muted">{children}</div></details><div className="hidden sm:contents">{children}</div></>;
}

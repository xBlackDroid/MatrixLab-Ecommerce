"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Mobile shopping direction; desktop, editing and payment keep their existing shell. */
export default function StoreAppearance({ children, className = "" }: { children: ReactNode; className?: string }) {
  const pathname = usePathname();
  const shopping = !pathname.startsWith("/tienda/disenador") && !pathname.startsWith("/tienda/checkout");
  return <div className={`store-shell ${shopping ? "studio-store" : ""} ${className}`}>{children}</div>;
}

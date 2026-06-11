"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";

export const CART_UPDATED_EVENT = "ml:cart-updated";

/** Notifica a la UI (badge) que el carrito cambió. */
export function emitCartUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT));
  }
}

export default function CartBadge() {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/cart", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setCount(data?.cart?.count ?? 0);
    } catch {
      // Silencioso: el badge es decorativo.
    }
  }, []);

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener(CART_UPDATED_EVENT, handler);
    return () => window.removeEventListener(CART_UPDATED_EVENT, handler);
  }, [refresh]);

  return (
    <Link
      href="/tienda/carrito"
      aria-label={`Carrito (${count} piezas)`}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-ml-white transition hover:border-ml-violet/60 hover:text-ml-violet"
    >
      <ShoppingBag className="h-5 w-5" aria-hidden />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-ml-coral px-1 text-[11px] font-bold text-ml-bg">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}

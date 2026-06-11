"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import type { CartView } from "@/lib/db/types";
import { emitCartUpdated } from "@/components/store/CartBadge";
import CartLineItem from "@/components/store/CartLineItem";
import CartSummary from "@/components/store/CartSummary";

export default function CartPageClient() {
  const [cart, setCart] = useState<CartView | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyItem, setBusyItem] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/cart", { cache: "no-store" });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok) setCart(data.cart as CartView);
    } catch {
      toast.error("No pudimos cargar tu carrito.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function mutate(
    itemId: string,
    request: () => Promise<Response>,
  ): Promise<void> {
    setBusyItem(itemId);
    try {
      const res = await request();
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        toast.error(data?.error ?? "No pudimos actualizar tu carrito.");
        await load();
        return;
      }
      setCart(data.cart as CartView);
      emitCartUpdated();
    } catch {
      toast.error("Sin conexión. Intenta de nuevo.");
    } finally {
      setBusyItem(null);
    }
  }

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    mutate(itemId, () =>
      fetch(`/api/cart/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      }),
    );
  };

  const handleRemove = (itemId: string) => {
    mutate(itemId, () =>
      fetch(`/api/cart/items/${itemId}`, { method: "DELETE" }),
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-ml-violet" aria-hidden />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="glass mx-auto flex max-w-lg flex-col items-center gap-5 rounded-3xl p-12 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-ml-violet/15 text-ml-violet">
          <ShoppingBag className="h-8 w-8" aria-hidden />
        </span>
        <h2 className="text-2xl font-bold">Tu carrito está vacío</h2>
        <p className="text-ml-white/60">
          Explora el catálogo o diseña tu propia pieza en el laboratorio
          creativo.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/tienda"
            className="rounded-full bg-ml-violet px-6 py-3 font-semibold text-ml-bg transition hover:bg-ml-violet/90"
          >
            Explorar catálogo
          </Link>
          <Link
            href="/tienda/disenador"
            className="glass rounded-full px-6 py-3 font-semibold transition hover:border-ml-cyan/50 hover:text-ml-cyan"
          >
            Abrir diseñador
          </Link>
        </div>
      </div>
    );
  }

  const canCheckout = cart.items.every((line) => line.availability === "ok");

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div className="flex flex-col gap-4">
        {cart.items.map((line) => (
          <CartLineItem
            key={line.id}
            line={line}
            busy={busyItem === line.id}
            onUpdateQuantity={handleUpdateQuantity}
            onRemove={handleRemove}
          />
        ))}
        {!canCheckout && (
          <p className="glass rounded-xl px-4 py-3 text-sm text-ml-coral">
            Hay productos sin disponibilidad en tu carrito. Ajusta cantidades o
            elimínalos para continuar.
          </p>
        )}
      </div>
      <CartSummary
        totals={cart.totals}
        count={cart.count}
        canCheckout={canCheckout}
      />
    </div>
  );
}

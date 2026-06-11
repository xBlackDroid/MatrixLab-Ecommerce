"use client";

import { useState } from "react";
import { Loader2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { emitCartUpdated } from "@/components/store/CartBadge";
import { cn } from "@/lib/utils";

interface AddToCartButtonProps {
  productId: string;
  variantId?: string | null;
  quantity: number;
  designProjectId?: string | null;
  disabled?: boolean;
  label?: string;
  className?: string;
  onAdded?: () => void;
}

export default function AddToCartButton({
  productId,
  variantId,
  quantity,
  designProjectId,
  disabled,
  label = "Agregar al carrito",
  className,
  onAdded,
}: AddToCartButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleAdd() {
    if (loading || disabled) return;
    setLoading(true);
    try {
      const res = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          ...(variantId ? { variantId } : {}),
          quantity,
          ...(designProjectId ? { designProjectId } : {}),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        toast.error(data?.error ?? "No pudimos agregarlo. Intenta de nuevo.");
        return;
      }
      emitCartUpdated();
      toast.success("Agregado al carrito");
      onAdded?.();
    } catch {
      toast.error("Sin conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={disabled || loading}
      className={cn(
        "inline-flex w-full items-center justify-center gap-2 rounded-full bg-ml-violet px-6 py-3.5 text-base font-semibold text-ml-bg shadow-glow-violet transition hover:bg-ml-violet/90 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none",
        className,
      )}
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
      ) : (
        <ShoppingBag className="h-5 w-5" aria-hidden />
      )}
      {label}
    </button>
  );
}

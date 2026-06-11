"use client";

import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

/** Lleva al formulario de checkout (el pago se procesa con Mercado Pago). */
export default function CheckoutButton({
  disabled,
  className,
}: {
  disabled?: boolean;
  className?: string;
}) {
  if (disabled) {
    return (
      <button
        type="button"
        disabled
        className={cn(
          "inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-full bg-ml-violet/40 px-6 py-4 font-semibold text-ml-bg/70",
          className,
        )}
      >
        <Lock className="h-5 w-5" aria-hidden />
        Finalizar compra
      </button>
    );
  }
  return (
    <Link
      href="/tienda/checkout"
      className={cn(
        "inline-flex w-full items-center justify-center gap-2 rounded-full bg-ml-violet px-6 py-4 font-semibold text-ml-bg shadow-glow-violet transition hover:bg-ml-violet/90",
        className,
      )}
    >
      Finalizar compra
      <ArrowRight className="h-5 w-5" aria-hidden />
    </Link>
  );
}

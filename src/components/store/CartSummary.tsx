"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import type { CartTotals } from "@/lib/db/types";
import { formatPrice } from "@/lib/utils";
import CheckoutButton from "@/components/store/CheckoutButton";

export default function CartSummary({
  totals,
  count,
  canCheckout,
}: {
  totals: CartTotals;
  count: number;
  canCheckout: boolean;
}) {
  return (
    <aside className="glass sticky top-24 flex flex-col gap-4 rounded-2xl p-6">
      <h2 className="text-lg font-semibold">Resumen</h2>
      <div className="flex flex-col gap-2 text-sm">
        <div className="flex justify-between text-ml-white/70">
          <span>
            Subtotal estimado ({count} {count === 1 ? "pieza" : "piezas"})
          </span>
          <span className="font-medium text-ml-white">
            {formatPrice(totals.subtotal)}
          </span>
        </div>
        <div className="flex justify-between text-ml-white/70">
          <span>Envío</span>
          <span>Se coordina al confirmar</span>
        </div>
        <div className="mt-2 flex justify-between border-t border-white/10 pt-3 text-base font-bold">
          <span>Total</span>
          <span>{formatPrice(totals.total)} MXN</span>
        </div>
      </div>

      <CheckoutButton disabled={!canCheckout} />
      <Link
        href="/tienda"
        className="inline-flex w-full items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-ml-white/85 transition hover:border-white/30"
      >
        Seguir comprando
      </Link>

      <p className="flex items-start gap-2 text-xs text-ml-white/50">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-ml-cyan" aria-hidden />
        Pago seguro procesado por Mercado Pago. Los precios se confirman en
        nuestro servidor al finalizar la compra.
      </p>
    </aside>
  );
}

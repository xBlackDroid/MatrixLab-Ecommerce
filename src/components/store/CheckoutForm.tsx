"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CreditCard, Loader2, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import type { CartView } from "@/lib/db/types";
import { formatPrice } from "@/lib/utils";

/** Validación cliente (espejo de CheckoutSchema del servidor, sin cartId). */
const CheckoutFormSchema = z.object({
  customerName: z
    .string()
    .min(2, "Escribe tu nombre completo.")
    .max(80, "Máximo 80 caracteres."),
  customerEmail: z
    .union([z.literal(""), z.email("Correo inválido.")])
    .optional(),
  customerPhone: z
    .string()
    .min(8, "Teléfono muy corto.")
    .max(20, "Teléfono muy largo.")
    .regex(/^[0-9+()\s-]+$/, "Solo números, espacios y + ( ) -."),
  notes: z.string().max(500, "Máximo 500 caracteres.").optional(),
});

type CheckoutFormValues = z.infer<typeof CheckoutFormSchema>;

export default function CheckoutForm() {
  const [cart, setCart] = useState<CartView | null>(null);
  const [loadingCart, setLoadingCart] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(CheckoutFormSchema),
    defaultValues: { customerName: "", customerEmail: "", customerPhone: "", notes: "" },
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/cart", { cache: "no-store" });
        const data = await res.json().catch(() => null);
        if (res.ok && data?.ok) setCart(data.cart as CartView);
      } finally {
        setLoadingCart(false);
      }
    })();
  }, []);

  async function onSubmit(values: CheckoutFormValues) {
    if (submitting) return;
    setSubmitting(true);
    try {
      // Garantizar carrito/cartId vigente (cookie httpOnly de sesión).
      const cartRes = await fetch("/api/cart", { method: "POST" });
      const cartData = await cartRes.json().catch(() => null);
      if (!cartRes.ok || !cartData?.cartId) {
        toast.error(cartData?.error ?? "No pudimos preparar tu pedido.");
        return;
      }

      const res = await fetch("/api/checkout/mercadopago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartId: cartData.cartId,
          customerName: values.customerName,
          customerEmail: values.customerEmail || undefined,
          customerPhone: values.customerPhone,
          notes: values.notes || undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok || !data.redirectUrl) {
        toast.error(
          data?.error ?? "No pudimos iniciar el pago. Intenta de nuevo.",
        );
        return;
      }
      // Redirección al checkout seguro de Mercado Pago.
      window.location.href = data.redirectUrl as string;
    } catch {
      toast.error("Sin conexión. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingCart) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-ml-violet" aria-hidden />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="glass mx-auto max-w-lg rounded-3xl p-12 text-center">
        <h2 className="text-2xl font-bold">Tu carrito está vacío</h2>
        <p className="mt-3 text-ml-white/60">
          Agrega productos antes de finalizar tu compra.
        </p>
        <Link
          href="/tienda"
          className="mt-6 inline-flex rounded-full bg-ml-violet px-6 py-3 font-semibold text-ml-bg transition hover:bg-ml-violet/90"
        >
          Explorar catálogo
        </Link>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-ml-white outline-none transition placeholder:text-ml-white/35 focus:border-ml-violet";

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="glass flex flex-col gap-5 rounded-2xl p-7"
        noValidate
      >
        <h2 className="text-xl font-semibold">Datos de contacto</h2>

        <div>
          <label htmlFor="customerName" className="mb-1.5 block text-sm text-ml-white/70">
            Nombre completo *
          </label>
          <input
            id="customerName"
            type="text"
            autoComplete="name"
            maxLength={80}
            placeholder="Tu nombre"
            className={inputClass}
            {...register("customerName")}
          />
          {errors.customerName && (
            <p className="mt-1 text-xs text-ml-coral">
              {errors.customerName.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="customerPhone" className="mb-1.5 block text-sm text-ml-white/70">
            WhatsApp / Teléfono *
          </label>
          <input
            id="customerPhone"
            type="tel"
            autoComplete="tel"
            maxLength={20}
            placeholder="55 1234 5678"
            className={inputClass}
            {...register("customerPhone")}
          />
          {errors.customerPhone && (
            <p className="mt-1 text-xs text-ml-coral">
              {errors.customerPhone.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="customerEmail" className="mb-1.5 block text-sm text-ml-white/70">
            Correo (opcional, para tu comprobante)
          </label>
          <input
            id="customerEmail"
            type="email"
            autoComplete="email"
            maxLength={120}
            placeholder="tu@correo.com"
            className={inputClass}
            {...register("customerEmail")}
          />
          {errors.customerEmail && (
            <p className="mt-1 text-xs text-ml-coral">
              {errors.customerEmail.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="notes" className="mb-1.5 block text-sm text-ml-white/70">
            Notas del pedido (opcional)
          </label>
          <textarea
            id="notes"
            rows={3}
            maxLength={500}
            placeholder="Detalles de entrega, colores, dudas…"
            className={inputClass}
            {...register("notes")}
          />
          {errors.notes && (
            <p className="mt-1 text-xs text-ml-coral">{errors.notes.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-ml-violet px-6 py-4 font-semibold text-ml-bg shadow-glow-violet transition hover:bg-ml-violet/90 disabled:opacity-50"
        >
          {submitting ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          ) : (
            <CreditCard className="h-5 w-5" aria-hidden />
          )}
          Pagar con Mercado Pago
        </button>

        <p className="flex items-start gap-2 text-xs text-ml-white/50">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-ml-cyan" aria-hidden />
          Serás redirigido al checkout seguro de Mercado Pago. Nosotros nunca
          vemos ni guardamos los datos de tu tarjeta.
        </p>

        <Link
          href="/tienda/carrito"
          className="inline-flex items-center gap-1.5 text-sm text-ml-white/60 transition hover:text-ml-violet"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Volver al carrito
        </Link>
      </form>

      <aside className="glass h-fit rounded-2xl p-6 lg:sticky lg:top-24">
        <h2 className="text-lg font-semibold">Tu pedido</h2>
        <ul className="mt-4 flex flex-col gap-3 text-sm">
          {cart.items.map((line) => (
            <li key={line.id} className="flex justify-between gap-3">
              <span className="text-ml-white/70">
                {line.quantity}× {line.title}
                {line.variantTitle ? ` (${line.variantTitle})` : ""}
                {line.isCustom ? " · Personalizado" : ""}
              </span>
              <span className="shrink-0 font-medium">
                {formatPrice(line.lineTotal)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t border-white/10 pt-4 font-bold">
          <span>Total</span>
          <span>{formatPrice(cart.totals.total)} MXN</span>
        </div>
        <p className="mt-3 text-xs text-ml-white/50">
          El total se confirma en nuestro servidor antes de generar tu pago.
        </p>
      </aside>
    </div>
  );
}

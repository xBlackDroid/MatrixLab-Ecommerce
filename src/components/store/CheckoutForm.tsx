"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CreditCard, Loader2, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import type { CartView } from "@/lib/db/types";
import { normalizeMexicanPhone } from "@/lib/validation/checkout";
import { formatPrice, formatUnitQuantity } from "@/lib/utils";

/**
 * Validación cliente (espejo de CheckoutSchema del servidor, sin cartId).
 *
 * Es sólo para dar errores rápidos junto al campo: quien decide es el
 * servidor, que revalida todo antes de crear el pedido. Si estos mensajes y
 * los de `src/lib/validation/checkout.ts` divergen, manda el servidor.
 */
const requerido = (campo: string, max: number) =>
  z.string().trim().min(1, `${campo} es obligatorio.`).max(max, `Máximo ${max} caracteres.`);

const CheckoutFormSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, "Escribe tu nombre completo.")
    .max(80, "Máximo 80 caracteres."),
  customerEmail: z.email("Correo inválido.").max(120, "Máximo 120 caracteres."),
  // Se reusa el normalizador DEL SERVIDOR en vez de escribir aquí una regla
  // parecida: con dos algoritmos, el cliente rechazaba formatos que el
  // servidor sí acepta (044/045) y el usuario nunca llegaba a la rama que los
  // arregla. Una sola regla, un solo comportamiento.
  customerPhone: z
    .string()
    .max(25, "Teléfono muy largo.")
    .regex(/^[0-9+()\s-]+$/, "Solo números, espacios y + ( ) -.")
    .refine(
      (v) => /^[0-9]{10}$/.test(normalizeMexicanPhone(v)),
      "Escribe los 10 dígitos de tu teléfono.",
    ),
  postalCode: z
    .string()
    .trim()
    .regex(/^[0-9]{5}$/, "El código postal son 5 dígitos."),
  state: requerido("El estado", 80),
  municipality: requerido("El municipio", 80),
  neighborhood: requerido("La colonia", 80),
  street: requerido("La calle", 120),
  exteriorNumber: requerido("El número exterior", 20),
  interiorNumber: z.string().trim().max(20, "Máximo 20 caracteres.").optional(),
  addressReferences: z.string().trim().max(240, "Máximo 240 caracteres.").optional(),
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
    // Los valores se conservan si la validación falla: react-hook-form no
    // remonta el formulario, así que nadie tiene que reescribir su dirección.
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      postalCode: "",
      state: "",
      municipality: "",
      neighborhood: "",
      street: "",
      exteriorNumber: "",
      interiorNumber: "",
      addressReferences: "",
      notes: "",
    },
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
          customerEmail: values.customerEmail,
          customerPhone: values.customerPhone,
          deliveryMethod: "shipping",
          // Snapshot de entrega: se manda con el pedido para que quede
          // guardado ANTES de salir a Mercado Pago. El servidor lo revalida.
          shippingAddress: {
            recipient_name: values.customerName,
            phone: values.customerPhone,
            email: values.customerEmail,
            postal_code: values.postalCode,
            state: values.state,
            municipality: values.municipality,
            neighborhood: values.neighborhood,
            street: values.street,
            exterior_number: values.exteriorNumber,
            interior_number: values.interiorNumber || undefined,
            references: values.addressReferences || undefined,
          },
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
        <div>
          <h2 className="text-xl font-semibold">Datos de entrega</h2>
          <p className="mt-1.5 text-sm text-ml-white/60">
            Ingresa la dirección donde quieres recibir tu pedido.
          </p>
        </div>

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
            maxLength={25}
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
            Correo *
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

        {/* Dirección. El orden sigue cómo la gente escribe un domicilio en
            México: primero el CP —que ubica estado y municipio—, luego la
            colonia y al final la calle. En móvil cada campo ocupa el ancho
            completo; en pantallas medianas se agrupan de dos en dos. */}
        <div className="mt-2 grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="postalCode" className="mb-1.5 block text-sm text-ml-white/70">
              Código postal *
            </label>
            <input
              id="postalCode"
              type="text"
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={5}
              placeholder="06700"
              className={inputClass}
              {...register("postalCode")}
            />
            {errors.postalCode && (
              <p className="mt-1 text-xs text-ml-coral">
                {errors.postalCode.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="state" className="mb-1.5 block text-sm text-ml-white/70">
              Estado *
            </label>
            <input
              id="state"
              type="text"
              autoComplete="address-level1"
              maxLength={80}
              placeholder="Ciudad de México"
              className={inputClass}
              {...register("state")}
            />
            {errors.state && (
              <p className="mt-1 text-xs text-ml-coral">{errors.state.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="municipality"
              className="mb-1.5 block text-sm text-ml-white/70"
            >
              Municipio / Alcaldía *
            </label>
            <input
              id="municipality"
              type="text"
              autoComplete="address-level2"
              maxLength={80}
              placeholder="Cuauhtémoc"
              className={inputClass}
              {...register("municipality")}
            />
            {errors.municipality && (
              <p className="mt-1 text-xs text-ml-coral">
                {errors.municipality.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="neighborhood"
              className="mb-1.5 block text-sm text-ml-white/70"
            >
              Colonia *
            </label>
            <input
              id="neighborhood"
              type="text"
              autoComplete="address-level3"
              maxLength={80}
              placeholder="Roma Norte"
              className={inputClass}
              {...register("neighborhood")}
            />
            {errors.neighborhood && (
              <p className="mt-1 text-xs text-ml-coral">
                {errors.neighborhood.message}
              </p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="street" className="mb-1.5 block text-sm text-ml-white/70">
              Calle *
            </label>
            <input
              id="street"
              type="text"
              autoComplete="address-line1"
              maxLength={120}
              placeholder="Av. Álvaro Obregón"
              className={inputClass}
              {...register("street")}
            />
            {errors.street && (
              <p className="mt-1 text-xs text-ml-coral">{errors.street.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="exteriorNumber"
              className="mb-1.5 block text-sm text-ml-white/70"
            >
              Número exterior *
            </label>
            <input
              id="exteriorNumber"
              type="text"
              autoComplete="address-line2"
              maxLength={20}
              placeholder="123"
              className={inputClass}
              {...register("exteriorNumber")}
            />
            {errors.exteriorNumber && (
              <p className="mt-1 text-xs text-ml-coral">
                {errors.exteriorNumber.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="interiorNumber"
              className="mb-1.5 block text-sm text-ml-white/70"
            >
              Número interior (opcional)
            </label>
            <input
              id="interiorNumber"
              type="text"
              maxLength={20}
              placeholder="4B"
              className={inputClass}
              {...register("interiorNumber")}
            />
            {errors.interiorNumber && (
              <p className="mt-1 text-xs text-ml-coral">
                {errors.interiorNumber.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="addressReferences"
            className="mb-1.5 block text-sm text-ml-white/70"
          >
            Referencias para encontrar el domicilio (opcional)
          </label>
          <textarea
            id="addressReferences"
            rows={2}
            maxLength={240}
            placeholder="Entre calles, color de fachada, portón, negocio cercano, etc."
            className={inputClass}
            {...register("addressReferences")}
          />
          {errors.addressReferences && (
            <p className="mt-1 text-xs text-ml-coral">
              {errors.addressReferences.message}
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
                {/* Con unidad propia: "2 planillas × …". Sin ella, el "2× …"
                    de siempre. */}
                {line.unitLabel
                  ? `${formatUnitQuantity(line.quantity, line.unitLabel)} ×`
                  : `${line.quantity}×`}{" "}
                {line.title}
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

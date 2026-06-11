import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import OrderSummaryCard from "@/components/store/OrderSummaryCard";

export const metadata: Metadata = {
  title: "Pago recibido",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;

  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
      <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-ml-cyan/15 text-ml-cyan">
        <CheckCircle2 className="h-10 w-10" aria-hidden />
      </span>
      <h1 className="mt-6 text-3xl font-bold sm:text-4xl">
        ¡Gracias por tu compra!
      </h1>
      <p className="mx-auto mt-4 max-w-lg text-ml-white/65">
        Recibimos tu pago. Nuestro laboratorio confirmará tu pedido y, si
        incluye piezas personalizadas, tu diseño pasará directo a revisión de
        producción. Te contactaremos por WhatsApp o correo con los siguientes
        pasos.
      </p>
      <p className="mt-2 text-sm text-ml-white/45">
        Si el estado tarda unos minutos en actualizarse es normal: estamos
        confirmando el pago con Mercado Pago.
      </p>

      <OrderSummaryCard orderId={orderId} />

      <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          href="/tienda"
          className="rounded-full bg-ml-violet px-7 py-3.5 font-semibold text-ml-bg transition hover:bg-ml-violet/90"
        >
          Seguir explorando
        </Link>
        <Link
          href="/tienda/disenador"
          className="glass rounded-full px-7 py-3.5 font-semibold transition hover:border-ml-cyan/50 hover:text-ml-cyan"
        >
          Diseñar otra pieza
        </Link>
      </div>
    </div>
  );
}

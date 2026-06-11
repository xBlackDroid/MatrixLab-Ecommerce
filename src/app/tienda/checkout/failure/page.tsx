import type { Metadata } from "next";
import Link from "next/link";
import { XCircle } from "lucide-react";
import OrderSummaryCard from "@/components/store/OrderSummaryCard";
import { buildWhatsAppUrl, whatsappMessages } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Pago no completado",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function CheckoutFailurePage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;

  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
      <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-ml-coral/15 text-ml-coral">
        <XCircle className="h-10 w-10" aria-hidden />
      </span>
      <h1 className="mt-6 text-3xl font-bold sm:text-4xl">
        El pago no se completó
      </h1>
      <p className="mx-auto mt-4 max-w-lg text-ml-white/65">
        No te preocupes: tu carrito sigue guardado y no se realizó ningún
        cargo. Puedes intentarlo de nuevo cuando quieras o escribirnos para
        ayudarte a completar tu pedido.
      </p>

      <OrderSummaryCard orderId={orderId} />

      <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          href="/tienda/checkout"
          className="rounded-full bg-ml-violet px-7 py-3.5 font-semibold text-ml-bg transition hover:bg-ml-violet/90"
        >
          Intentar de nuevo
        </Link>
        <Link
          href="/tienda/carrito"
          className="glass rounded-full px-7 py-3.5 font-semibold transition hover:border-white/30"
        >
          Revisar carrito
        </Link>
        <a
          href={buildWhatsAppUrl(whatsappMessages.customRequest())}
          target="_blank"
          rel="noopener noreferrer"
          className="glass rounded-full px-7 py-3.5 font-semibold text-ml-coral transition hover:border-ml-coral/40"
        >
          Ayuda por WhatsApp
        </a>
      </div>
    </div>
  );
}

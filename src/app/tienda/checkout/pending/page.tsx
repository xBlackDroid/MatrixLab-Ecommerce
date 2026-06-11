import type { Metadata } from "next";
import Link from "next/link";
import { Clock3 } from "lucide-react";
import OrderSummaryCard from "@/components/store/OrderSummaryCard";

export const metadata: Metadata = {
  title: "Pago en proceso",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function CheckoutPendingPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;

  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
      <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-ml-violet/15 text-ml-violet">
        <Clock3 className="h-10 w-10" aria-hidden />
      </span>
      <h1 className="mt-6 text-3xl font-bold sm:text-4xl">
        Tu pago está en proceso
      </h1>
      <p className="mx-auto mt-4 max-w-lg text-ml-white/65">
        Mercado Pago está confirmando tu pago (algunos métodos, como pagos en
        efectivo o depósitos, pueden tardar). En cuanto se acredite, tu pedido
        entrará automáticamente a producción y te avisaremos.
      </p>

      <OrderSummaryCard orderId={orderId} />

      <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          href="/tienda"
          className="rounded-full bg-ml-violet px-7 py-3.5 font-semibold text-ml-bg transition hover:bg-ml-violet/90"
        >
          Volver a la tienda
        </Link>
      </div>
    </div>
  );
}

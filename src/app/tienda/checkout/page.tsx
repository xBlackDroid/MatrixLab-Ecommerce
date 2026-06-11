import type { Metadata } from "next";
import CheckoutForm from "@/components/store/CheckoutForm";

export const metadata: Metadata = {
  title: "Finalizar compra",
  description: "Completa tus datos y paga seguro con Mercado Pago.",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold sm:text-4xl">Finalizar compra</h1>
      <CheckoutForm />
    </div>
  );
}

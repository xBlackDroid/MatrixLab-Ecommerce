import type { Metadata } from "next";
import CartPageClient from "@/components/store/CartPageClient";

export const metadata: Metadata = {
  title: "Carrito",
  description: "Revisa tus piezas antes de finalizar la compra.",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default function CarritoPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold sm:text-4xl">Tu carrito</h1>
      <CartPageClient />
    </div>
  );
}

import type { Metadata } from "next";
import StoreLayout from "@/components/store/StoreLayout";

export const metadata: Metadata = {
  title: {
    default: "Tienda MatrixLab",
    template: "%s | Tienda MatrixLab",
  },
  description:
    "Productos personalizados, pedidos especiales y experiencias creativas listas para llevar de una pieza hasta miles.",
  openGraph: {
    title: "Tienda MatrixLab",
    description:
      "Compra productos personalizados, crea pedidos especiales o diseña prendas y accesorios textiles desde nuestro laboratorio creativo.",
    type: "website",
    locale: "es_MX",
    siteName: "MatrixLab Intelligence",
  },
};

export default function TiendaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StoreLayout>{children}</StoreLayout>;
}

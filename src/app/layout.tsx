import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "MatrixLab Intelligence",
    template: "%s | MatrixLab Intelligence",
  },
  description:
    "Un solo ecosistema creativo. Infinitas posibilidades. Productos personalizados, pedidos especiales y experiencias creativas desde una pieza hasta miles.",
  openGraph: {
    siteName: "MatrixLab Intelligence",
    type: "website",
    locale: "es_MX",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-ml-bg text-ml-white antialiased">
        {children}
        <Toaster
          theme="dark"
          position="top-center"
          richColors
          toastOptions={{
            style: {
              background: "rgba(11, 15, 25, 0.92)",
              border: "1px solid rgba(177, 151, 252, 0.3)",
              color: "#F8F9FA",
            },
          }}
        />
      </body>
    </html>
  );
}

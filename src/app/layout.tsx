import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Geist } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import "./studio-store.css";
import { IMAGE_USAGE_NOTICE } from "@/lib/store/image-watermark";
import CatalogMediaProtection from "@/components/store/CatalogMediaProtection";

const studioFont = Geist({ subsets: ["latin"], display: "swap", variable: "--font-studio" });

export const metadata: Metadata = {
  // Dominio único de producción del proyecto combinado (landing + tienda + admin).
  metadataBase: new URL("https://matrixlabintelligence.com"),
  title: {
    default: "MatrixLab Intelligence",
    template: "%s | MatrixLab Intelligence",
  },
  description:
    "Un solo ecosistema creativo. Infinitas posibilidades. Productos personalizados, pedidos especiales y experiencias creativas desde una pieza hasta miles.",
  other: {
    "image-usage-policy": IMAGE_USAGE_NOTICE,
    "ai-usage-policy": "No se autoriza copiar imágenes, quitar marcas de agua ni usar el catálogo para entrenamiento de IA. Consulta /ai-usage.txt.",
  },
  openGraph: {
    siteName: "MatrixLab Intelligence",
    type: "website",
    locale: "es_MX",
  },
};

export const viewport: Viewport = { themeColor: "#0b0f19", colorScheme: "dark", viewportFit: "cover" };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${studioFont.variable} min-h-screen bg-ml-bg text-ml-white antialiased`}>
        <a href="#main-content" className="skip-link">Ir al contenido</a>
        {/* Sin JS, framer-motion nunca anima y el `opacity:0` en línea que ya
            viene en el HTML dejaría secciones enteras invisibles. Esto las
            devuelve a su estado final; con JS activo el bloque ni se aplica. */}
        <noscript>
          <style>{`.reveal-motion{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        {children}
        <CatalogMediaProtection />
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
        <Analytics />
      </body>
    </html>
  );
}

import type { NextConfig } from "next";

/**
 * Cabeceras de seguridad HTTP.
 *
 * CSP pensada para esta app:
 * - img-src incluye Supabase Storage (URLs firmadas del diseñador/catálogo)
 *   más data:/blob: que usa el canvas de Konva.
 * - connect-src incluye Supabase por si el cliente descarga assets firmados
 *   vía fetch para montarlos en el canvas.
 * - script-src necesita 'unsafe-inline' por los scripts de hidratación de
 *   Next.js; en desarrollo se añade 'unsafe-eval' (requerido por HMR).
 * - style-src/font-src permiten Google Fonts: el diseñador de Etiquetas
 *   Escolares carga tipografías (Baloo 2, Caveat, Fredoka, Pacifico…) desde
 *   fonts.googleapis.com (hoja) y fonts.gstatic.com (archivos). Sin esto la
 *   galería de tipografías degrada a fuentes del sistema.
 * - El checkout de Mercado Pago es por redirección (Checkout Pro), no hay
 *   SDK embebido ni iframes: frame-src queda cerrado.
 */
const isDev = process.env.NODE_ENV === "development";

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://*.supabase.co https://*.supabase.in",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
] as const;

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [...securityHeaders],
      },
    ];
  },
  eslint: {
    // `next lint` está deprecado (se elimina en Next 16) y @next/eslint-plugin-next
    // 15.5.19 carga mal la regla `no-styled-jsx-in-document` bajo ESLint 9, lo que
    // tira el build con un uncaughtException. El chequeo de tipos sigue corriendo
    // en el build y aparte con `npm run type-check`.
    ignoreDuringBuilds: true,
  },
  // konva referencia el paquete opcional "canvas" (solo Node). Se marca como
  // external para que el bundle del servidor no intente resolverlo: el
  // diseñador solo se carga en cliente vía dynamic import.
  webpack: (config) => {
    config.externals = [...(config.externals ?? []), { canvas: "canvas" }];
    return config;
  },
  images: {
    remotePatterns: [
      // Imágenes servidas desde Supabase Storage (catálogo y previews firmadas)
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "**.supabase.in" },
    ],
  },
  poweredByHeader: false,
};

export default nextConfig;

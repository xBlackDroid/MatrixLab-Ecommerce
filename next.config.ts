import type { NextConfig } from "next";

/**
 * Cabeceras de seguridad HTTP (estáticas).
 *
 * La Content-Security-Policy NO está aquí: necesita un nonce distinto en cada
 * respuesta, así que la emite `src/middleware.ts`. Definirla también en este
 * archivo mandaría DOS cabeceras CSP y el navegador aplicaría la intersección
 * de ambas, que es la forma más silenciosa de romper la página.
 *
 * Lo que sí vive aquí es todo lo que no varía por petición:
 *
 * - HSTS con `preload`: además de forzar https en visitas siguientes, permite
 *   inscribir el dominio en la lista precargada de los navegadores para que ni
 *   la PRIMERA visita viaje en claro. (Inscribirlo es un trámite aparte en
 *   hstspreload.org; la cabecera es el requisito previo.)
 * - `X-Frame-Options: DENY` acompaña a `frame-ancestors 'none'` para
 *   navegadores viejos que no leen la CSP.
 * - COOP `same-origin`: aísla el contexto de navegación, de modo que una
 *   ventana abierta desde el sitio (o que abra el sitio) no conserve
 *   referencias `window.opener` explotables.
 * - CORP `same-origin`: impide que otro sitio incruste nuestros recursos.
 *   No afecta a los scrapers de vista previa (WhatsApp, redes), que descargan
 *   del lado del servidor y no aplican esta política.
 * - Deliberadamente NO se añade COEP (`require-corp`): rompería la carga de
 *   imágenes de Supabase Storage y de Google Fonts, que son cross-origin.
 * - `Permissions-Policy` apaga APIs que la tienda no usa. `payment=()` es
 *   seguro: Checkout Pro es una redirección a Mercado Pago, no la Payment
 *   Request API dentro de nuestro origen.
 */
const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), interest-cohort=()",
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

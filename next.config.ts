import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

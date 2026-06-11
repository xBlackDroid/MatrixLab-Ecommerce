import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

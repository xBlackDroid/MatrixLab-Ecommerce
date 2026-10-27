import { type NextRequest, NextResponse } from "next/server";
import { renderCotizadorDocument } from "@/lib/admin-cotizador/document";
import { getAdminFromRequest } from "@/lib/security/admin-auth";

/**
 * /admin/cotizador — cotizador interno como documento HTML completo.
 *
 * Es un route handler (no page.tsx) porque sirve el cotizador original tal
 * cual, ver src/lib/admin-cotizador/document.ts. Misma protección que las
 * páginas admin: sesión firmada + registro vivo en admin_sessions; sin
 * sesión, al login. La CSP estricta con nonce la pone el middleware (la ruta
 * cae en /admin), y el nonce llega en la cabecera `x-nonce` del request.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    const response = NextResponse.redirect(new URL("/admin/login", request.url));
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    return response;
  }

  const nonce = request.headers.get("x-nonce");
  if (!nonce || !/^[a-f0-9]{32}$/.test(nonce)) {
    // Sin nonce los scripts no correrían bajo la CSP estricta: mejor un error
    // claro que una página muerta.
    return new NextResponse("Cotizador no disponible: falta la política de seguridad.", {
      status: 500,
      headers: { "Cache-Control": "private, no-store, max-age=0" },
    });
  }

  const html = renderCotizadorDocument({ nonce, csrf: admin.csrf });
  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store, max-age=0",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

import { type NextRequest, NextResponse } from "next/server";

/**
 * Content-Security-Policy por petición.
 *
 * ------------------------------------------------------------------------
 * Por qué hay DOS políticas y no una
 * ------------------------------------------------------------------------
 * La política que de verdad detiene un XSS es la de nonce: `script-src 'self'
 * 'nonce-…' 'strict-dynamic'`, sin `'unsafe-inline'`. Next.js sabe estampar
 * ese nonce en sus `<script>` cuando ve la cabecera CSP en el request… pero
 * SÓLO al renderizar la página en la petición. Una página PRERENDERIZADA en
 * el build sale del caché con su HTML ya escrito y sus scripts en línea SIN
 * nonce; como `'strict-dynamic'` hace que el navegador ignore `'self'`, esa
 * página se quedaría sin ejecutar un solo script. Es decir: aplicar la
 * política estricta a todo tumbaría el landing.
 *
 * Se comprobó en un build real de este proyecto: `/`, `/tienda` y
 * `/tienda/disenador` salen estáticas y traen 25 scripts en línea sin nonce;
 * el resto de rutas declara `force-dynamic` y recibe el nonce correctamente.
 *
 * Así que la política se elige por ruta:
 *
 *   - Rutas DINÁMICAS (todo lo demás: panel admin, carrito, checkout, fichas
 *     de producto, categorías, diseñadores con parámetro y /api/*) →
 *     política ESTRICTA con nonce. Ahí es donde viven la sesión, los datos
 *     personales y el dinero, y es donde un XSS costaría caro.
 *   - Rutas ESTÁTICAS del listado de abajo → política compatible con
 *     `'unsafe-inline'`. Son páginas de catálogo/marketing sin sesión, sin
 *     formularios y sin datos de cliente.
 *
 * Ese reparto NO puede quedar a la deriva: `scripts/qa/security-headers.test.ts`
 * verifica que toda página fuera de la lista estática declare `force-dynamic`.
 * Si alguien quita un `force-dynamic`, el QA falla antes de que esa página se
 * quede sin scripts en producción.
 *
 * ------------------------------------------------------------------------
 * Decisiones de la política (comunes a ambas variantes)
 * ------------------------------------------------------------------------
 * - `style-src 'unsafe-inline'`: obligatorio hoy. Framer Motion y Sonner
 *   escriben estilos en línea y `app/layout.tsx` lleva un `<style>` dentro de
 *   `<noscript>` sin el cual las secciones animadas quedan invisibles sin JS.
 *   Un nonce no ayuda: esos estilos los inyecta el navegador en runtime.
 * - `img-src` con `data:` y `blob:` por el lienzo de Konva (exporta previews),
 *   y `*.supabase.co/.in` por las URLs firmadas del storage privado.
 * - Google Fonts: los usa la galería de tipografías de Etiquetas Escolares.
 * - Mercado Pago NO aparece: Checkout Pro es por REDIRECCIÓN, sin SDK ni
 *   iframe. Una navegación completa no la restringe la CSP del origen, así
 *   que añadir sus dominios ampliaría la superficie sin habilitar nada.
 * - `frame-src 'none'` + `frame-ancestors 'none'`: ni enmarca ni es
 *   enmarcable (anti-clickjacking).
 */

const GOOGLE_FONTS_CSS = "https://fonts.googleapis.com";
const GOOGLE_FONTS_FILES = "https://fonts.gstatic.com";
const SUPABASE_HOSTS = "https://*.supabase.co https://*.supabase.in";

/**
 * Rutas que Next prerenderiza (comprobado con `next build`). Coincidencia
 * EXACTA: las subrutas de `/tienda` y `/tienda/disenador` sí son dinámicas y
 * reciben la política estricta.
 */
export const STATIC_PRERENDERED_PATHS = new Set([
  "/",
  "/tienda",
  "/tienda/disenador",
]);

/**
 * Rutas que Next renderiza EN LA PETICIÓN (todas declaran `force-dynamic`).
 * SÓLO estas reciben la política estricta con nonce.
 *
 * El reparto está en POSITIVO a propósito. Antes se hacía al revés —todo lo
 * que no estuviera en `STATIC_PRERENDERED_PATHS` recibía la política
 * estricta—, y eso metía en el saco estricto a las URLs que NO EXISTEN: Next
 * las sirve con su 404 prerenderizada (`/_not-found`), cuyo HTML sale del
 * caché con los scripts en línea SIN nonce. Como `strict-dynamic` hace que el
 * navegador ignore `'self'`, la 404 se quedaba sin ejecutar un solo script
 * (sin hidratación, sin navegación de cliente) y llenaba la consola de
 * violaciones de CSP. Con la lista en positivo, una URL desconocida cae en la
 * política compatible, que es justo la que su HTML prerenderizado necesita.
 *
 * Efecto secundario buscado: añadir mañana un `not-found.tsx` o un
 * `error.tsx` —que también se prerenderizan y tampoco son `page.tsx`, así que
 * el QA no los vería— deja de ser una trampa.
 *
 * `scripts/qa/security-headers.test.ts` verifica la equivalencia en los dos
 * sentidos: una página declara `force-dynamic` si y sólo si su ruta cae aquí.
 * Así ni una página dinámica se queda sin la política estricta, ni una
 * prerenderizada la recibe por error.
 */
export const DYNAMIC_ROUTE_PATTERNS: readonly RegExp[] = [
  /^\/admin(?:\/|$)/,
  /^\/api(?:\/|$)/,
  /^\/tienda\/carrito$/,
  /^\/tienda\/checkout(?:\/|$)/,
  /^\/tienda\/categoria\/[^/]+$/,
  /^\/tienda\/producto\/[^/]+$/,
  /^\/tienda\/disenador\/[^/]+$/,
  /**
   * Landing de los cursos de MatrixLab Tumbler. Lleva un formulario que
   * recoge nombre, teléfono y correo, así que le corresponde la política
   * ESTRICTA y por eso la página declara `force-dynamic`.
   *
   * La coincidencia es EXACTA, no un prefijo `^\/tienda\/matrixlab-tumbler`.
   * Con el prefijo, `/tienda/matrixlab-tumbler` —que no tiene página— también
   * caería aquí, y esa URL se sirve con la 404 PRERENDERIZADA, cuyo HTML sale
   * del caché con los scripts en línea sin nonce: `strict-dynamic` los
   * bloquearía todos y la 404 quedaría sin hidratar. Es exactamente la
   * regresión que documenta el comentario de arriba.
   */
  /^\/tienda\/matrixlab-tumbler\/cursos$/,
];

/** ¿Esta ruta la renderiza Next en la petición (y por tanto lleva nonce)? */
export function isDynamicRoute(path: string): boolean {
  return DYNAMIC_ROUTE_PATTERNS.some((pattern) => pattern.test(path));
}

function directivesFor(scriptSrc: string): string[] {
  return [
    "default-src 'self'",
    scriptSrc,
    `style-src 'self' 'unsafe-inline' ${GOOGLE_FONTS_CSS}`,
    `img-src 'self' data: blob: ${SUPABASE_HOSTS}`,
    `font-src 'self' data: ${GOOGLE_FONTS_FILES}`,
    `connect-src 'self' ${SUPABASE_HOSTS}`,
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "manifest-src 'self'",
    "upgrade-insecure-requests",
  ];
}

/** Política estricta: sólo scripts con nonce y lo que ellos carguen. */
export function buildStrictCsp(nonce: string, isDev: boolean): string {
  // 'unsafe-eval' sólo en desarrollo: lo exige el hot reload de Next.
  const scriptSrc = `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${
    isDev ? " 'unsafe-eval'" : ""
  }`;
  return directivesFor(scriptSrc).join("; ");
}

/**
 * Política compatible para HTML prerenderizado (sus scripts en línea no
 * pueden llevar nonce). Sigue acotando origen, formularios, marcos y objetos.
 */
export function buildCompatibleCsp(isDev: boolean): string {
  const scriptSrc = `script-src 'self' 'unsafe-inline'${
    isDev ? " 'unsafe-eval'" : ""
  }`;
  return directivesFor(scriptSrc).join("; ");
}

/** Normaliza la ruta para comparar contra la lista (ignora el slash final). */
export function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

export function middleware(request: NextRequest) {
  const isDev = process.env.NODE_ENV === "development";
  const path = normalizePath(request.nextUrl.pathname);

  // Sólo lo que Next renderiza en la petición puede llevar nonce. Todo lo
  // demás —las 3 páginas prerenderizadas y cualquier URL inexistente, que se
  // sirve con la 404 también prerenderizada— recibe la política compatible.
  if (!isDynamicRoute(path)) {
    const response = NextResponse.next();
    response.headers.set("Content-Security-Policy", buildCompatibleCsp(isDev));
    return response;
  }

  const nonce = crypto.randomUUID().replace(/-/g, "");
  const csp = buildStrictCsp(nonce, isDev);

  // Next lee la CSP desde los headers del REQUEST para estampar el nonce en
  // sus propios <script>. Sin esta línea el nonce no llega al HTML.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    /**
     * Documentos y rutas de API. Se excluyen los estáticos ya inmutables
     * (`_next/static`, imágenes optimizadas, iconos, fuentes): no son
     * documentos, no ejecutan scripts, y pasarlos por el middleware sólo
     * añadiría latencia a cada asset.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpe?g|webp|gif|svg|ico|woff2?|ttf|otf|txt|xml)$).*)",
  ],
};

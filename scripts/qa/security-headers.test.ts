/**
 * QA de CABECERAS DE SEGURIDAD y del reparto de CSP.
 *
 * La invariante crítica que protege este archivo:
 *
 *   `src/middleware.ts` aplica la CSP ESTRICTA (nonce + strict-dynamic) a toda
 *   ruta que NO esté en `STATIC_PRERENDERED_PATHS`. Esa política sólo funciona
 *   si Next renderiza la página EN LA PETICIÓN, porque el nonce se estampa en
 *   ese momento. Una página prerenderizada sale del caché con sus scripts en
 *   línea sin nonce y, como `strict-dynamic` hace que el navegador ignore
 *   `'self'`, se quedaría SIN EJECUTAR NINGÚN SCRIPT.
 *
 *   Por eso: toda página fuera de la lista estática debe declarar
 *   `export const dynamic = "force-dynamic"`. Si alguien lo quita, este QA
 *   falla aquí y no en producción con una página en blanco.
 *
 * Correr con: npx tsx scripts/qa/security-headers.test.ts
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, sep } from "node:path";
import {
  buildCompatibleCsp,
  buildStrictCsp,
  isDynamicRoute,
  normalizePath,
  STATIC_PRERENDERED_PATHS,
} from "../../src/middleware";

const ROOT = join(__dirname, "..", "..");

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? " — " + detail : ""}`);
  if (!ok) failures += 1;
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

/** Ruta URL de una página del App Router (los segmentos [param] se conservan). */
function routeOf(pageFile: string): string {
  const rel = pageFile
    .slice(join(ROOT, "src", "app").length)
    .split(sep)
    .join("/")
    .replace(/\/page\.tsx$/, "");
  // Los grupos (grupo) no aparecen en la URL.
  const cleaned = rel.replace(/\/\([^/]+\)/g, "");
  return cleaned === "" ? "/" : cleaned;
}

// ---------------------------------------------------------------------------
// 1. La invariante: estático ⟺ CSP compatible; dinámico ⟺ CSP con nonce
// ---------------------------------------------------------------------------
console.log("\n--- 1. Reparto de CSP por ruta ---");

const pages = walk(join(ROOT, "src", "app")).filter((f) =>
  f.endsWith(`${sep}page.tsx`),
);
check("se encontraron páginas que auditar", pages.length > 0);

/**
 * Equivalencia en LOS DOS SENTIDOS: una página declara `force-dynamic` si y
 * sólo si su ruta cae en `DYNAMIC_ROUTE_PATTERNS`.
 *
 *   →  Dinámica sin patrón que la cubra: recibiría la política COMPATIBLE,
 *      es decir `unsafe-inline` en una ruta con sesión, datos personales o
 *      dinero. Se pierde la protección justo donde importa.
 *   →  Cubierta por un patrón pero sin `force-dynamic`: Next puede
 *      prerenderizarla y sus scripts saldrían del caché SIN nonce, así que
 *      `strict-dynamic` los bloquearía todos y la página quedaría muerta.
 *
 * Comprobar un solo sentido deja pasar el otro fallo, y ninguno de los dos
 * se nota hasta producción.
 */
for (const file of pages) {
  const route = routeOf(file);
  const source = readFileSync(file, "utf8");
  const isForcedDynamic = /export const dynamic\s*=\s*"force-dynamic"/.test(source);
  const matchesDynamic = isDynamicRoute(normalizePath(route));

  check(
    `${route}: force-dynamic (${isForcedDynamic}) coincide con la lista dinámica (${matchesDynamic})`,
    isForcedDynamic === matchesDynamic,
    isForcedDynamic === matchesDynamic
      ? ""
      : isForcedDynamic
        ? "declara force-dynamic pero NINGÚN patrón la cubre: recibiría unsafe-inline. Añádela a DYNAMIC_ROUTE_PATTERNS"
        : "un patrón la cubre pero no declara force-dynamic: si se prerenderiza, sus scripts quedan sin nonce y bloqueados",
  );
}

/**
 * Regresión fijada: una URL que NO EXISTE se sirve con la 404
 * PRERENDERIZADA (`/_not-found`), cuyo HTML sale del caché con los scripts
 * sin nonce. Si cayera en la política estricta, `strict-dynamic` los
 * bloquearía todos. `/_not-found` no es un `page.tsx`, así que el bucle de
 * arriba nunca lo vería: hay que comprobarlo aparte.
 */
for (const unknownPath of [
  "/esta-ruta-no-existe",
  "/tienda/no-existe",
  "/_not-found",
  "/tienda/disenador-falso",
]) {
  check(
    `${unknownPath} (404 prerenderizada) recibe la CSP compatible, no la de nonce`,
    !isDynamicRoute(normalizePath(unknownPath)),
  );
}

// Las 3 páginas prerenderizadas conocidas siguen fuera de la política estricta.
for (const staticPath of STATIC_PRERENDERED_PATHS) {
  check(
    `${staticPath} (prerenderizada) recibe la CSP compatible`,
    !isDynamicRoute(normalizePath(staticPath)),
  );
}

// Y las rutas donde viven la sesión y el dinero SÍ reciben la estricta.
for (const sensitivePath of [
  "/admin",
  "/admin/pedidos",
  "/tienda/checkout",
  "/tienda/carrito",
  "/api/checkout/mercadopago",
]) {
  check(
    `${sensitivePath} recibe la CSP estricta con nonce`,
    isDynamicRoute(normalizePath(sensitivePath)),
  );
}

// ---------------------------------------------------------------------------
// 2. Contenido de cada política
// ---------------------------------------------------------------------------
console.log("\n--- 2. Directivas de la CSP ---");

const strict = buildStrictCsp("abc123", false);
const compat = buildCompatibleCsp(false);

check(
  "la política estricta NO permite scripts en línea arbitrarios",
  !strict.includes("script-src") ||
    !strict.split("script-src")[1]!.split(";")[0]!.includes("'unsafe-inline'"),
);
check("la política estricta usa nonce", strict.includes("'nonce-abc123'"));
check("la política estricta usa strict-dynamic", strict.includes("'strict-dynamic'"));
check(
  "ninguna política permite 'unsafe-eval' en producción",
  !strict.includes("'unsafe-eval'") && !compat.includes("'unsafe-eval'"),
);
check(
  "'unsafe-eval' sí se habilita en desarrollo (lo exige el hot reload)",
  buildStrictCsp("abc123", true).includes("'unsafe-eval'"),
);

for (const [label, csp] of [
  ["estricta", strict],
  ["compatible", compat],
] as const) {
  for (const directive of [
    "default-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ]) {
    check(`política ${label} incluye "${directive}"`, csp.includes(directive));
  }
  check(
    `política ${label} NO usa comodín en script-src`,
    !/script-src[^;]*\*/.test(csp),
  );
  check(
    `política ${label} permite Supabase Storage en img-src`,
    /img-src[^;]*supabase\.co/.test(csp),
  );
  check(
    `política ${label} permite Google Fonts (galería de tipografías)`,
    /style-src[^;]*fonts\.googleapis\.com/.test(csp) &&
      /font-src[^;]*fonts\.gstatic\.com/.test(csp),
  );
}

// ---------------------------------------------------------------------------
// 3. Cabeceras estáticas de next.config.ts
// ---------------------------------------------------------------------------
console.log("\n--- 3. Cabeceras estáticas ---");

const nextConfig = readFileSync(join(ROOT, "next.config.ts"), "utf8");

for (const [label, pattern] of [
  ["Strict-Transport-Security con preload", /Strict-Transport-Security[\s\S]{0,120}preload/],
  ["X-Content-Type-Options: nosniff", /X-Content-Type-Options[\s\S]{0,60}nosniff/],
  ["X-Frame-Options: DENY", /X-Frame-Options[\s\S]{0,40}DENY/],
  ["Referrer-Policy", /Referrer-Policy[\s\S]{0,80}strict-origin-when-cross-origin/],
  ["Cross-Origin-Opener-Policy", /Cross-Origin-Opener-Policy[\s\S]{0,60}same-origin/],
  ["Cross-Origin-Resource-Policy", /Cross-Origin-Resource-Policy[\s\S]{0,60}same-origin/],
  ["Permissions-Policy", /Permissions-Policy[\s\S]{0,240}camera=\(\)/],
] as const) {
  check(`next.config.ts define ${label}`, pattern.test(nextConfig));
}

check(
  "next.config.ts NO define CSP (evita dos cabeceras que se intersecan)",
  !/Content-Security-Policy/.test(
    nextConfig.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/.*$/gm, ""),
  ),
);

check(
  "poweredByHeader desactivado (no se anuncia la versión de Next)",
  /poweredByHeader:\s*false/.test(nextConfig),
);

console.log(
  failures === 0
    ? "\nTodo OK: cabeceras y reparto de CSP consistentes."
    : `\n${failures} verificación(es) fallida(s).`,
);
process.exit(failures === 0 ? 0 : 1);

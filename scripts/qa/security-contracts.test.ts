/**
 * QA de CONTRATOS de seguridad.
 *
 * Dos mitades:
 *
 *   A. Validación real de entradas (se ejecutan los esquemas Zod). El cliente
 *      manda ids y cantidades; cualquier intento de mandar precio, total o
 *      descuento tiene que rebotar, y las cantidades imposibles también.
 *
 *   B. Invariantes de AUTORIZACIÓN leídas del código fuente. Son las reglas
 *      que no se pueden expresar en un tipo: "toda ruta /api/admin exige
 *      sesión admin", "toda mutación admin exige CSRF", "todo acceso a un
 *      recurso de cliente filtra por session_id". Si alguien agrega una ruta
 *      nueva y olvida el guard, este QA falla en vez de descubrirse en
 *      producción.
 *
 * Correr con: npx tsx scripts/qa/security-contracts.test.ts
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { CartAddItemSchema, CartUpdateItemSchema } from "../../src/lib/validation/cart";
import { CheckoutSchema } from "../../src/lib/validation/checkout";

const ROOT = join(__dirname, "..", "..");

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? " — " + detail : ""}`);
  if (!ok) failures += 1;
}

/**
 * Quita comentarios del código antes de buscar patrones.
 *
 * Las comprobaciones de abajo leen el fuente para verificar invariantes que
 * ningún tipo puede expresar. Sin esto, un comentario que MENCIONA el patrón
 * peligroso ("no uses NEXT_PUBLIC_… aquí") lo haría fallar, y peor: un patrón
 * peligroso comentado lo haría pasar. Sólo cuenta el código que se ejecuta.
 */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

function read(...parts: string[]): string {
  return stripComments(readFileSync(join(ROOT, ...parts), "utf8"));
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const VALID_UUID = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
const OTHER_UUID = "1b4e28ba-2fa1-11d2-883f-0016d3cca427";

// ===========================================================================
// A. El cliente NO controla el precio
// ===========================================================================
console.log("\n--- A. Precio y cantidad: el cliente sólo manda ids ---");

check(
  "agregar al carrito con `price` es RECHAZADO",
  !CartAddItemSchema.safeParse({
    productId: VALID_UUID,
    quantity: 1,
    price: 1,
  }).success,
);

check(
  "agregar al carrito con `unitPrice` es RECHAZADO",
  !CartAddItemSchema.safeParse({
    productId: VALID_UUID,
    quantity: 1,
    unitPrice: 0,
  }).success,
);

check(
  "agregar al carrito con `total` es RECHAZADO",
  !CartAddItemSchema.safeParse({
    productId: VALID_UUID,
    quantity: 1,
    total: 0,
  }).success,
);

check(
  "agregar al carrito con `discount` inventado es RECHAZADO",
  !CartAddItemSchema.safeParse({
    productId: VALID_UUID,
    quantity: 1,
    discount: 100,
  }).success,
);

check(
  "checkout con `total` es RECHAZADO",
  !CheckoutSchema.safeParse({
    cartId: VALID_UUID,
    customerName: "Ana Ruiz",
    customerPhone: "5512345678",
    total: 1,
  }).success,
);

check(
  "checkout con `shipping` es RECHAZADO",
  !CheckoutSchema.safeParse({
    cartId: VALID_UUID,
    customerName: "Ana Ruiz",
    customerPhone: "5512345678",
    shipping: -500,
  }).success,
);

check(
  "el alta legítima en el carrito SÍ pasa",
  CartAddItemSchema.safeParse({
    productId: VALID_UUID,
    variantId: OTHER_UUID,
    quantity: 2,
  }).success,
);

console.log("\n--- A2. Cantidades imposibles ---");

const BAD_QUANTITIES: Array<[string, unknown]> = [
  ["cantidad 0", 0],
  ["cantidad negativa", -5],
  ["cantidad decimal", 1.5],
  ["cantidad gigante", 1_000_000],
  ["cantidad como texto", "3"],
  ["cantidad NaN", Number.NaN],
  ["cantidad Infinity", Number.POSITIVE_INFINITY],
  ["cantidad null", null],
];

for (const [label, quantity] of BAD_QUANTITIES) {
  check(
    `alta en carrito RECHAZA ${label}`,
    !CartAddItemSchema.safeParse({ productId: VALID_UUID, quantity }).success,
  );
  check(
    `actualización de línea RECHAZA ${label}`,
    !CartUpdateItemSchema.safeParse({ quantity }).success,
  );
}

console.log("\n--- A3. Identificadores de producto inválidos ---");

const BAD_IDS: Array<[string, unknown]> = [
  ["id no-uuid", "playera-1"],
  ["id vacío", ""],
  ["id numérico", 1],
  ["inyección SQL en el id", "' OR 1=1 --"],
  ["traversal en el id", "../../etc/passwd"],
  ["id nulo", null],
];

for (const [label, productId] of BAD_IDS) {
  check(
    `alta en carrito RECHAZA ${label}`,
    !CartAddItemSchema.safeParse({ productId, quantity: 1 }).success,
  );
}

console.log("\n--- A4. Datos de contacto del checkout ---");

check(
  "RECHAZA correo inválido",
  !CheckoutSchema.safeParse({
    cartId: VALID_UUID,
    customerName: "Ana Ruiz",
    customerEmail: "no-es-correo",
    customerPhone: "5512345678",
  }).success,
);

check(
  "RECHAZA teléfono con letras",
  !CheckoutSchema.safeParse({
    cartId: VALID_UUID,
    customerName: "Ana Ruiz",
    customerPhone: "55-DROP-TABLE",
  }).success,
);

check(
  "RECHAZA notas por encima del límite",
  !CheckoutSchema.safeParse({
    cartId: VALID_UUID,
    customerName: "Ana Ruiz",
    customerPhone: "5512345678",
    notes: "x".repeat(501),
  }).success,
);

check(
  "el checkout legítimo SÍ pasa",
  CheckoutSchema.safeParse({
    cartId: VALID_UUID,
    customerName: "Ana Ruiz",
    customerEmail: "ana@example.com",
    customerPhone: "+52 55 1234 5678",
    notes: "Entregar por la tarde",
  }).success,
);

// ===========================================================================
// B. Invariantes de autorización (lectura del código)
// ===========================================================================
console.log("\n--- B. Autorización de las rutas /api/admin ---");

const adminApiDir = join(ROOT, "src", "app", "api", "admin");
const adminRoutes = walk(adminApiDir).filter((f) => f.endsWith("route.ts"));

check("se encontraron rutas admin que auditar", adminRoutes.length > 0);

for (const file of adminRoutes) {
  const rel = file.slice(ROOT.length + 1);
  const source = stripComments(readFileSync(file, "utf8"));
  // login y logout son los únicos endpoints sin sesión previa por definición.
  const isAuthEndpoint = rel.includes("login") || rel.includes("logout");
  if (isAuthEndpoint) continue;

  const handlers = [...source.matchAll(/export async function (GET|POST|PATCH|PUT|DELETE)\b/g)]
    .map((m) => m[1]!);

  for (const method of handlers) {
    const guarded =
      method === "GET"
        ? /getAdminFromRequest|requireAdminMutation/.test(source)
        : /requireAdminMutation/.test(source);
    check(
      `${rel} · ${method} exige sesión admin`,
      guarded,
      guarded ? "" : "falta el guard",
    );
  }

  const mutates = handlers.some((m) => m !== "GET");
  if (mutates) {
    check(
      `${rel} · las mutaciones pasan por requireAdminMutation (CSRF)`,
      source.includes("requireAdminMutation"),
    );
  }
}

console.log("\n--- B2. Páginas /admin protegidas en servidor ---");

const adminPages = walk(join(ROOT, "src", "app", "admin")).filter((f) =>
  f.endsWith("page.tsx"),
);
for (const file of adminPages) {
  const rel = file.slice(ROOT.length + 1);
  const source = stripComments(readFileSync(file, "utf8"));
  const isLogin = rel.includes("login");
  check(
    `${rel} ${isLogin ? "resuelve sesión" : "llama requireAdminPage()"}`,
    isLogin
      ? source.includes("getAdminFromCookies")
      : source.includes("requireAdminPage"),
  );
}

console.log("\n--- B3. Propiedad por sesión en recursos de cliente ---");

const cart = read("src", "lib", "store", "cart.ts");
check(
  "cart.ts busca el carrito filtrando por session_id",
  /\.eq\("session_id", sessionId\)/.test(cart),
);
check(
  "cart.ts sólo toca líneas del carrito de la sesión (findOwnedItem)",
  cart.includes("findOwnedItem") &&
    /\.eq\("cart_id", cart\.id\)/.test(cart),
);

const orders = read("src", "lib", "store", "orders.ts");
check(
  "orders.ts sólo devuelve el pedido si coincide la sesión",
  /getOrderForSession[\s\S]{0,600}\.eq\("session_id", sessionId\)/.test(orders),
);

const designs = read("src", "app", "api", "designs", "[id]", "route.ts");
check(
  "designs/[id] resuelve el diseño filtrando por session_id",
  /findOwnedDesign[\s\S]{0,400}\.eq\("session_id", sessionId\)/.test(designs),
);

const uploads = read("src", "app", "api", "uploads", "design-assets", "route.ts");
check(
  "uploads exige que el diseño sea de la sesión",
  /\.eq\("session_id", sessionId\)/.test(uploads),
);

console.log("\n--- B4. Subida de archivos ---");

check(
  "el subidor valida el formato REAL con sharp (no la extensión)",
  uploads.includes("sharp(buffer") && uploads.includes("metadata.format"),
);
check(
  "SVG no está en la lista de formatos aceptados",
  !/["']image\/svg/.test(uploads) &&
    !/\bsvg\b\s*:/.test(uploads.split("FORMAT_TO_MIME")[1]?.slice(0, 300) ?? ""),
);
check(
  "el decodificador tiene techo de píxeles (bomba de descompresión)",
  uploads.includes("limitInputPixels"),
);
check(
  "el nombre del archivo lo genera el servidor (nanoid), no el cliente",
  uploads.includes("nanoid(") && uploads.includes("originalPath"),
);
check(
  "hay cuota por sesión/diseño",
  uploads.includes("canUploadAsset"),
);
check(
  "hay cuota de diseños por sesión",
  read("src", "app", "api", "designs", "route.ts").includes("canCreateDesign"),
);

console.log("\n--- B5. Secretos y superficie pública ---");

const envSource = read("src", "lib", "security", "env.ts");
for (const secret of [
  "MERCADOPAGO_ACCESS_TOKEN",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ADMIN_SESSION_SECRET",
  "ADMIN_ACCESS_PASSWORD",
  "MERCADOPAGO_WEBHOOK_SECRET",
  "DATABASE_URL",
]) {
  check(
    `${secret} nunca se lee con prefijo NEXT_PUBLIC_`,
    !envSource.includes(`NEXT_PUBLIC_${secret}`),
  );
}

check(
  "env.ts es server-only (no puede acabar en el bundle del navegador)",
  envSource.startsWith('import "server-only"'),
);

const clientFiles = walk(join(ROOT, "src", "components")).filter((f) =>
  f.endsWith(".tsx"),
);
const leaky = clientFiles.filter((f) => {
  const s = stripComments(readFileSync(f, "utf8"));
  if (!s.includes('"use client"')) return false;
  // Un `import type` desaparece al compilar; sólo importa el import de valor.
  return /^import\s+(?!type\b)[^;]*from\s+"@\/lib\/(db\/(admin|client|storage)|security\/(env|session|admin-auth|quota|login-throttle)|payments\/mercadopago"|store\/(cart|orders|pricing|inventory))/m.test(
    s,
  );
});
check(
  "ningún componente cliente importa módulos de servidor como valor",
  leaky.length === 0,
  leaky.join(", "),
);

const rawSinks = clientFiles
  .concat(walk(join(ROOT, "src", "app")).filter((f) => f.endsWith(".tsx")))
  .filter((f) =>
    /dangerouslySetInnerHTML|\.innerHTML\s*=|eval\(/.test(
      stripComments(readFileSync(f, "utf8")),
    ),
  );
check(
  "no hay sumideros de HTML crudo (dangerouslySetInnerHTML/innerHTML/eval)",
  rawSinks.length === 0,
  rawSinks.join(", "),
);

console.log("\n--- B6. Webhook de Mercado Pago ---");

const webhook = read("src", "app", "api", "webhooks", "mercadopago", "route.ts");
check("el webhook verifica la firma", webhook.includes("verifyWebhookSignature"));
check(
  "el webhook reconsulta el pago al proveedor (no confía en el payload)",
  webhook.includes("fetchPayment"),
);
check(
  "el webhook compara el cobro con el pedido antes de marcar pagado",
  webhook.includes("paymentMismatchReason"),
);
check(
  "el webhook exige modo real en producción",
  webhook.includes("requireLivePayments"),
);
check(
  "la idempotencia se apoya en payment_events + processed_at",
  webhook.includes("payment_events") && webhook.includes("processed_at"),
);
check(
  "el pago aprobado se aplica con la función transaccional process_paid_order",
  webhook.includes("process_paid_order"),
);

console.log("\n--- B7. Freno de fuerza bruta del panel ---");

const login = read("src", "app", "api", "admin", "login", "route.ts");
check("el login consulta un bloqueo durable", login.includes("getAdminLoginLock"));
check(
  "el login registra los fallos de forma durable",
  login.includes("registerAdminLoginFailure"),
);
check(
  "el login limpia el contador al acertar",
  login.includes("clearAdminLoginFailures"),
);

const rateLimit = read("src", "lib", "security", "rate-limit.ts");
check(
  "getClientIp NO toma el primer elemento de x-forwarded-for (lo escribe el cliente)",
  !/x-forwarded-for[\s\S]{0,200}split\(","\)\[0\]/.test(rateLimit),
);
check(
  "getClientIp prefiere x-real-ip",
  /getClientIp[\s\S]{0,400}x-real-ip/.test(rateLimit),
);

console.log(
  failures === 0
    ? "\nTodo OK: contratos de validación y autorización intactos."
    : `\n${failures} verificación(es) fallida(s).`,
);
process.exit(failures === 0 ? 0 : 1);

/**
 * QA del precio por variante en Inventario (sin base de datos ni red).
 *
 * Verifica:
 *   - captura en el navegador: coma o punto decimal, vacío ≠ 0, negativos,
 *     más de dos decimales, separadores de miles y texto sobrante rechazados;
 *   - esquema de la API estricto (número JSON finito, 0…1,000,000, dos
 *     decimales, `price` obligatorio, sin llaves extra);
 *   - precio efectivo = variante ?? base, $0 real, "Sin precio" sin inventar 0;
 *   - `updateVariantPrice` con un cliente falso: sólo esa variante y sólo
 *     `price`, compare-and-swap (`eq`/`is null`), 409 temprano y por carrera,
 *     quitar el precio propio, sin base, mismo precio sin escribir, errores;
 *   - contratos de la ruta (sesión + CSRF, rate-limit, no-store, auditoría,
 *     sin movimientos de inventario) y que stock/estado sigan como en e1b9755b.
 *
 * Uso: npx tsx scripts/qa/admin-inventory-price.test.ts
 */
import { execSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// `inventory-price.ts` importa "server-only": se relanza con react-server.
if (!process.execArgv.join(" ").includes("react-server")) {
  const result = spawnSync(
    process.execPath,
    ["--conditions=react-server", "--import", "tsx", __filename],
    { stdio: "inherit", env: process.env },
  );
  process.exit(result.status ?? 1);
}

const ROOT = join(__dirname, "..", "..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8").replace(/\r\n/g, "\n");
/** Código sin comentarios: los contratos no deben fallar por la prosa. */
const code = (rel: string) =>
  read(rel).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
/** Commit de la última producción verificada (punto de partida de esta rama). */
const BASE_COMMIT = "e1b9755b6d9573aa83e9f724040f706c3fd09584";

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? " — " + detail : ""}`);
  if (!ok) failures += 1;
}

// ---------------------------------------------------------------------------
// Base falsa de product_variants/products que entiende la forma en que
// `updateVariantPrice` usa el Data API (select/eq/is/maybeSingle/update).
// ---------------------------------------------------------------------------
type Variant = {
  id: string;
  product_id: string | null;
  title: string;
  sku: string | null;
  price: number | null;
  stock: number;
  color: string | null;
  size: string | null;
  option_label: string | null;
  status: "disponible" | "agotado" | "sobre_pedido" | "oculto";
  created_at: string;
  updated_at: string;
};
type Call = {
  table: string;
  op: "select" | "update" | "insert";
  select?: string;
  filters: Array<[string, string, unknown]>;
  payload?: Record<string, unknown>;
};

function fakeDb(variants: Variant[], products: Record<string, { base_price: number }>) {
  const rows = new Map(variants.map((v) => [v.id, { ...v }]));
  const calls: Call[] = [];
  const hooks: { failRead?: boolean; failUpdate?: boolean; beforeUpdate?: () => void } = {};
  const client = {
    from(table: string) {
      const call: Call = { table, op: "select", filters: [] };
      calls.push(call);
      const matches = (row: Variant) =>
        call.filters.every(([kind, col, value]) =>
          kind === "eq"
            ? (row as unknown as Record<string, unknown>)[col] === value
            : (row as unknown as Record<string, unknown>)[col] === null && value === null,
        );
      const withJoin = (row: Variant) => ({
        ...row,
        products: row.product_id && products[row.product_id] ? { ...products[row.product_id] } : null,
      });
      const run = (single: boolean) => {
        if (table !== "product_variants") {
          return { data: null, error: { message: `tabla inesperada ${table}` } };
        }
        if (call.op === "select") {
          if (hooks.failRead) return { data: null, error: { message: "boom" } };
          const found = [...rows.values()].filter(matches).map(withJoin);
          return { data: single ? (found[0] ?? null) : found, error: null };
        }
        hooks.beforeUpdate?.();
        if (hooks.failUpdate) return { data: null, error: { message: "boom" } };
        const found = [...rows.values()].filter(matches);
        for (const row of found) Object.assign(row, call.payload, { updated_at: "2026-10-28T00:00:00Z" });
        return { data: call.select ? found.map((r) => ({ ...r })) : null, error: null };
      };
      const builder = {
        select(s: string) { call.select = s; return builder; },
        update(payload: Record<string, unknown>) { call.op = "update"; call.payload = payload; return builder; },
        insert(payload: Record<string, unknown>) { call.op = "insert"; call.payload = payload; return builder; },
        eq(col: string, value: unknown) { call.filters.push(["eq", col, value]); return builder; },
        is(col: string, value: unknown) { call.filters.push(["is", col, value]); return builder; },
        maybeSingle() { return Promise.resolve(run(true)); },
        then<A, B>(ok: (v: ReturnType<typeof run>) => A, ko?: (e: unknown) => B) {
          return Promise.resolve(run(false)).then(ok, ko);
        },
      };
      return builder;
    },
  };
  return { client, rows, calls, hooks };
}

const P1 = "11111111-1111-4111-8111-111111111111";
const P_ZERO = "22222222-2222-4222-8222-222222222222";
const V_BLACK = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1";
const V_WHITE = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2";
const V_OVERRIDE = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3";
const V_ORPHAN = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4";
const V_ZERO = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5";
const V_MISSING = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa9";

function seed() {
  const v = (id: string, product: string | null, fields: Partial<Variant>): Variant => ({
    id,
    product_id: product,
    title: "X",
    sku: null,
    price: null,
    stock: 5,
    color: null,
    size: null,
    option_label: null,
    status: "disponible",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...fields,
  });
  return fakeDb(
    [
      v(V_BLACK, P1, { title: "Negra / M", color: "Negra", size: "M", stock: 6 }),
      v(V_WHITE, P1, { title: "Blanca / M", color: "Blanca", size: "M", stock: 2 }),
      v(V_OVERRIDE, P1, { title: "Gris / L", price: 379, stock: 0, status: "agotado" }),
      v(V_ORPHAN, null, { title: "Huérfana", price: 50, stock: 1, status: "oculto" }),
      v(V_ZERO, P_ZERO, { title: "Pieza", stock: 3 }),
    ],
    { [P1]: { base_price: 349 }, [P_ZERO]: { base_price: 0 } },
  );
}

async function main() {
  const pricing = await import("../../src/lib/store/inventory-pricing");
  const { InventoryPriceUpdateSchema } = await import("../../src/lib/validation/inventory-price");
  const { updateVariantPrice } = await import("../../src/lib/store/inventory-price");
  const { presentInventoryEntries } = await import("../../src/lib/store/inventory-presentation");

  // -------------------------------------------------------------------------
  console.log("\n--- Captura en el navegador (parsePriceInput) ---");
  const accepted: Array<[string, number]> = [
    ["199", 199],
    ["199.5", 199.5],
    ["199,50", 199.5],
    ["  1299,9 ", 1299.9],
    ["$349", 349],
    ["$ 349.00", 349],
    ["0", 0],
    ["0,00", 0],
    [",5", 0.5],
    ["10.", 10],
    ["1000000", 1_000_000],
    ["0.29", 0.29],
  ];
  for (const [text, value] of accepted) {
    const r = pricing.parsePriceInput(text);
    check(`"${text}" → ${value}`, r.ok && r.value === value, JSON.stringify(r));
  }
  const rejected = ["", "   ", "$", "-5", "-0,5", "1,234", "1.234,50", "1,234.50", "12abc", "abc", "1e5", "0x10", "Infinity", "NaN", "1000000.01", "2000000", "19.999", ".", ",", "1 000"];
  for (const text of rejected) {
    const r = pricing.parsePriceInput(text);
    // "1 000" quita espacios → 1000: es aceptable, se excluye abajo.
    if (text === "1 000") {
      check(`"1 000" sin espacios → 1000 (no ambiguo)`, r.ok && r.value === 1000);
      continue;
    }
    check(`"${text}" rechazado`, !r.ok, JSON.stringify(r));
  }
  const empty = pricing.parsePriceInput("");
  check("vacío nunca se vuelve 0", !empty.ok && empty.error === "Escribe un precio.");
  const neg = pricing.parsePriceInput("-5");
  check("negativo con mensaje propio", !neg.ok && /negativo/.test(neg.error));
  const thousands = pricing.parsePriceInput("1,234");
  check("'1,234' no se adivina como 1234 ni 1.234", !thousands.ok && /decimales/.test(thousands.error));

  // -------------------------------------------------------------------------
  console.log("\n--- Monto válido y formato ---");
  check("isValidPriceAmount acepta 0, 0.29, 199.5, 1e6", [0, 0.29, 199.5, 1_000_000].every(pricing.isValidPriceAmount));
  check(
    "isValidPriceAmount rechaza negativos, NaN, ∞, >1e6, 3 decimales, 1e-7 y cadenas",
    [-1, -0.01, NaN, Infinity, -Infinity, 1_000_000.01, 19.999, 1e-7, "199", null, undefined].every((v) => !pricing.isValidPriceAmount(v)),
  );
  check("formato $0.00 para cero real", pricing.formatInventoryPrice(0) === "$0.00", pricing.formatInventoryPrice(0));
  check("formato MXN con miles", pricing.formatInventoryPrice(1299.5) === "$1,299.50", pricing.formatInventoryPrice(1299.5));
  check("null → 'Sin precio'", pricing.formatInventoryPrice(null) === "Sin precio");
  check("valor inicial del campo con dos decimales", pricing.priceInputValue(199.5) === "199.50" && pricing.priceInputValue(null) === "");
  check("samePriceAmount compara centavos", pricing.samePriceAmount(0.1 + 0.2, 0.3) && !pricing.samePriceAmount(0, null) && pricing.samePriceAmount(null, null));

  // -------------------------------------------------------------------------
  console.log("\n--- Precio efectivo (variante ?? base) ---");
  const r1 = pricing.resolveInventoryPricing(379, 349);
  check("precio de variante manda", r1.effective === 379 && r1.source === "variant" && r1.base === 349);
  const r2 = pricing.resolveInventoryPricing(null, 349);
  check("sin precio de variante hereda base", r2.effective === 349 && r2.source === "base" && r2.override === null);
  const r3 = pricing.resolveInventoryPricing(null, 0);
  check("base 0 se muestra 0 (no 'Sin precio')", r3.effective === 0 && r3.source === "base");
  const r4 = pricing.resolveInventoryPricing(0, 349);
  check("variante 0 se muestra 0", r4.effective === 0 && r4.source === "variant");
  const r5 = pricing.resolveInventoryPricing(null, null);
  check("sin variante ni base → Sin precio (null, no 0)", r5.effective === null && r5.source === "none");
  const r6 = pricing.resolveInventoryPricing("199.50", "349.00");
  check("numeric como texto también se lee", r6.effective === 199.5 && r6.base === 349);
  const r7 = pricing.resolveInventoryPricing(-1, "x");
  check("valores inválidos no se inventan", r7.effective === null && r7.source === "none");

  const base = {
    sku: null, color: null, size: null, option_label: null,
    status: "disponible" as const, stock: 4,
    created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
  };
  const product = (base_price: number | null) => ({
    title: "Playera", handle: "wear-lista-wr001", images: [], base_price,
    categories: { handle: "playeras-prendas", title: "Playeras" },
  });
  const presented = presentInventoryEntries([
    { ...base, id: "a", product_id: "p", title: "Negra / M", price: null, color: "Negra", products: product(349) },
    { ...base, id: "b", product_id: "p", title: "Blanca / M", price: 379, color: "Blanca", products: product(349) },
    { ...base, id: "c", product_id: "q", title: "Pieza", price: null, products: product(0) },
    { ...base, id: "d", product_id: "x", title: "Huérfana", price: null, products: null },
    { ...base, id: "e", product_id: "x", title: "Huérfana con precio", price: 50, products: null },
  ]);
  const byId = Object.fromEntries(presented.map((r) => [r.id, r]));
  check("fila hereda base", byId.a.pricing.effective === 349 && byId.a.pricing.source === "base");
  check("fila con precio propio", byId.b.pricing.effective === 379 && byId.b.pricing.source === "variant");
  check("fila con base $0", byId.c.pricing.effective === 0);
  check("huérfana sin precio → Sin precio", byId.d.pricing.effective === null && byId.d.pricing.source === "none");
  check("huérfana con precio propio lo conserva", byId.e.pricing.effective === 50 && byId.e.pricing.base === null);
  check("fotos y bloque intactos al sumar precio", byId.a.display.block === "wear" && byId.b.display.thumbnail === "/images/matrixlab-wear/colors/wr001-blanca.webp");
  check("stock/estado intactos al sumar precio", presented.every((r) => r.stock === 4 && r.status === "disponible"));

  // -------------------------------------------------------------------------
  console.log("\n--- Esquema de la API (estricto) ---");
  const ok = (body: unknown) => InventoryPriceUpdateSchema.safeParse(body).success;
  check("precio válido", ok({ variantId: V_BLACK, price: 399.5, expectedPrice: null }));
  check("precio 0 válido", ok({ variantId: V_BLACK, price: 0, expectedPrice: 349 }));
  check("price null (quitar precio propio) válido", ok({ variantId: V_OVERRIDE, price: null, expectedPrice: 379 }));
  check("tope 1,000,000 válido", ok({ variantId: V_BLACK, price: 1_000_000, expectedPrice: null }));
  const bad: Array<[string, unknown]> = [
    ["sin price", { variantId: V_BLACK, expectedPrice: null }],
    ["sin expectedPrice", { variantId: V_BLACK, price: 10 }],
    ["price como texto", { variantId: V_BLACK, price: "199.50", expectedPrice: null }],
    ["price con coma", { variantId: V_BLACK, price: "199,50", expectedPrice: null }],
    ["price vacío", { variantId: V_BLACK, price: "", expectedPrice: null }],
    ["negativo", { variantId: V_BLACK, price: -1, expectedPrice: null }],
    ["> 1,000,000", { variantId: V_BLACK, price: 1_000_000.01, expectedPrice: null }],
    ["3 decimales", { variantId: V_BLACK, price: 19.999, expectedPrice: null }],
    ["exponente diminuto", { variantId: V_BLACK, price: 1e-7, expectedPrice: null }],
    ["llave extra (stock)", { variantId: V_BLACK, price: 10, expectedPrice: null, stock: 99 }],
    ["llave extra (base)", { variantId: V_BLACK, price: 10, expectedPrice: null, basePrice: 1 }],
    ["variantId no uuid", { variantId: "abc", price: 10, expectedPrice: null }],
    ["expectedPrice negativo", { variantId: V_BLACK, price: 10, expectedPrice: -1 }],
    ["expectedPrice texto", { variantId: V_BLACK, price: 10, expectedPrice: "349" }],
    ["cuerpo nulo", null],
    ["arreglo", [{ variantId: V_BLACK, price: 10, expectedPrice: null }]],
  ];
  for (const [name, body] of bad) check(`rechaza ${name}`, !ok(body));
  // JSON no puede transportar NaN/∞ (se vuelven null) pero el esquema también los corta.
  check("rechaza NaN e ∞ si llegaran", !ok({ variantId: V_BLACK, price: NaN, expectedPrice: null }) && !ok({ variantId: V_BLACK, price: Infinity, expectedPrice: null }));

  // -------------------------------------------------------------------------
  console.log("\n--- updateVariantPrice (cliente falso) ---");
  {
    const db = seed();
    const before = structuredClone([...db.rows.values()]);
    const r = await updateVariantPrice({ variantId: V_BLACK, price: 399.5, expectedPrice: null }, db.client as never);
    const updates = db.calls.filter((c) => c.op === "update");
    check("guarda precio nuevo", r.ok && r.changed && r.variant.price === 399.5 && r.oldPrice === null);
    check("respuesta con precio efectivo de variante", r.ok && r.pricing.effective === 399.5 && r.pricing.source === "variant" && r.pricing.base === 349);
    check("UN solo UPDATE y sólo la columna price", updates.length === 1 && JSON.stringify(updates[0].payload) === JSON.stringify({ price: 399.5 }));
    check(
      "condición id + price IS NULL (compare-and-swap)",
      JSON.stringify(updates[0].filters) === JSON.stringify([["eq", "id", V_BLACK], ["is", "price", null]]),
      JSON.stringify(updates[0].filters),
    );
    check("devuelve la fila actualizada (select *)", updates[0].select === "*");
    const after = db.rows;
    check("stock/estado/color de la variante intactos", after.get(V_BLACK)!.stock === 6 && after.get(V_BLACK)!.status === "disponible" && after.get(V_BLACK)!.color === "Negra");
    check(
      "otras tallas/colores intactos",
      before.filter((v) => v.id !== V_BLACK).every((v) => JSON.stringify(v) === JSON.stringify(after.get(v.id))),
    );
    check("sólo toca product_variants (ni products ni inventory_movements)", db.calls.every((c) => c.table === "product_variants") && db.calls.every((c) => c.op !== "insert"));
  }
  {
    const db = seed();
    const r = await updateVariantPrice({ variantId: V_OVERRIDE, price: 400, expectedPrice: 379 }, db.client as never);
    const u = db.calls.find((c) => c.op === "update")!;
    check("con precio previo la condición es price = esperado", r.ok && JSON.stringify(u.filters) === JSON.stringify([["eq", "id", V_OVERRIDE], ["eq", "price", 379]]));
    check("agotado sigue agotado y stock 0", db.rows.get(V_OVERRIDE)!.status === "agotado" && db.rows.get(V_OVERRIDE)!.stock === 0);
  }
  {
    const db = seed();
    const r = await updateVariantPrice({ variantId: V_BLACK, price: 0, expectedPrice: null }, db.client as never);
    check("precio 0 se guarda como 0 (no null)", r.ok && db.rows.get(V_BLACK)!.price === 0 && r.pricing.effective === 0 && r.pricing.source === "variant");
  }
  {
    const db = seed();
    const r = await updateVariantPrice({ variantId: V_BLACK, price: 500, expectedPrice: 349 }, db.client as never);
    check(
      "409 temprano: el esperado no coincide (hereda base, no 349 propio)",
      !r.ok && r.error === "CONFLICT" && r.pricing.override === null && db.calls.every((c) => c.op !== "update"),
    );
  }
  {
    const db = seed();
    db.hooks.beforeUpdate = () => { db.rows.get(V_OVERRIDE)!.price = 420; }; // otro dispositivo, entre lectura y escritura
    const r = await updateVariantPrice({ variantId: V_OVERRIDE, price: 400, expectedPrice: 379 }, db.client as never);
    check(
      "409 por carrera: el UPDATE condicionado no toca nada y se informa el vigente",
      !r.ok && r.error === "CONFLICT" && r.pricing.effective === 420 && db.rows.get(V_OVERRIDE)!.price === 420,
    );
  }
  {
    const db = seed();
    const r = await updateVariantPrice({ variantId: V_OVERRIDE, price: null, expectedPrice: 379 }, db.client as never);
    check(
      "quitar precio propio → vuelve a la base",
      r.ok && r.changed && db.rows.get(V_OVERRIDE)!.price === null && r.pricing.source === "base" && r.pricing.effective === 349 && r.oldPrice === 379,
    );
  }
  {
    const db = seed();
    const r = await updateVariantPrice({ variantId: V_ORPHAN, price: null, expectedPrice: 50 }, db.client as never);
    check("quitar precio sin producto/base → NO_BASE_PRICE sin escribir", !r.ok && r.error === "NO_BASE_PRICE" && db.rows.get(V_ORPHAN)!.price === 50 && db.calls.every((c) => c.op !== "update"));
  }
  {
    const db = seed();
    const r = await updateVariantPrice({ variantId: V_ZERO, price: 15, expectedPrice: null }, db.client as never);
    check("producto con base $0 acepta precio propio", r.ok && r.pricing.effective === 15 && r.pricing.base === 0);
  }
  {
    const db = seed();
    const r = await updateVariantPrice({ variantId: V_OVERRIDE, price: 379, expectedPrice: 379 }, db.client as never);
    check("mismo precio → changed:false y sin UPDATE", r.ok && !r.changed && db.calls.every((c) => c.op !== "update"));
  }
  {
    const db = seed();
    const r = await updateVariantPrice({ variantId: V_MISSING, price: 10, expectedPrice: null }, db.client as never);
    check("variante inexistente → NOT_FOUND sin escribir", !r.ok && r.error === "NOT_FOUND" && db.calls.every((c) => c.op !== "update"));
  }
  {
    const db = seed();
    db.hooks.failRead = true;
    const r = await updateVariantPrice({ variantId: V_BLACK, price: 10, expectedPrice: null }, db.client as never);
    check("error de lectura → UPDATE_FAILED sin escribir", !r.ok && r.error === "UPDATE_FAILED" && db.rows.get(V_BLACK)!.price === null);
  }
  {
    const db = seed();
    db.hooks.failUpdate = true;
    const r = await updateVariantPrice({ variantId: V_BLACK, price: 10, expectedPrice: null }, db.client as never);
    check("error del UPDATE → UPDATE_FAILED", !r.ok && r.error === "UPDATE_FAILED" && db.rows.get(V_BLACK)!.price === null);
  }

  // -------------------------------------------------------------------------
  console.log("\n--- Contratos de la ruta y del cliente ---");
  const route = read("src/app/api/admin/inventory/price/route.ts");
  const handlers = [...route.matchAll(/export async function (\w+)/g)].map((m) => m[1]);
  check("sólo PATCH", handlers.join(",") === "PATCH", handlers.join(","));
  check("sesión + CSRF antes de leer el cuerpo", route.indexOf("requireAdminMutation(request)") > 0 && route.indexOf("requireAdminMutation(request)") < route.indexOf("readJsonBody(request)"));
  check("rate-limit admin existente", route.includes('checkRateLimit(`admin-api:${ip}`, RATE_LIMITS.adminApi)'));
  check("esquema dedicado + helper dedicado", route.includes("InventoryPriceUpdateSchema.safeParse(body)") && route.includes("updateVariantPrice(parsed.data)"));
  check("todas las respuestas no-store", (route.match(/return noStore\(/g) ?? []).length >= 8 && !/\n\s+return (?!noStore)/.test(route.slice(route.indexOf("export async function PATCH"))));
  check("auditoría inventory.price_update con old/new", route.includes('action: "inventory.price_update"') && route.includes("old_price: result.oldPrice") && route.includes("new_price: result.pricing.override"));
  check("409 con el precio vigente", route.includes("status: 409") && route.includes("pricing: result.pricing"));
  check("sin stock/estado/movimientos en la ruta de precio", !/adjustStock|inventory_movements|stock|status:\s*parsed/.test(code("src/app/api/admin/inventory/price/route.ts").replace(/Cache-Control|no-store/g, "")));
  check("errores genéricos (sin error.message hacia el cliente)", !/error\.message|String\(error\)|\.details/.test(route));

  const helper = read("src/lib/store/inventory-price.ts");
  check("helper server-only con cliente inyectable", helper.startsWith('import "server-only";') && helper.includes("client: PriceClient = requireServiceClient()"));
  check("helper sólo actualiza price", (helper.match(/\.update\(/g) ?? []).length === 1 && helper.includes(".update({ price: params.price })"));
  check("helper no toca products ni inventory_movements", !/from\("products"\)|inventory_movements|base_price:\s*params/.test(code("src/lib/store/inventory-price.ts")));

  const cell = read("src/components/admin/InventoryPriceCell.tsx");
  const send = cell.slice(cell.indexOf("async function send("), cell.indexOf("function save("));
  check("readOnly y busy cortan antes del fetch", send.indexOf("if (readOnly)") > -1 && send.indexOf(".busy) return") < send.indexOf("fetch(") && send.indexOf("if (readOnly)") < send.indexOf("fetch("));
  check("PATCH a la ruta nueva con cabecera CSRF", cell.includes('const PRICE_ENDPOINT = "/api/admin/inventory/price"') && send.includes('method: "PATCH"') && send.includes("[CSRF_HEADER]: csrf") && cell.includes('const CSRF_HEADER = "x-ml-csrf"'));
  check("guardado explícito: nunca onBlur", !/onBlur/.test(cell));
  check(
    "expectedPrice = precio visto al ABRIR (no el de la fila refrescada)",
    cell.includes("opened: shown }") && send.includes("const expectedPrice = (store.get(row.id).opened ?? shown).override;") && send.includes("body: JSON.stringify({ variantId: row.id, price, expectedPrice })") && !send.includes("expectedPrice: shown.override"),
  );
  check(
    "timeout de 15 s con AbortController, timer liberado siempre y sin afirmar que no se guardó",
    cell.includes("const SAVE_TIMEOUT_MS = 15_000;") && send.includes("signal: controller.signal") && send.includes("finally {\n      clearTimeout(timer);") && send.includes("No pudimos confirmar el guardado. Revisa tu conexión y el precio actual antes de reintentar."),
  );
  check("sin parseFloat/parseInt silenciosos", !/parseFloat|parseInt/.test(code("src/components/admin/InventoryPriceCell.tsx") + code("src/lib/store/inventory-pricing.ts")));
  check("campo decimal ≥16px (text-base) y objetivos ≥44px", cell.includes('inputMode="decimal"') && /className="min-h-11[^"]*text-base/.test(cell) && (cell.match(/min-h-11/g) ?? []).length >= 4);
  check("cifra sin salto y tabular", cell.includes("whitespace-nowrap font-semibold tabular-nums"));
  check("cancelar no llama a la API", (() => { const c = cell.slice(cell.indexOf("function cancel("), cell.indexOf("async function send(")); return !c.includes("fetch(") && !c.includes("send("); })());
  check("componentes cliente sin módulos de servidor", !/server-only|lib\/db\/admin|lib\/store\/(inventory|inventory-price|products)"/.test(cell + read("src/lib/store/inventory-pricing.ts")));
  const table = read("src/components/admin/InventoryTable.tsx");
  check("tabla: columna Precio MXN y colSpan 7", table.includes('header: "Precio MXN"') && table.includes("colSpan={7}"));

  // -------------------------------------------------------------------------
  console.log(`\n--- Stock/estado/checkout intactos respecto a ${BASE_COMMIT.slice(0, 8)} ---`);
  let unchanged = "";
  try {
    unchanged = execSync(
      `git diff --name-only ${BASE_COMMIT} -- src/app/api/admin/inventory/route.ts src/lib/validation/admin.ts src/lib/store/pricing.ts src/lib/store/cart.ts src/lib/store/orders.ts src/app/api/checkout src/lib/db/types.ts supabase`,
      { cwd: ROOT, encoding: "utf8" },
    ).trim();
    check("ruta de stock, validación admin, precios de checkout, tipos y SQL sin cambios", unchanged === "", unchanged);
  } catch {
    console.log("(sin git o sin el commit base: se omite la comparación)");
  }
  try {
    const baseInventory = execSync(`git show ${BASE_COMMIT}:src/lib/store/inventory.ts`, { cwd: ROOT, encoding: "utf8" }).replace(/\r\n/g, "\n");
    const current = read("src/lib/store/inventory.ts");
    check(
      "inventory.ts: el único cambio es base_price en el select",
      baseInventory.replace("images, categories(handle, title))", "images, base_price, categories(handle, title))") === current,
    );
  } catch {
    console.log("(sin git o sin el commit base: se omite la comparación de inventory.ts)");
  }

  console.log(failures === 0 ? "\nTodo OK." : `\n${failures} fallo(s).`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Error");
  process.exit(1);
});

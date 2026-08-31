/**
 * QA de la UNIDAD COMERCIAL en carrito y checkout.
 *
 * MatrixLab Stickers se vende por PLANILLA: 1 = 1 planilla completa, $85 cada
 * una. El resto del catálogo (Tumbler, Laboratorio, Wear, 3D) se sigue
 * vendiendo por pieza y su copy NO cambia. Este QA valida las dos mitades:
 * que la planilla diga "planilla" y que lo demás siga exactamente igual.
 *
 * También valida que la unidad sea SIEMPRE del servidor: el carrito acepta
 * ids y cantidad, nada más, así que el cliente no puede declarar su unidad ni
 * su precio.
 *
 * Correr con: npx tsx scripts/qa/cart-units.test.ts
 *
 * `src/lib/store/pricing.ts` lleva `import "server-only"`, que en Node plano
 * lanza. Para probar el precio REAL —y no una copia de la fórmula— el script
 * se relanza a sí mismo con la condición `react-server`, la misma que usa el
 * servidor de Next. Por eso los imports del cuerpo son DINÁMICOS: un import
 * estático se ejecutaría antes del relanzamiento y volvería a lanzar.
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const RELAUNCH_FLAG = "MATRIXLAB_QA_RSC";
if (!process.env[RELAUNCH_FLAG]) {
  // process.execArgv trae el loader de tsx: el hijo sigue entendiendo TS.
  const result = spawnSync(
    process.execPath,
    [...process.execArgv, "--conditions=react-server", __filename],
    { stdio: "inherit", env: { ...process.env, [RELAUNCH_FLAG]: "1" } },
  );
  process.exit(result.status ?? 1);
}

const ROOT = join(__dirname, "..", "..");

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? " — " + detail : ""}`);
  if (!ok) failures += 1;
}

/** Código sin comentarios: lo que la UI muestra de verdad. */
function code(...path: string[]): string {
  return readFileSync(join(ROOT, ...path), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|\s)\/\/.*$/gm, "$1");
}

async function main() {
  const { commercialUnitOf } = await import(
    "../../src/lib/store/curated-lines"
  );
  const { MATRIXLAB_STICKERS } = await import(
    "../../src/lib/store/matrixlab-stickers"
  );
  const { MATRIXLAB_WEAR, matrixLabWearHandle } = await import(
    "../../src/lib/store/matrixlab-wear"
  );
  const { TUMBLER_SPARKLES, sparkleHandle } = await import(
    "../../src/lib/store/tumbler-sparkles"
  );
  const { computeTotals, resolveUnitPrice } = await import(
    "../../src/lib/store/pricing"
  );
  const { CartAddItemSchema, CartUpdateItemSchema } = await import(
    "../../src/lib/validation/cart"
  );
  const {
    formatQuantityWithUnit,
    formatUnitQuantity,
    sharedCommercialUnit,
  } = await import("../../src/lib/utils");
  const utilsSource = code("src", "lib", "utils.ts");

  /** Precio confirmado de la línea: $85 por planilla. */
  const SHEET_PRICE = 85;
  const SHEET_HANDLE = MATRIXLAB_STICKERS[0].handle;
  const SPARKLE_HANDLE = sparkleHandle(TUMBLER_SPARKLES[0].code);
  const UV_STICKER_HANDLE = "sticker-a001";

  // -------------------------------------------------------------------------
  // 1) Cantidad con unidad: 1 planilla / 2 planillas / 3 planillas.
  // -------------------------------------------------------------------------
  const sheetUnit = commercialUnitOf(SHEET_HANDLE);
  check(
    "la planilla resuelve unidad en servidor",
    sheetUnit?.one === "planilla" && sheetUnit?.many === "planillas",
    JSON.stringify(sheetUnit),
  );
  for (const [quantity, expected] of [
    [1, "1 planilla"],
    [2, "2 planillas"],
    [3, "3 planillas"],
  ] as const) {
    check(
      `cantidad ${quantity} se muestra como "${expected}"`,
      formatUnitQuantity(quantity, sheetUnit) === expected,
      `${formatUnitQuantity(quantity, sheetUnit)}`,
    );
  }
  // El texto prohibido: una planilla nunca se cuenta en piezas.
  check(
    'ninguna cantidad de planillas se escribe como "piezas"',
    [1, 2, 3, 10].every(
      (q) => !/pieza/i.test(formatUnitQuantity(q, sheetUnit) ?? ""),
    ),
  );

  // -------------------------------------------------------------------------
  // 2) Regresión: lo que se vende por pieza NO cambia de copy.
  // -------------------------------------------------------------------------
  for (const [label, handle] of [
    ["Sparkles", SPARKLE_HANDLE],
    ["UV Stickers Tumbler", UV_STICKER_HANDLE],
    ["Vasos", "vaso-snow-globe-24oz"],
    ["MatrixLab Wear", matrixLabWearHandle(MATRIXLAB_WEAR[0].code)],
    ["Laboratorio (legacy)", "planilla-stickers"],
    ["Playera del Laboratorio", "playera-personalizada"],
  ] as const) {
    check(
      `${label} sigue sin unidad propia (copy genérico intacto)`,
      commercialUnitOf(handle) === null &&
        formatUnitQuantity(2, commercialUnitOf(handle)) === null,
    );
  }

  // -------------------------------------------------------------------------
  // 3) Subtotales con el resolver REAL de precios del servidor.
  // -------------------------------------------------------------------------
  const product = { base_price: SHEET_PRICE } as Parameters<
    typeof resolveUnitPrice
  >[0];
  const variant = { price: SHEET_PRICE } as Parameters<
    typeof resolveUnitPrice
  >[1];
  const unitPrice = resolveUnitPrice(product, variant);
  check(
    `precio unitario resuelto = $${SHEET_PRICE}`,
    unitPrice === SHEET_PRICE,
    `${unitPrice}`,
  );
  for (const [quantity, expected] of [
    [1, 85],
    [2, 170],
    [3, 255],
  ] as const) {
    const totals = computeTotals([{ quantity, unitPrice }]);
    check(
      `${quantity} × $${SHEET_PRICE} = $${expected}`,
      totals.subtotal === expected && totals.total === expected,
      `${totals.subtotal}`,
    );
  }
  // Sin precio de variante manda el precio base del producto: nunca 0, y nunca
  // un número que venga del cliente.
  check(
    "sin variante, el precio sale del producto",
    resolveUnitPrice(product, null) === SHEET_PRICE,
  );

  // -------------------------------------------------------------------------
  // 4) El cliente NO puede falsificar unidad ni precio.
  // -------------------------------------------------------------------------
  const validPayload = {
    productId: "11111111-1111-4111-8111-111111111111",
    variantId: "22222222-2222-4222-8222-222222222222",
    quantity: 2,
  };
  check(
    "el carrito acepta el payload legítimo (ids + cantidad)",
    CartAddItemSchema.safeParse(validPayload).success,
  );
  for (const [label, extra] of [
    ["unitLabel", { unitLabel: { one: "caja", many: "cajas" } }],
    ["unit", { unit: "pieza" }],
    ["unitPrice", { unitPrice: 1 }],
    ["price", { price: 1 }],
    ["lineTotal", { lineTotal: 1 }],
  ] as const) {
    check(
      `el carrito RECHAZA ${label} enviado por el cliente`,
      !CartAddItemSchema.safeParse({ ...validPayload, ...extra }).success,
    );
  }
  check(
    "actualizar cantidad tampoco admite campos extra",
    CartUpdateItemSchema.safeParse({ quantity: 2 }).success &&
      !CartUpdateItemSchema.safeParse({
        quantity: 2,
        unitLabel: { one: "caja", many: "cajas" },
      }).success,
  );

  // -------------------------------------------------------------------------
  // 5) El servidor arma la unidad y el precio de cada línea.
  // -------------------------------------------------------------------------
  const cartSource = code("src", "lib", "store", "cart.ts");
  check(
    "la unidad de la línea se resuelve desde el producto de la base",
    /unitLabel: commercialUnitOf\(product\.handle\)/.test(cartSource),
  );
  check(
    "el precio de la línea se resuelve en servidor",
    /const unitPrice = resolveUnitPrice\(product, variant\)/.test(cartSource),
  );
  check(
    "la unidad no se lee de la petición",
    !/(body|params|input|request)[^\n]*unitLabel/i.test(cartSource),
  );

  // -------------------------------------------------------------------------
  // 6) Copy de la UI: la planilla no vuelve a contarse en piezas, y lo demás
  //    conserva el suyo.
  // -------------------------------------------------------------------------
  const lineItem = code("src", "components", "store", "CartLineItem.tsx");
  const summary = code("src", "components", "store", "CartSummary.tsx");
  const checkout = code("src", "components", "store", "CheckoutForm.tsx");

  check(
    "la línea del carrito muestra la cantidad con su unidad",
    /formatUnitQuantity\(line\.quantity, line\.unitLabel\)/.test(lineItem),
  );
  check(
    'la línea con unidad propia muestra "/ planilla" en vez de "c/u"',
    /\/ \{line\.unitLabel\.one\}/.test(lineItem),
  );
  check(
    'las líneas sin unidad propia conservan "c/u"',
    /c\/u/.test(lineItem),
  );
  check(
    "el resumen usa la unidad compartida del carrito",
    /formatQuantityWithUnit\(count, sharedCommercialUnit\(items\)\)/.test(
      summary,
    ),
  );
  const badge = code("src", "components", "store", "CartBadge.tsx");
  check(
    "el badge del header también cuenta con la unidad compartida",
    /formatQuantityWithUnit\(count, unit\)/.test(badge) &&
      /sharedCommercialUnit\(cart\?\.items \?\? \[\]\)/.test(badge),
  );
  // El respaldo genérico vive en UN solo lugar (formatQuantityWithUnit), no
  // copiado en cada componente: cambiar "piezas" no puede quedar a medias.
  check(
    'el respaldo genérico "pieza/piezas" tiene una sola definición',
    /quantity === 1 \? "pieza" : "piezas"/.test(utilsSource) &&
      !/"pieza" : "piezas"/.test(summary) &&
      !/"pieza" : "piezas"/.test(badge),
  );
  check(
    "carrito mixto o genérico cae al respaldo",
    formatQuantityWithUnit(2, null) === "2 piezas" &&
      formatQuantityWithUnit(1, null) === "1 pieza" &&
      formatQuantityWithUnit(2, sheetUnit) === "2 planillas",
  );
  // Dos unidades distintas nunca se colapsan en una sola etiqueta.
  check(
    "el resumen no mezcla unidades distintas",
    sharedCommercialUnit([
      { unitLabel: sheetUnit },
      { unitLabel: { one: "planilla", many: "hojas" } },
    ]) === null &&
      sharedCommercialUnit([{ unitLabel: sheetUnit }, { unitLabel: null }]) ===
        null &&
      sharedCommercialUnit([
        { unitLabel: sheetUnit },
        { unitLabel: sheetUnit },
      ])?.many === "planillas",
  );
  check(
    "el checkout nombra la unidad de cada línea",
    /formatUnitQuantity\(line\.quantity, line\.unitLabel\)/.test(checkout),
  );

  console.log(
    failures === 0
      ? '\n✓ QA unidades de carrito OK — "planilla/planillas" en MatrixLab Stickers, "pieza" intacta en el resto, unidad y precio resueltos en servidor.'
      : `\n✗ QA unidades de carrito: ${failures} fallo(s).`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

void main();

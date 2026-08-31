/**
 * QA de SEGURIDAD del cobro (Mercado Pago).
 *
 * Cubre las tres reglas que impiden que un pedido se marque pagado sin que
 * haya entrado el dinero correcto:
 *
 *   1. La firma del webhook CADUCA. Un HMAC válido no expira solo: sin ventana
 *      de frescura, una notificación capturada se puede reenviar para siempre.
 *   2. El COBRO tiene que cuadrar con el pedido. `external_reference` dice a
 *      qué pedido apunta el pago, no cuánto se cobró: un pago parcial, en otra
 *      moneda, o de sandbox no debe liberar producción ni descontar inventario.
 *   3. Un campo ausente NO se interpreta como "está bien" (fail-closed).
 *
 * Correr con: npx tsx scripts/qa/security-payments.test.ts
 */
import {
  AMOUNT_TOLERANCE,
  isSignatureTimestampFresh,
  paymentMismatchReason,
  SIGNATURE_MAX_AGE_SECONDS,
} from "../../src/lib/payments/mercadopago-core";

let failures = 0;
function check(name: string, ok: boolean, detail?: unknown) {
  console.log(`${ok ? "✓" : "✗"} ${name}`);
  if (!ok) {
    failures += 1;
    if (detail !== undefined) console.log(JSON.stringify(detail, null, 2));
  }
}

// ---------------------------------------------------------------------------
// 1. Frescura del `ts` de x-signature (anti-replay)
// ---------------------------------------------------------------------------
const NOW = 1_800_000_000_000; // instante fijo para que el QA sea determinista
const nowSeconds = Math.floor(NOW / 1000);

check(
  "acepta un ts del momento actual",
  isSignatureTimestampFresh(String(nowSeconds), NOW),
);

check(
  "acepta un ts dentro de la ventana (5 min de antigüedad)",
  isSignatureTimestampFresh(String(nowSeconds - 5 * 60), NOW),
);

check(
  "RECHAZA un ts fuera de la ventana (replay de 1 hora después)",
  !isSignatureTimestampFresh(String(nowSeconds - 60 * 60), NOW),
);

check(
  "RECHAZA un ts del futuro lejano (reloj manipulado)",
  !isSignatureTimestampFresh(String(nowSeconds + 60 * 60), NOW),
);

check(
  "tolera desviación pequeña de reloj hacia el futuro",
  isSignatureTimestampFresh(String(nowSeconds + 60), NOW),
);

check(
  "acepta ts en milisegundos (integraciones que lo mandan así)",
  isSignatureTimestampFresh(String(NOW), NOW),
);

check("RECHAZA ts no numérico", !isSignatureTimestampFresh("abc", NOW));
check("RECHAZA ts vacío", !isSignatureTimestampFresh("", NOW));
check("RECHAZA ts negativo", !isSignatureTimestampFresh("-1", NOW));

check(
  "el límite documentado son 15 minutos",
  SIGNATURE_MAX_AGE_SECONDS === 15 * 60,
);

// ---------------------------------------------------------------------------
// 2. Integridad del cobro contra el pedido
// ---------------------------------------------------------------------------
const BASE = {
  orderTotal: 850,
  expectedCurrency: "MXN",
  requireLiveMode: true,
} as const;

check(
  "acepta el pago exacto del total",
  paymentMismatchReason({
    ...BASE,
    transactionAmount: 850,
    currencyId: "MXN",
    liveMode: true,
  }) === null,
);

check(
  "acepta un cobro mayor al total (propina/redondeo del proveedor)",
  paymentMismatchReason({
    ...BASE,
    transactionAmount: 851,
    currencyId: "MXN",
    liveMode: true,
  }) === null,
);

check(
  "acepta una diferencia de un centavo por redondeo",
  paymentMismatchReason({
    ...BASE,
    transactionAmount: 850 - AMOUNT_TOLERANCE,
    currencyId: "MXN",
    liveMode: true,
  }) === null,
);

check(
  "RECHAZA un pago parcial (paga $1 un pedido de $850)",
  paymentMismatchReason({
    ...BASE,
    transactionAmount: 1,
    currencyId: "MXN",
    liveMode: true,
  }) === "AMOUNT_MISMATCH",
);

check(
  "RECHAZA un pago de $0",
  paymentMismatchReason({
    ...BASE,
    transactionAmount: 0,
    currencyId: "MXN",
    liveMode: true,
  }) === "AMOUNT_MISMATCH",
);

check(
  "RECHAZA un pago negativo",
  paymentMismatchReason({
    ...BASE,
    transactionAmount: -850,
    currencyId: "MXN",
    liveMode: true,
  }) === "AMOUNT_MISMATCH",
);

check(
  "RECHAZA otra moneda aunque el número cuadre (850 USD ≠ 850 MXN)",
  paymentMismatchReason({
    ...BASE,
    transactionAmount: 850,
    currencyId: "USD",
    liveMode: true,
  }) === "CURRENCY_MISMATCH",
);

check(
  "RECHAZA un pago de sandbox cuando se exige modo real",
  paymentMismatchReason({
    ...BASE,
    transactionAmount: 850,
    currencyId: "MXN",
    liveMode: false,
  }) === "TEST_PAYMENT_IN_PRODUCTION",
);

check(
  "permite pagos de prueba cuando NO se exige modo real (desarrollo)",
  paymentMismatchReason({
    ...BASE,
    requireLiveMode: false,
    transactionAmount: 850,
    currencyId: "MXN",
    liveMode: false,
  }) === null,
);

// ---------------------------------------------------------------------------
// 3. Fail-closed: lo que no se puede verificar, no se aprueba
// ---------------------------------------------------------------------------
check(
  "RECHAZA cuando el proveedor no declara monto",
  paymentMismatchReason({
    ...BASE,
    transactionAmount: null,
    currencyId: "MXN",
    liveMode: true,
  }) === "AMOUNT_MISMATCH",
);

check(
  "RECHAZA cuando el proveedor no declara moneda",
  paymentMismatchReason({
    ...BASE,
    transactionAmount: 850,
    currencyId: null,
    liveMode: true,
  }) === "CURRENCY_MISMATCH",
);

check(
  "RECHAZA un monto NaN",
  paymentMismatchReason({
    ...BASE,
    transactionAmount: Number.NaN,
    currencyId: "MXN",
    liveMode: true,
  }) === "AMOUNT_MISMATCH",
);

check(
  "un live_mode desconocido (null) no bloquea por sí solo",
  paymentMismatchReason({
    ...BASE,
    transactionAmount: 850,
    currencyId: "MXN",
    liveMode: null,
  }) === null,
);

check(
  "la moneda se compara sin distinguir mayúsculas",
  paymentMismatchReason({
    ...BASE,
    transactionAmount: 850,
    currencyId: "mxn",
    liveMode: true,
  }) === null,
);

console.log(
  failures === 0
    ? "\nTodo OK: integridad del cobro y anti-replay de la firma."
    : `\n${failures} verificación(es) fallida(s).`,
);
process.exit(failures === 0 ? 0 : 1);

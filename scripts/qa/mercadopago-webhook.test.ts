/**
 * QA de Mercado Pago: firma de webhooks y mapeo de estados.
 *
 * Verifica el manifest oficial de `x-signature` (incluido el caso SIN
 * cabecera `x-request-id`, donde el segmento se omite completo) y que ningún
 * estado del proveedor caiga en un estado local inesperado.
 *
 * Correr con: npx tsx scripts/qa/mercadopago-webhook.test.ts
 */
import { createHmac } from "node:crypto";
import {
  buildSignatureManifest,
  mapPaymentStatus,
  parseSignatureHeader,
  signatureMatches,
} from "../../src/lib/payments/mercadopago-core";

const SECRET = "test-webhook-secret";

let failures = 0;
function check(name: string, ok: boolean, detail?: unknown) {
  console.log(`${ok ? "✓" : "✗"} ${name}`);
  if (!ok) {
    failures += 1;
    if (detail !== undefined) console.log(JSON.stringify(detail, null, 2));
  }
}

/** Firma como lo hace Mercado Pago: HMAC-SHA256 del manifest con el secreto. */
function signAsMercadoPago(manifest: string, ts: string): string {
  const v1 = createHmac("sha256", SECRET).update(manifest).digest("hex");
  return `ts=${ts},v1=${v1}`;
}

function verify(params: {
  header: string;
  dataId: string;
  requestId: string | null;
}): boolean {
  const parsed = parseSignatureHeader(params.header);
  if (!parsed) return false;
  return signatureMatches({
    secret: SECRET,
    manifest: buildSignatureManifest({
      dataId: params.dataId,
      requestId: params.requestId,
      ts: parsed.ts,
    }),
    v1: parsed.v1,
  });
}

// ---------------------------------------------------------------------------
// Manifest
check(
  "manifest con request-id",
  buildSignatureManifest({ dataId: "123", requestId: "req-1", ts: "1700" }) ===
    "id:123;request-id:req-1;ts:1700;",
);

check(
  "manifest SIN request-id omite el segmento entero",
  buildSignatureManifest({ dataId: "123", requestId: null, ts: "1700" }) ===
    "id:123;ts:1700;",
);

check(
  "data.id alfanumérico se normaliza a minúsculas",
  buildSignatureManifest({ dataId: "AbC9", requestId: null, ts: "1700" }) ===
    "id:abc9;ts:1700;",
);

// ---------------------------------------------------------------------------
// Verificación end-to-end contra firmas construidas como las de MP
check(
  "acepta firma válida con x-request-id",
  verify({
    header: signAsMercadoPago("id:9999;request-id:req-1;ts:1700;", "1700"),
    dataId: "9999",
    requestId: "req-1",
  }),
);

check(
  "acepta firma válida cuando MP no envía x-request-id",
  verify({
    header: signAsMercadoPago("id:9999;ts:1700;", "1700"),
    dataId: "9999",
    requestId: null,
  }),
);

check(
  "rechaza firma de otro payment id",
  !verify({
    header: signAsMercadoPago("id:1111;request-id:req-1;ts:1700;", "1700"),
    dataId: "9999",
    requestId: "req-1",
  }),
);

check(
  "rechaza v1 manipulado",
  !verify({
    header: "ts=1700,v1=deadbeef",
    dataId: "9999",
    requestId: "req-1",
  }),
);

check("rechaza cabecera sin v1", parseSignatureHeader("ts=1700") === null);
check("rechaza cabecera vacía", parseSignatureHeader(null) === null);
check(
  "tolera espacios en la cabecera",
  parseSignatureHeader(" ts=1700 , v1=abc ")?.v1 === "abc",
);

// ---------------------------------------------------------------------------
// Mapeo de estados
const EXPECTED: Record<string, [string, string]> = {
  approved: ["approved", "pagado"],
  pending: ["pending", "pendiente_pago"],
  authorized: ["pending", "pendiente_pago"],
  in_process: ["in_process", "pendiente_pago"],
  in_mediation: ["pending", "pendiente_pago"],
  rejected: ["rejected", "pago_rechazado"],
  cancelled: ["cancelled", "cancelado"],
  refunded: ["refunded", "cancelado"],
  charged_back: ["refunded", "cancelado"],
  estado_inventado: ["pending", "pendiente_pago"],
};

for (const [status, [paymentStatus, orderStatus]] of Object.entries(EXPECTED)) {
  const mapped = mapPaymentStatus(status);
  check(
    `mapPaymentStatus(${status}) → ${paymentStatus}/${orderStatus}`,
    mapped.paymentStatus === paymentStatus &&
      mapped.orderStatus === orderStatus,
    mapped,
  );
}

console.log(
  failures === 0
    ? "\nTodo OK: firma y mapeo de estados de Mercado Pago."
    : `\n${failures} verificación(es) fallida(s).`,
);
process.exit(failures === 0 ? 0 : 1);

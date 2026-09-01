/**
 * QA de la dirección de entrega del checkout.
 *
 * El pedido no puede existir sin saber a dónde se manda. Este QA ejercita el
 * esquema REAL del servidor (`src/lib/validation/checkout.ts`), no una copia,
 * y verifica además el contrato alrededor: que el snapshot se guarde antes de
 * Mercado Pago, que el webhook no se toque, que la dirección no salga a
 * ninguna vista pública y que los pedidos históricos sin dirección sigan
 * siendo válidos.
 *
 * Correr con: npx tsx scripts/qa/checkout-address.test.ts
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CheckoutSchema,
  ShippingAddressSchema,
  normalizeMexicanPhone,
} from "../../src/lib/validation/checkout";
import {
  formatAddressLines,
  isShippingAddressSnapshot,
} from "../../src/components/admin/ShippingAddressBlock";
import { sanitizeText } from "../../src/lib/security/sanitize";

const ROOT = join(__dirname, "..", "..");

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? " — " + detail : ""}`);
  if (!ok) failures += 1;
}

/** Código sin comentarios: lo que de verdad ejecuta o muestra el archivo. */
function code(...path: string[]): string {
  return readFileSync(join(ROOT, ...path), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|\s)\/\/.*$/gm, "$1");
}

/** Dirección válida de referencia: el resto de casos la mutan. */
const DIRECCION_OK = {
  recipient_name: "Ana López",
  phone: "55 1234 5678",
  email: "ana@example.com",
  postal_code: "06700",
  state: "Ciudad de México",
  municipality: "Cuauhtémoc",
  neighborhood: "Roma Norte",
  street: "Av. Álvaro Obregón",
  exterior_number: "123",
  interior_number: "4B",
  references: "Portón negro, frente a la farmacia",
};

const CHECKOUT_OK = {
  cartId: "11111111-1111-4111-8111-111111111111",
  customerName: "Ana López",
  customerEmail: "ana@example.com",
  customerPhone: "55 1234 5678",
  deliveryMethod: "shipping" as const,
  shippingAddress: DIRECCION_OK,
};

function sinCampo(campo: keyof typeof DIRECCION_OK) {
  const copia: Record<string, unknown> = { ...DIRECCION_OK };
  delete copia[campo];
  return copia;
}

// ---------------------------------------------------------------------------
// 1) Campos obligatorios: sin ellos no hay pedido.
// ---------------------------------------------------------------------------
const OBLIGATORIOS = [
  "recipient_name",
  "phone",
  "email",
  "postal_code",
  "state",
  "municipality",
  "neighborhood",
  "street",
  "exterior_number",
] as const;

for (const campo of OBLIGATORIOS) {
  check(
    `${campo} es obligatorio`,
    !ShippingAddressSchema.safeParse(sinCampo(campo)).success,
  );
  check(
    `${campo} rechaza cadena vacía o sólo espacios`,
    !ShippingAddressSchema.safeParse({ ...DIRECCION_OK, [campo]: "   " })
      .success,
  );
}

// ---------------------------------------------------------------------------
// 2) Opcionales: se puede entregar sin ellos.
// ---------------------------------------------------------------------------
for (const campo of ["interior_number", "references"] as const) {
  const parsed = ShippingAddressSchema.safeParse(sinCampo(campo));
  check(`${campo} es opcional`, parsed.success);
  check(
    `${campo} vacío no se guarda como cadena vacía`,
    ShippingAddressSchema.safeParse({ ...DIRECCION_OK, [campo]: "" }).success,
  );
}

// ---------------------------------------------------------------------------
// 3) Correo y código postal.
// ---------------------------------------------------------------------------
check(
  "email inválido se rechaza",
  !ShippingAddressSchema.safeParse({ ...DIRECCION_OK, email: "ana@" }).success,
);
for (const cp of ["1234", "123456", "abcde", ""]) {
  check(
    `código postal inválido rechazado: "${cp}"`,
    !ShippingAddressSchema.safeParse({ ...DIRECCION_OK, postal_code: cp })
      .success,
  );
}
const cpOk = ShippingAddressSchema.safeParse({
  ...DIRECCION_OK,
  postal_code: "06700",
});
check(
  "código postal de 5 dígitos aceptado",
  cpOk.success && cpOk.data.postal_code === "06700",
);

// ---------------------------------------------------------------------------
// 4) Teléfono mexicano: se acepta como lo escribe la gente y se normaliza a
//    10 dígitos. No se asume que todos escriban +52.
// ---------------------------------------------------------------------------
for (const escrito of [
  "5512345678",
  "55 1234 5678",
  "55-1234-5678",
  "(55) 1234 5678",
  "+52 55 1234 5678",
  "+52 1 55 1234 5678",
  "5215512345678",
  "044 55 1234 5678",
  "045 55 1234 5678",
]) {
  const parsed = ShippingAddressSchema.safeParse({
    ...DIRECCION_OK,
    phone: escrito,
  });
  check(
    `teléfono "${escrito}" → 5512345678`,
    parsed.success && parsed.data.phone === "5512345678",
    parsed.success ? parsed.data.phone : "rechazado",
  );
}
for (const malo of ["123", "55123456789012", "no-es-teléfono"]) {
  check(
    `teléfono inválido rechazado: "${malo}"`,
    !ShippingAddressSchema.safeParse({ ...DIRECCION_OK, phone: malo }).success,
  );
}

// ---------------------------------------------------------------------------
// 5) Normalización: trim y colapso de espacios.
// ---------------------------------------------------------------------------
const conEspacios = ShippingAddressSchema.safeParse({
  ...DIRECCION_OK,
  recipient_name: "  Ana   López  ",
  street: "  Av.   Álvaro   Obregón ",
});
check(
  "trim y colapso de espacios en los textos",
  conEspacios.success &&
    conEspacios.data.recipient_name === "Ana López" &&
    conEspacios.data.street === "Av. Álvaro Obregón",
  conEspacios.success ? `"${conEspacios.data.recipient_name}"` : "rechazado",
);

// ---------------------------------------------------------------------------
// 6) Límites de longitud: nada de payloads gigantes.
// ---------------------------------------------------------------------------
check(
  "calle demasiado larga se rechaza",
  !ShippingAddressSchema.safeParse({
    ...DIRECCION_OK,
    street: "x".repeat(121),
  }).success,
);
check(
  "referencias demasiado largas se rechazan",
  !ShippingAddressSchema.safeParse({
    ...DIRECCION_OK,
    references: "x".repeat(241),
  }).success,
);
check(
  "nombre de quien recibe demasiado largo se rechaza",
  !ShippingAddressSchema.safeParse({
    ...DIRECCION_OK,
    recipient_name: "x".repeat(81),
  }).success,
);

// ---------------------------------------------------------------------------
// 7) `.strict()`: el cliente no puede colar campos de más.
// ---------------------------------------------------------------------------
check(
  "la dirección rechaza claves desconocidas",
  !ShippingAddressSchema.safeParse({ ...DIRECCION_OK, país: "MX" }).success,
);
for (const [label, extra] of [
  ["precio", { unitPrice: 1 }],
  ["total", { total: 1 }],
  ["subtotal", { subtotal: 0 }],
  ["envío", { shipping: 0 }],
  ["estado del pago", { payment_status: "approved" }],
] as const) {
  check(
    `el checkout RECHAZA ${label} enviado por el cliente`,
    !CheckoutSchema.safeParse({ ...CHECKOUT_OK, ...extra }).success,
  );
  check(
    `la dirección RECHAZA ${label} escondido dentro del snapshot`,
    !CheckoutSchema.safeParse({
      ...CHECKOUT_OK,
      shippingAddress: { ...DIRECCION_OK, ...extra },
    }).success,
  );
}

// ---------------------------------------------------------------------------
// 8) No hay checkout de envío sin dirección.
// ---------------------------------------------------------------------------
const sinDireccion: Record<string, unknown> = { ...CHECKOUT_OK };
delete sinDireccion.shippingAddress;
check(
  "no se puede iniciar un checkout de envío sin dirección",
  !CheckoutSchema.safeParse(sinDireccion).success,
);
check(
  "una dirección incompleta tumba el checkout entero",
  !CheckoutSchema.safeParse({
    ...CHECKOUT_OK,
    shippingAddress: sinCampo("street"),
  }).success,
);
const completo = CheckoutSchema.safeParse(CHECKOUT_OK);
check("un checkout completo sí pasa", completo.success);
check(
  "la modalidad de entrega por defecto es shipping",
  (() => {
    const sinMetodo: Record<string, unknown> = { ...CHECKOUT_OK };
    delete sinMetodo.deliveryMethod;
    const p = CheckoutSchema.safeParse(sinMetodo);
    return p.success && p.data.deliveryMethod === "shipping";
  })(),
);
check(
  "no se aceptan modalidades inventadas",
  !CheckoutSchema.safeParse({ ...CHECKOUT_OK, deliveryMethod: "pickup" })
    .success,
);

// ---------------------------------------------------------------------------
// 9) El snapshot se persiste ANTES de Mercado Pago y no depende de un perfil.
// ---------------------------------------------------------------------------
const routeSrc = code("src", "app", "api", "checkout", "mercadopago", "route.ts");
// Se miran las LLAMADAS, no los imports (que van ordenados alfabéticamente y
// dirían lo contrario).
const posCrearOrden = routeSrc.indexOf("await createOrderFromCart(");
const posPreferencia = routeSrc.indexOf("await createCheckoutPreference(");
check(
  "la orden con dirección se crea ANTES de la preferencia de Mercado Pago",
  posCrearOrden > -1 && posPreferencia > -1 && posCrearOrden < posPreferencia,
);
check(
  "la dirección validada llega a la creación del pedido",
  /shippingAddress: parsed\.data\.shippingAddress/.test(routeSrc),
);

const ordersSrc = code("src", "lib", "store", "orders.ts");
check(
  "el pedido guarda la dirección",
  /shipping_address: shippingAddress/.test(ordersSrc),
);
// El insert NO escribe `delivery_method`: la columna tiene default y así el
// código funciona con y sin la migración aplicada. Si alguien la agrega al
// insert, desplegar antes de migrar rompe TODOS los checkouts.
check(
  "el insert no depende de la columna nueva (despliegue desacoplado)",
  !/delivery_method:/.test(ordersSrc),
);
// El snapshot no puede re-leerse de ningún perfil: la única fuente es lo que
// vino validado en esta petición.
check(
  "el snapshot no se rehidrata desde un perfil ni desde la base",
  !/from\("profiles"\)|from\("customers"\)|from\("addresses"\)/.test(ordersSrc),
);

// ---------------------------------------------------------------------------
// 10) Mercado Pago intacto: la dirección es metadata del pedido, no del pago.
// ---------------------------------------------------------------------------
const webhookSrc = code("src", "app", "api", "webhooks", "mercadopago", "route.ts");
check(
  "el webhook sigue validando firma e idempotencia",
  /verifyWebhookSignature|x-signature/i.test(webhookSrc) &&
    /event_id/.test(webhookSrc),
);
check(
  "el webhook sigue relacionando el pago con la orden por external_reference",
  /externalReference/.test(webhookSrc),
);
check(
  "el webhook NO toca la dirección",
  !/shipping_address/.test(webhookSrc),
);
const preferenceSrc = code("src", "lib", "payments", "mercadopago.ts");
check(
  "no se manda la dirección completa a Mercado Pago",
  !/shipping_address|shippingAddress/.test(preferenceSrc),
);

// ---------------------------------------------------------------------------
// 11) Privacidad: la dirección no viaja a logs ni a vistas públicas.
// ---------------------------------------------------------------------------
for (const [label, archivo] of [
  ["el endpoint de checkout", routeSrc],
  ["la creación del pedido", ordersSrc],
  ["el webhook", webhookSrc],
] as const) {
  check(
    `${label} no imprime nada en consola`,
    !/console\.(log|info|warn|error|debug)/.test(archivo),
  );
}
check(
  "la dirección no se mete en la URL de retorno ni en query params",
  !/shipping_address=|address=/.test(routeSrc),
);
// La confirmación pública sólo muestra zona, nunca calle ni teléfono.
const resumenPublico = code("src", "components", "store", "OrderSummaryCard.tsx");
check(
  "la confirmación pública no muestra calle, número ni teléfono",
  !/\.street|\.exterior_number|\.interior_number|\.phone|\.recipient_name|\.postal_code|\.references/.test(
    resumenPublico,
  ),
);
check(
  "la confirmación pública sí confirma la zona de entrega",
  /neighborhood/.test(resumenPublico) && /municipality/.test(resumenPublico),
);
// El bloque completo vive sólo en el admin.
const adminBlock = code("src", "components", "admin", "ShippingAddressBlock.tsx");
check(
  "el bloque con la dirección completa vive en el admin",
  /recipient_name/.test(adminBlock) && /street/.test(adminBlock),
);
check(
  "el bloque del admin tampoco escribe en consola",
  !/console\.(log|info|warn|error|debug)/.test(adminBlock),
);

// ---------------------------------------------------------------------------
// 12) Pedidos históricos: sin dirección siguen siendo válidos y no revientan.
// ---------------------------------------------------------------------------
check(
  "el tipo del pedido admite dirección nula (históricos)",
  /shipping_address: ShippingAddressSnapshot \| null/.test(
    code("src", "lib", "db", "types.ts"),
  ),
);
check(
  "el admin declara 'Dirección no registrada' en vez de romper",
  /Direcci.n no registrada/.test(
    readFileSync(
      join(ROOT, "src", "components", "admin", "ShippingAddressBlock.tsx"),
      "utf8",
    ),
  ) && /if \(!isShippingAddressSnapshot\(address\)\)/.test(adminBlock),
);
check(
  "la confirmación pública tolera un pedido sin dirección",
  /order\.shipping_address &&/.test(resumenPublico),
);

// ---------------------------------------------------------------------------
// 13) La migración es aditiva y segura para lo que ya existe.
// ---------------------------------------------------------------------------
const migracion = readFileSync(
  join(ROOT, "supabase", "migrations", "0006_orders_delivery.sql"),
  "utf8",
);
const migracionSql = migracion
  .split("\n")
  .filter((l) => !l.trimStart().startsWith("--"))
  .join("\n");
check(
  "la migración no borra ni destruye nada",
  !/\b(drop\s+table|drop\s+column|truncate|delete\s+from)\b/i.test(
    migracionSql,
  ),
);
check(
  "la migración es idempotente",
  /add column if not exists/i.test(migracionSql),
);
check(
  "la migración no vuelve obligatoria la dirección en base (rompería históricos)",
  !/shipping_address[^\n]*not null/i.test(migracionSql),
);
check(
  "la migración agrega la modalidad de entrega con default",
  /delivery_method text not null default 'shipping'/i.test(migracionSql),
);

// ---------------------------------------------------------------------------
// 14) COMPORTAMIENTO, no contrato: la limpieza no puede vaciar un campo
//     obligatorio en silencio.
//
//     `sanitizeText` borra `<...>` COMPLETO. Cuando corría DESPUÉS de Zod,
//     "Av. 5 de Mayo <esquina Juárez>" se guardaba como "Av. 5 de Mayo" y
//     "<S/N>" como "": el pedido se cobraba con la dirección mutilada y sin
//     error para nadie. Ahora la limpieza vive DENTRO del esquema, así que lo
//     que Zod aprueba es exactamente lo que se guarda.
// ---------------------------------------------------------------------------
for (const [campo, escrito, esperado] of [
  ["street", "Av. 5 de Mayo <esquina Juárez>", "Av. 5 de Mayo esquina Juárez"],
  ["neighborhood", "Roma <Norte>", "Roma Norte"],
  ["recipient_name", "Ana <López>", "Ana López"],
] as const) {
  const parsed = ShippingAddressSchema.safeParse({
    ...DIRECCION_OK,
    [campo]: escrito,
  });
  const guardado = parsed.success
    ? sanitizeText(parsed.data[campo] as string, 240)
    : "(rechazado)";
  check(
    `${campo}: el texto sobrevive a la limpieza ("${escrito}")`,
    parsed.success && guardado === esperado,
    guardado,
  );
}
// "S/N" (sin número) es una dirección mexicana legítima: con la limpieza
// anterior "<S/N>" se guardaba VACÍO; ahora conserva el texto.
const sn = ShippingAddressSchema.safeParse({
  ...DIRECCION_OK,
  exterior_number: "<S/N>",
});
check(
  'exterior_number: "<S/N>" conserva el texto en vez de vaciarse',
  sn.success && sn.data.exterior_number === "S/N",
  sn.success ? sn.data.exterior_number : "rechazado",
);
// Lo que SÍ queda vacío tras limpiar se RECHAZA con el error del campo, en vez
// de guardarse en blanco.
for (const [campo, escrito] of [
  ["exterior_number", "<>"],
  ["street", "  <>  "],
  ["neighborhood", "<<>>"],
] as const) {
  check(
    `${campo}: "${escrito}" se rechaza en vez de guardarse vacío`,
    !ShippingAddressSchema.safeParse({ ...DIRECCION_OK, [campo]: escrito })
      .success,
  );
}
// Y ninguna etiqueta puede sobrevivir: sin `<` ni `>` no hay HTML posible.
const conScript = ShippingAddressSchema.safeParse({
  ...DIRECCION_OK,
  street: "<script>alert(1)</script>Calle Real",
});
check(
  "ningún campo guardado conserva < o >",
  conScript.success &&
    !/[<>]/.test(conScript.data.street) &&
    conScript.data.street.includes("Calle Real"),
  conScript.success ? conScript.data.street : "rechazado",
);
// Y ningún campo obligatorio del snapshot puede llegar vacío a la base.
const limpio = ShippingAddressSchema.safeParse(DIRECCION_OK);
check(
  "ningún campo obligatorio queda vacío después de sanear",
  limpio.success &&
    OBLIGATORIOS.every(
      (campo) => sanitizeText(limpio.data[campo] as string, 240) !== "",
    ),
);

// ---------------------------------------------------------------------------
// 15) El admin no puede caerse por un jsonb con otra forma.
//
//     `ShippingAddressBlock` es componente de cliente y el panel no tiene
//     error boundary: una excepción ahí tumba la lista COMPLETA de pedidos.
//     Una dirección editada a mano en Supabase, o con la forma vieja, no puede
//     costar la única vista de pedidos que hay.
// ---------------------------------------------------------------------------
const MALFORMADAS: [string, unknown][] = [
  ["null", null],
  ["objeto vacío", {}],
  ["forma anterior", {
    street: "Av. 5 de Mayo",
    exterior: "123",
    city: "Cuauhtémoc",
    zip: "06700",
    state: "CDMX",
  }],
  ["texto plano", "una dirección en texto plano"],
  ["arreglo", []],
  ["números", { street: 123, postal_code: 6700 }],
  ["parcial", { street: "Av. 5 de Mayo" }],
];
for (const [label, valor] of MALFORMADAS) {
  let lanzo = false;
  try {
    formatAddressLines(valor);
  } catch {
    lanzo = true;
  }
  check(`formatAddressLines no lanza con ${label}`, !lanzo);
  check(
    `${label} no se toma por una dirección válida`,
    !isShippingAddressSnapshot(valor),
  );
}
check(
  "un snapshot completo sí se reconoce como válido",
  isShippingAddressSnapshot(limpio.success ? limpio.data : null),
);
check(
  "el snapshot completo produce las 4 líneas de dirección",
  formatAddressLines(limpio.success ? limpio.data : null).length === 4,
  `${formatAddressLines(limpio.success ? limpio.data : null).join(" / ")}`,
);

// ---------------------------------------------------------------------------
// 16) Cliente y servidor comparten el MISMO normalizador de teléfono.
// ---------------------------------------------------------------------------
const formSrc = code("src", "components", "store", "CheckoutForm.tsx");
check(
  "el formulario reusa el normalizador del servidor",
  /normalizeMexicanPhone/.test(formSrc),
);
check(
  "el formulario ya no tiene su propia regla de teléfono",
  !/replace\(\/\^521\?\//.test(formSrc),
);
// El teléfono se guarda en UN solo formato en las dos columnas.
const contacto = CheckoutSchema.safeParse({
  ...CHECKOUT_OK,
  customerPhone: "+52 (55) 1234-5678",
  shippingAddress: { ...DIRECCION_OK, phone: "044 55 1234 5678" },
});
check(
  "customer_phone y shipping_address.phone quedan en el mismo formato",
  contacto.success &&
    contacto.data.customerPhone === "5512345678" &&
    contacto.data.shippingAddress.phone === "5512345678",
  contacto.success
    ? `${contacto.data.customerPhone} / ${contacto.data.shippingAddress.phone}`
    : "rechazado",
);
check(
  "el normalizador exportado y el esquema coinciden",
  normalizeMexicanPhone("+52 1 55 1234 5678") === "5512345678",
);

console.log(
  failures === 0
    ? `\n✓ QA dirección de entrega OK — snapshot obligatorio y validado en servidor, guardado antes de Mercado Pago, visible sólo en el admin y compatible con pedidos históricos.`
    : `\n✗ QA dirección de entrega: ${failures} fallo(s).`,
);
process.exit(failures === 0 ? 0 : 1);

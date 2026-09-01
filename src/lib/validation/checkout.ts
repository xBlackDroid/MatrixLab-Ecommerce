import { z } from "zod";

/**
 * Validación del checkout.
 *
 * La dirección de entrega es un SNAPSHOT del pedido: se valida y se guarda tal
 * como el cliente la escribió al comprar, y nunca se re-lee de un perfil
 * mutable. Si mañana cambia su domicilio, el pedido debe seguir diciendo a
 * dónde se envió.
 *
 * Esta validación es la que MANDA: el formulario valida lo mismo para dar
 * errores rápidos, pero el servidor no confía en él. Un pedido de envío sin
 * dirección completa se rechaza aquí, antes de crear la orden y antes de
 * tocar Mercado Pago.
 */

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

/** Recorta y colapsa espacios internos; los campos de dirección son de una línea. */
const oneLine = (max: number) =>
  z
    .string()
    .transform((v) => v.replace(/\s+/g, " ").trim())
    .pipe(z.string().min(1).max(max));

/**
 * Teléfono mexicano. Se acepta como lo escribe la gente —con espacios,
 * guiones, paréntesis, con o sin +52— y se NORMALIZA a los 10 dígitos
 * nacionales, que es lo único que sirve para marcar o abrir WhatsApp.
 *
 * No se asume que el cliente escriba el código de país: "55 1234 5678",
 * "+52 55 1234 5678" y "5215512345678" terminan igual.
 */
const mexicanPhone = z
  .string()
  .max(25, "Teléfono demasiado largo")
  .transform((raw) => {
    let digits = raw.replace(/\D/g, "");
    // 044 / 045: el prefijo de larga distancia a celular que México retiró en
    // 2019. Sigue siendo lo que teclea mucha gente, así que se acepta y se
    // limpia en vez de rechazar un teléfono que sí es correcto.
    if (digits.length === 13 && /^04[45]/.test(digits)) digits = digits.slice(3);
    else if (digits.length === 13 && digits.startsWith("521")) digits = digits.slice(3);
    else if (digits.length === 12 && digits.startsWith("52")) digits = digits.slice(2);
    else if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
    return digits;
  })
  .pipe(
    z
      .string()
      .regex(/^[0-9]{10}$/, "Escribe los 10 dígitos de tu teléfono"),
  );

/** Código postal mexicano: exactamente 5 dígitos. */
const mexicanPostalCode = z
  .string()
  .transform((v) => v.replace(/\D/g, ""))
  .pipe(z.string().regex(/^[0-9]{5}$/, "El código postal son 5 dígitos"));

/**
 * Snapshot de dirección de entrega. Todos los campos son obligatorios salvo
 * número interior y referencias: sin ellos igual se puede entregar.
 *
 * `.strict()` a propósito: un payload con claves de más se rechaza en vez de
 * guardarse a medias. Es también lo que impide que el cliente cuele campos
 * ajenos (precios, totales) por esta puerta.
 */
export const ShippingAddressSchema = z
  .object({
    recipient_name: oneLine(80),
    phone: mexicanPhone,
    email: z.email("Correo inválido").max(120),
    postal_code: mexicanPostalCode,
    state: oneLine(80),
    municipality: oneLine(80),
    neighborhood: oneLine(80),
    street: oneLine(120),
    exterior_number: oneLine(20),
    interior_number: z.preprocess(emptyToUndefined, oneLine(20).optional()),
    references: z.preprocess(
      emptyToUndefined,
      z
        .string()
        .transform((v) => v.replace(/\s+/g, " ").trim())
        .pipe(z.string().max(240))
        .optional(),
    ),
  })
  .strict();

export type ShippingAddressInput = z.input<typeof ShippingAddressSchema>;

/**
 * Modalidad de entrega. Hoy la tienda sólo hace envío a domicilio; el enum
 * existe para que agregar una modalidad futura sea explícito y no una cadena
 * suelta. Espeja `orders.delivery_method` (migración 0006).
 */
export const DeliveryMethodSchema = z.literal("shipping");

export const CheckoutSchema = z
  .object({
    cartId: z.uuid(),
    customerName: z.string().min(2).max(80),
    customerEmail: z.preprocess(emptyToUndefined, z.email().max(120).optional()),
    customerPhone: z
      .string()
      .min(8)
      .max(25)
      .regex(/^[0-9+()\s-]+$/, "Teléfono inválido"),
    deliveryMethod: DeliveryMethodSchema.default("shipping"),
    shippingAddress: ShippingAddressSchema,
    notes: z.preprocess(emptyToUndefined, z.string().max(500).optional()),
  })
  .strict();

export type CheckoutInput = z.infer<typeof CheckoutSchema>;

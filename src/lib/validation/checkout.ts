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

/**
 * Limpieza de un campo de dirección.
 *
 * Se hace DENTRO del esquema, no después: si la limpieza corriera al guardar
 * —como hacía `sanitizeText`, que borra `<...>` COMPLETO— un campo obligatorio
 * podía quedar vacío después de haber pasado la validación. "Av. 5 de Mayo
 * <esquina Juárez>" se guardaba como "Av. 5 de Mayo" y "<S/N>" como "", sin
 * error para nadie y con el pedido ya cobrado.
 *
 * Aquí se quitan los signos `<` y `>` pero se CONSERVA el texto: una dirección
 * no puede contener etiquetas HTML, pero sí puede decir "esquina Juárez" o
 * "S/N". Es más estricto que borrar el tramo (ninguna etiqueta sobrevive) y
 * además no pierde información. Lo que quede vacío lo rechaza el `.min(1)` de
 * abajo con el mensaje del campo, en vez de guardarse en blanco.
 */
const limpiar = (v: string) =>
  v
    .replace(/[<>]/g, "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

/** Campo de dirección de una línea, ya limpio y con longitud acotada. */
const oneLine = (max: number) =>
  z.string().transform(limpiar).pipe(z.string().min(1).max(max));

/**
 * Teléfono mexicano. Se acepta como lo escribe la gente —con espacios,
 * guiones, paréntesis, con o sin +52— y se NORMALIZA a los 10 dígitos
 * nacionales, que es lo único que sirve para marcar o abrir WhatsApp.
 *
 * No se asume que el cliente escriba el código de país: "55 1234 5678",
 * "+52 55 1234 5678" y "5215512345678" terminan igual.
 */
/**
 * Normaliza un teléfono mexicano a sus 10 dígitos nacionales. Exportada para
 * que el formulario aplique EXACTAMENTE la misma regla que el servidor: con
 * dos implementaciones distintas, el cliente rechazaba formatos que el
 * servidor sí acepta (044/045) y el usuario nunca llegaba a la rama que los
 * arregla.
 */
export function normalizeMexicanPhone(raw: string): string {
  let digits = raw.replace(/\D/g, "");
    // 044 / 045: el prefijo de larga distancia a celular que México retiró en
    // 2019. Sigue siendo lo que teclea mucha gente, así que se acepta y se
    // limpia en vez de rechazar un teléfono que sí es correcto.
    if (digits.length === 13 && /^04[45]/.test(digits)) digits = digits.slice(3);
    else if (digits.length === 13 && digits.startsWith("521")) digits = digits.slice(3);
    else if (digits.length === 12 && digits.startsWith("52")) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  return digits;
}

const mexicanPhone = z
  .string()
  .max(25, "Teléfono demasiado largo")
  .transform(normalizeMexicanPhone)
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
      z.string().transform(limpiar).pipe(z.string().max(240)).optional(),
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
    // Mismo normalizador que la dirección: así `orders.customer_phone` y
    // `shipping_address.phone` guardan el teléfono en UN solo formato y no
    // pueden acabar siendo dos números distintos.
    customerPhone: mexicanPhone,
    deliveryMethod: DeliveryMethodSchema.default("shipping"),
    shippingAddress: ShippingAddressSchema,
    notes: z.preprocess(emptyToUndefined, z.string().max(500).optional()),
  })
  .strict();

export type CheckoutInput = z.infer<typeof CheckoutSchema>;

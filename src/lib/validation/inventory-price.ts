import { z } from "zod";
import { isValidPriceAmount } from "@/lib/store/inventory-pricing";

/**
 * Edición del precio de UNA variante desde Inventario.
 *
 * - `price`: nuevo precio de la variante, o `null` para quitar el precio
 *   propio y volver a heredar el precio base. Es obligatorio: un cuerpo sin
 *   `price` nunca se interpreta como "quitar" ni como 0.
 * - `expectedPrice`: el `product_variants.price` que el admin tenía en
 *   pantalla (null si heredaba). Si la base ya no coincide, otro dispositivo
 *   lo cambió y la API responde 409 sin escribir.
 *
 * Sólo números JSON: nada de cadenas ni coerción ("199,50" se interpreta en
 * el navegador, que ya mostró al admin el valor exacto).
 */
const PriceAmountSchema = z
  .number()
  .refine(isValidPriceAmount, { message: "Precio inválido" });

/**
 * El precio leído puede venir de datos anteriores a este editor: se acepta
 * cualquier `numeric(12,2)` no negativo, no sólo los capturables aquí.
 */
const ExpectedPriceSchema = z
  .number()
  .refine(
    (n) => Number.isFinite(n) && n >= 0 && n < 10_000_000_000,
    { message: "Precio esperado inválido" },
  );

export const InventoryPriceUpdateSchema = z
  .object({
    variantId: z.uuid(),
    price: PriceAmountSchema.nullable(),
    expectedPrice: ExpectedPriceSchema.nullable(),
  })
  .strict();

export type InventoryPriceUpdate = z.infer<typeof InventoryPriceUpdateSchema>;

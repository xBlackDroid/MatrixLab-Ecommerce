import { z } from "zod";

export const CartAddItemSchema = z
  .object({
    productId: z.uuid(),
    variantId: z.uuid().optional(),
    quantity: z.number().int().positive().max(999),
    designProjectId: z.uuid().optional(),
  })
  .strict();

export type CartAddItemInput = z.infer<typeof CartAddItemSchema>;

/** itemId viaja en la URL (/api/cart/items/[id]) y se valida con UuidSchema. */
export const CartUpdateItemSchema = z
  .object({
    quantity: z.number().int().positive().max(999),
  })
  .strict();

export type CartUpdateItemInput = z.infer<typeof CartUpdateItemSchema>;

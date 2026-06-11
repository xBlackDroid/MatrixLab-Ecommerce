import { z } from "zod";

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

export const ShippingAddressSchema = z
  .object({
    street: z.string().max(120).optional(),
    exterior: z.string().max(20).optional(),
    interior: z.string().max(20).optional(),
    neighborhood: z.string().max(80).optional(),
    city: z.string().max(80).optional(),
    state: z.string().max(80).optional(),
    zip: z.string().max(10).optional(),
    country: z.string().max(56).optional(),
    references: z.string().max(240).optional(),
  })
  .strict();

export const CheckoutSchema = z
  .object({
    cartId: z.uuid(),
    customerName: z.string().min(2).max(80),
    customerEmail: z.preprocess(emptyToUndefined, z.email().max(120).optional()),
    customerPhone: z
      .string()
      .min(8)
      .max(20)
      .regex(/^[0-9+()\s-]+$/, "Teléfono inválido"),
    shippingAddress: ShippingAddressSchema.optional(),
    notes: z.preprocess(emptyToUndefined, z.string().max(500).optional()),
  })
  .strict();

export type CheckoutInput = z.infer<typeof CheckoutSchema>;
